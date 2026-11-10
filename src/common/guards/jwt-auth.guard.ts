import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { TusuarioMnuItem } from '../../modules/users/entities/usuarios-mnuitem.entity';

/** Métodos que escriben en el sistema (transacciones/operaciones). */
const METODOS_ESCRITURA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Rutas exentas del bloqueo por fecha desalineada.
 * Debe poder ejecutarse aunque la Fecha del Sistema esté mal, si no no habría
 * forma de corregirla (circuito cerrado).
 */
const RUTAS_EXENTAS = ['/parametros/fechas-sistema'];

// ═══════════════ Permisos de módulo (tusuariomnuitem) ═══════════════
//
// Regla (11/10/2026): un usuario solo puede usar los endpoints de un módulo
// si tiene AL MENOS UN item de menú activo (`sn_activo='S'`) en
// `tusuariomnuitem` para ese `moduloId` (y su empresa). Sin esa asignación
// la API responde 403 — ocultar el menú NO es seguridad.
//
// Fuente de verdad de los IDs: tabla `tmodulos` (empresa 2):
//   1=CONFIGURACION · 2=INVENTARIOS · 3=FACTURACION · 4=CXC · 5=CXP
//   6=BANCOS · 7=CONTABILIDAD · 8=PLANILLA · 9=MENU · 11=CORRELATIVOS
// (Los items del menú de /configuracion viven en el módulo 11 — dato real
//  de tusuariomnuitem; el módulo 1 no tiene items asignados.)

/** Prefijo de URL del API → moduloId de tmodulos */
const MAPA_MODULOS: Record<string, number> = {
  inventario: 2,
  facturacion: 3,
  cxc: 4,
  cxp: 5,
  bancos: 6,
  contabilidad: 7,
  planilla: 8,
  users: 11,
  companies: 11,
  sucursales: 11,
  modulos: 11,
  parametros: 11,
};

/** Prefijos exentos del chequeo de módulo (cualquier método) */
const PREFIJOS_EXENTOS = new Set(['auth', 'todopago']);

/** Prefijos con lectura (GET) compartida: catálogos/contexto usados por todos los módulos */
const LECTURA_COMPARTIDA = new Set(['parametros', 'companies', 'sucursales']);

/**
 * Subrutas con lectura (GET) compartida por módulo:
 * facturación/tienda necesitan productos y clientes sin tener los módulos
 * de inventario/cxc asignados explícitamente.
 */
