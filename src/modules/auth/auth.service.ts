import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from '../users/entities/usuario.entity';
import { TusuarioInfo } from '../users/entities/usuario-info.entity';
import { PlEmpleados } from '../planilla/entities/plempleados.entity';
import { RolesService } from '../users/roles.service';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usersRepo: Repository<Tusuarios>,
    @InjectRepository(TusuarioInfo)
    private readonly infoRepo: Repository<TusuarioInfo>,
    @InjectRepository(PlEmpleados)
    private readonly empleadosRepo: Repository<PlEmpleados>,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  /**
   * Autentica al usuario y lo clasifica como cliente/empleado por DATOS
   * (decisión 08/10/2026: "los datos mandan"; el checkbox "Soy cliente"
   * del frontend es solo preferencia visual persistida).
   *
   * Reglas:
   * - Sin fila en `tusuariosinfoinfo` → 401 "Usuario no autorizado"
   *   (bloqueo estricto: aplica a usuarios sin info hasta darles de alta).
   * - `empleadoId` no nulo que resuelve en `plempleados` con
   *   `sn_activo='S'` → tipo 'E' (acceso completo al ERP).
   * - Si NO resuelve como empleado activo (nulo, inexistente o inactivo)
   *   y `sn_cliente='S'` → tipo 'C' (cliente: acceso solo a las 4 rutas
   *   de tienda/pedidos). Corrección 09/10/2026: aplica aunque el
   *   `empleadoId` apunte a un empleado inexistente (p.ej. 0).
   * - Si NO resuelve como empleado activo y `sn_cliente` ≠ 'S' → 401
   *   "Usuario no autorizado" (empleado sin vínculo válido).
   * - La vigencia ya la dio el `findOne` inicial con `sn_activo='S'`.
   */
  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: {
        usuario: dto.usuario,
        sn_activo: 'S',
      },
    });

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // ── Clasificación cliente/empleado por datos ──
    const info = await this.infoRepo.findOne({
      where: { usuarioId: user.usuarioId },
    });

    if (!info) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    let tipoPersona: 'C' | 'E' | null = null;

    // Empleado: solo si el vínculo resuelve en plempleados activo
    if (info.empleadoId != null) {
      const empleado = await this.empleadosRepo.findOne({
        where: { empleadoId: info.empleadoId },
      });
      if (empleado && empleado.sn_activo === 'S') {
        tipoPersona = 'E';
      }
    }

    // Cliente: si no es empleado activo, sn_cliente='S' da acceso de cliente
    if (tipoPersona == null && info.sn_cliente === 'S') {
      tipoPersona = 'C';
    }

    // Sin clasificación válida → no autorizado
    if (tipoPersona == null) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    const payload: JwtPayload = {
      usuarioId: user.usuarioId,
      usuario: user.usuario,
      empresaId: user.empresaId,
    };

    // Roles del usuario (ttipo_rol vía tusuarios_rol) para autorizaciones por módulo
    const roles = await this.rolesService.getRoles(user.usuario, user.empresaId);

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        usuarioId: user.usuarioId,
        usuario: user.usuario,
        nombre: user.nombre,
        email: user.email,
        empresaId: user.empresaId,
        idsucursal: user.Idsucursal,
        roles,
        tipoPersona,
        sn_cliente: info.sn_cliente,
      },
    };
  }

  /**
   * Perfil completo del usuario autenticado (mismo shape que `login`) para
   * `GET /auth/me`. ARFM20261030: antes devolvía solo `{usuario, nombre,
   * empresaId, idsucursal}` (el objeto de `JwtStrategy.validate`), y el
   * frontend lo usaba para SOBRESCRIBIR el usuario completo del login → se
   * perdían `usuarioId`, `roles` y `tipoPersona` en cada navegación (rompía
   * la precarga de gestores en facturación, `esRolContabilidad` y el
   * redirect de clientes tipo 'C').
   */
  async getPerfil(usuario: string) {
    const user = await this.usersRepo.findOne({
      where: { usuario, sn_activo: 'S' },
    });
    if (!user) {
      throw new UnauthorizedException('Token no válido');
    }

    const info = await this.infoRepo.findOne({
      where: { usuarioId: user.usuarioId },
    });

    let tipoPersona: 'C' | 'E' | null = null;
    if (info?.empleadoId != null) {
      const empleado = await this.empleadosRepo.findOne({
        where: { empleadoId: info.empleadoId },
      });
      if (empleado && empleado.sn_activo === 'S') {
        tipoPersona = 'E';
      }
    }
    if (tipoPersona == null && info?.sn_cliente === 'S') {
      tipoPersona = 'C';
    }

    const roles = await this.rolesService.getRoles(user.usuario, user.empresaId);

    return {
      usuarioId: user.usuarioId,
      usuario: user.usuario,
      nombre: user.nombre,
      email: user.email,
      empresaId: user.empresaId,
      idsucursal: user.Idsucursal,
      roles,
      tipoPersona,
      sn_cliente: info?.sn_cliente ?? 'N',
    };
  }

  async validateUser(usuario: string, empresaId: number) {
    return this.usersRepo.findOne({
      where: { usuario, empresaId, sn_activo: 'S' },
    });
  }

  /**
   * Registro público de usuario (endpoint sin autenticación).
   * Alta ATÓMICA en `tusuarios` + `tusuariosinfoinfo` (una sola transacción).
   *
   * Notas:
   * - `usuarioId` es AUTO_INCREMENT en BD → no se envía.
   * - Sin contexto de empresa en una petición pública → se usa la empresa
   *   por defecto del sistema (empresa 2 AUTOSEL, única activa) y sucursal 1.
   * - Si el usuario solicitado ya existe se le agrega sufijo 2, 3... (máx. 20).
   * - Documento único por (tipodoc, nrodocumento) → 409.
   * - Fecha de nacimiento: año entre 1931 y el año de la Fecha del Sistema.
   * - La contraseña pasa las reglas del DTO (8 + mayúscula + número +
   *   especial) y se guarda con el mismo criterio que `users.service.create`
   *   (login compara en texto plano: `user.password !== dto.password`).
   * - El usuario nace sin roles (`tusuarios_rol`) ni items de menú
   *   (`tusuariomnuitem`): se asignan después desde Usuarios.
   */
  async register(dto: RegisterDto) {
    const EMPRESA_DEFAULT = 2; // AUTOSEL
    const SUCURSAL_DEFAULT = 1;

    const solicitado = dto.usuario.trim();
    if (!solicitado) {
      throw new BadRequestException('Ingrese un usuario');
    }
    if (/\s/.test(solicitado)) {
      throw new BadRequestException('El usuario no debe contener espacios');
    }

    // ── Usuario: si ya existe, sufijo 2, 3... automático (máx. 20) ──
    let usuario = solicitado.slice(0, 20);
    if (await this.usersRepo.findOne({ where: { usuario } })) {
      let disponible = '';
      for (let i = 2; i <= 99; i++) {
        const sufijo = String(i);
        const candidato = solicitado.slice(0, 20 - sufijo.length) + sufijo;
        if (!(await this.usersRepo.findOne({ where: { usuario: candidato } }))) {
          disponible = candidato;
          break;
        }
      }
      if (!disponible) {
        throw new ConflictException(
          `No se pudo generar un usuario disponible para ${solicitado}`,
        );
      }
      usuario = disponible;
    }

    // ── Correo único ──
    const email = dto.email.trim();
    if (await this.usersRepo.findOne({ where: { email } })) {
      throw new ConflictException(`El correo ${email} ya está registrado`);
    }

    // ── Documento único (tipodoc, nrodocumento) ──
    const nrodocumento = dto.nrodocumento.trim();
    const docExistente = await this.infoRepo.findOne({
      where: { tipodoc: dto.tipodoc, nrodocumento },
    });
    if (docExistente) {
      throw new ConflictException(`El documento ${nrodocumento} ya está registrado`);
    }

    // ── Empleado vinculado (opcional): debe existir y su documento debe
    //    coincidir con el nrodocumento ingresado (mismo criterio del
    //    filtro del formulario: tusuariosinfoinfo.nrodocumento = plempleados.nrodocumento) ──
    let empleadoId: number | null = null;
    if (dto.empleadoId != null) {
      const empleado = await this.empleadosRepo.findOne({
        where: { empleadoId: dto.empleadoId },
      });
      if (!empleado) {
        throw new BadRequestException('El empleado seleccionado no existe');
      }
      if ((empleado.nrodocumento || '').trim() !== nrodocumento) {
        throw new BadRequestException(
          'El documento del empleado seleccionado no coincide con el nrodocumento ingresado',
        );
      }
      empleadoId = empleado.empleadoId;
    }

    // ── Fecha de nacimiento: año 1931 .. año de la Fecha del Sistema ──
    // Parseo manual: `new Date('YYYY-MM-DD')` se interpreta como UTC y al
    // escribirlo MySQL lo desplaza al huso local (guardaba 14 de mayo 18:00
    // en vez de 15 de mayo). Se construye como fecha LOCAL a mediodía
    // (evita bordes de DST; Honduras no usa DST).
    const partes = dto.fechanacimiento.slice(0, 10).split('-').map(Number);
    const [anioNac, mesNac, diaNac] = partes;
    const fechaNac = new Date(anioNac, (mesNac || 1) - 1, diaNac || 1, 12, 0, 0);
    if (Number.isNaN(fechaNac.getTime()) || Number.isNaN(anioNac)) {
      throw new BadRequestException('Fecha de nacimiento no válida');
    }
    const fechaSistema = await this.fechaSistema.getFecha(EMPRESA_DEFAULT);
    const anioActual = fechaSistema.getFullYear();
    if (anioNac < 1931 || anioNac > anioActual) {
      throw new BadRequestException(
        `La fecha de nacimiento debe estar entre 1931 y ${anioActual}`,
      );
    }

    // ── Alta atómica en ambas tablas ──
    const guardado = await this.usersRepo.manager.transaction(async (em) => {
      await em.save(Tusuarios, {
        usuario,
        nombre: dto.nombre.trim(),
        apellidos: dto.apellidos.trim(),
        email,
        password: dto.password,
        sn_activo: 'S',
        tipo_usuario: 'ERP',
        empresaId: EMPRESA_DEFAULT,
        Idsucursal: SUCURSAL_DEFAULT,
        usuarioCreated: 'REGISTRO',
      });

      // `tusuarios.usuarioId` es auto-increment en BD pero la entity NO lo
      // marca como generated → save() no lo devuelve. Recargar la fila
      // (PK = usuario) para obtener el id real y usarlo en el detalle.
      const creado = await em.findOneOrFail(Tusuarios, { where: { usuario } });

      await em.save(TusuarioInfo, {
        usuario,
        usuarioId: creado.usuarioId,
        nrodocumento,
        tipodoc: dto.tipodoc,
        sexo: dto.sexo,
        fecnac: fechaNac,
        pais: dto.pais.trim(),
        departamento: dto.departamento.trim(),
        ciudad: dto.ciudad.trim(),
        direccion: dto.direccion.trim(),
        telefono: dto.telefono.trim(),
        sn_cliente: 'S',
        empleadoId,
        usuarioCreated: 'REGISTRO',
        fechaCreated: fechaSistema,
      });

      return creado;
    });

    return {
      ok: true,
      usuario: guardado.usuario,
      usuarioId: guardado.usuarioId,
    };
  }
}