const LECTURA_PARCIAL: Record<string, string[]> = {
  inventario: ['productos', 'tienda', 'existencias'],
  cxc: ['clientes', 'cajeros'],
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly fechaSistema: FechaSistemaService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  /**
   * 1. Autentica el JWT (heredado).
   * 2. Si es una escritura, exige que `tempresas.fechasistema` coincida con la
   *    fecha del servidor, salvo usuario exceptuado por rango vigente en `tfecdet`.
   * 3. Si el usuario TIENE un rango vigente en `tfecdet`, valida además que
   *    ninguna fecha de documento enviada en el body esté fuera del rango
   *    [desde, hasta]. `fecharegistro` queda FUERA de esta validación: ya no
   *    lo controla el cliente, lo impone el backend con
   *    `FechaSistemaService.obtenerFechaRegistro()` (reglas 1 y 4).
   *
   * Los GET/HEAD/OPTIONS siempre pasan para que la UI pueda cargar y ofrecer
   * la corrección de la fecha.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) return true;

    const autorizado = await super.canActivate(context);
    if (!autorizado) return false;

    const req = context.switchToHttp().getRequest();

    // Validar roles si @Roles está presente
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles: string[] = req?.user?.roles ?? [];
      if (!requiredRoles.some((role) => userRoles.includes(role))) {
        throw new ForbiddenException(
          `Requiere uno de los roles: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Permisos de módulo (tusuariomnuitem): aplica a GET y escrituras
    await this.validarPermisoModulo(req);

    const metodo = String(req?.method || '').toUpperCase();
    if (!METODOS_ESCRITURA.has(metodo)) return true;

    const ruta = String(req?.path || req?.url || '').split('?')[0];
    if (RUTAS_EXENTAS.some((r) => ruta.endsWith(r))) return true;

    const usuario = req?.user?.usuario;
    const empresaId = req?.user?.empresaId;

    await this.fechaSistema.exigirFechaVigente(usuario, empresaId);

    // Validación especial: con rango vigente activo, ninguna fecha del
    // payload puede caer fuera de [fec_vig_desde, fec_vig_hasta].
    const rango = await this.fechaSistema.getRangoActivo(usuario, empresaId);
    if (rango) this.fechaSistema.validarFechasDentroDelRango(rango, req?.body);

    return true;
  }

  /**
   * Valida que el usuario tenga AL MENOS UN item de menú activo en
   * `tusuariomnuitem` para el módulo que posee el endpoint (ver
   * MAPA_MODULOS). Aplica a todos los verbos salvo las lecturas
   * compartidas (catálogos/contexto) y los prefijos exentos.
   *
   * Fallo = 403 (fail-closed): un prefijo nuevo sin mapear queda bloqueado
   * hasta agregarlo a MAPA_MODULOS — mejor que quede visible en desarrollo
   * a que un módulo nuevo quede abierto en producción.
   */
  private async validarPermisoModulo(req: any): Promise<void> {
    const metodo = String(req?.method || 'GET').toUpperCase();
    const url = String(req?.originalUrl || req?.url || '').split('?')[0];
    const relativa = url.startsWith('/api/') ? url.slice(5) : url.replace(/^\/api/, '');
    const partes = relativa.split('/').filter(Boolean);
    const prefijo = partes[0] || '';
    const sub = partes[1] || '';

    if (!prefijo) return;
    if (PREFIJOS_EXENTOS.has(prefijo)) return;
    // Menú propio: cualquier usuario necesita poder cargar su menú
    // (el chequeo de módulos depende de ese mismo endpoint).
    if (prefijo === 'users' && sub === 'menu-items') return;

    // Lecturas compartidas: catálogos y lookups usados por todos los módulos
    if (metodo === 'GET') {
      if (LECTURA_COMPARTIDA.has(prefijo)) return;
      const subOk = LECTURA_PARCIAL[prefijo];
      if (subOk && subOk.includes(sub)) return;
    }

    // Tienda online + pedidos del cliente: canal de venta. El checkout exige
    // JWT (login) pero NO permiso de módulo 3: los clientes registrados no
    // tienen asignación en tusuariomnuitem. El catálogo/carrito son @Public().
    // Subrutas del canal cliente en pedidos-virtual:
    //   pedidos (maestro/checkout), pedidos-det (líneas), combos-ofertas (ofertas)
    if (prefijo === 'facturacion' && ['tienda', 'pedidos', 'pedidos-det', 'combos-ofertas', 'facturas'].includes(sub)) return;

    const moduloId = MAPA_MODULOS[prefijo];
    if (moduloId == null) {
      throw new ForbiddenException(
        `Endpoint no configurado en permisos de módulo: /${prefijo} (agregar a MAPA_MODULOS)`,
      );
    }

    const usuario = req?.user?.usuario;
    const empresaId = req?.user?.empresaId;
    if (!usuario || !empresaId) {
      throw new ForbiddenException('Sin contexto de usuario para validar permisos');
    }

    const ok = await this.dataSource
      .getRepository(TusuarioMnuItem)
      .createQueryBuilder('m')
      .select('1', 'ok')
      .where('m.usuario = :usuario', { usuario })
      .andWhere('m.empresaId = :empresaId', { empresaId })
      .andWhere('m.sn_activo = :sn', { sn: 'S' })
      .andWhere('m.moduloId = :moduloId', { moduloId })
      .getRawOne();

    if (!ok) {
      throw new ForbiddenException('Sin permiso de acceso al módulo requerido');
    }
  }
}

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    const roles: string[] = user?.roles ?? [];
    if (!requiredRoles.some((role) => roles.includes(role))) {
      // 403 explícito con mensaje (antes devolvía false → 403 genérico sin detalle)
      throw new ForbiddenException(
        `Requiere uno de los roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
