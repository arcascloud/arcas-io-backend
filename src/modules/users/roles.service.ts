import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tusuarios } from './entities/usuario.entity';
import { TusuariosRol } from './entities/tusuarios-rol.entity';

/**
 * Roles con permiso de administrar cuentas contables:
 * - Editar cuentas que ya tienen historial (movimiento/cierre)
 * - Habilitar cuentas operables (sn_operable = 'S')
 */
export const ROLES_CONTABILIDAD = ['admin', 'supervisor', 'contador'];

/**
 * Roles con permiso sobre las fechas (tfecma/tfecdet) y sobre la Fecha del
 * Sistema del ERP (tempresas.fechasistema):
 * - administrar los rangos de fechas autorizadas, y
 * - corregir la Fecha del Sistema cuando no coincide con la del servidor
 *   (condición que bloquea toda escritura del ERP).
 */
export const ROLES_FECHAS = ['admin', 'supervisor', 'contador'];

/**
 * Roles con permiso de operaciones destructivas de catálogo (ej: eliminar
 * un módulo). Por regla de negocio, solo `admin`.
 */
export const ROLES_ADMIN = ['admin'];

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Tusuarios)
    private readonly usuariosRepo: Repository<Tusuarios>,
    @InjectRepository(TusuariosRol)
    private readonly usuariosRolRepo: Repository<TusuariosRol>,
  ) {}

  /**
   * Devuelve los nombres de los roles del usuario para la empresa.
   * @param usuario `tusuarios.usuario` (PK del usuario)
   * @param empresaId Empresa activa
   */
  async getRoles(usuario: string, empresaId: number): Promise<string[]> {
    const user = await this.usuariosRepo.findOne({ where: { usuario } });
    if (!user) return [];
    const filas = await this.usuariosRolRepo.find({
      where: { usuarioId: user.usuarioId, empresaId },
    });
    return filas.map((f) => f.rol);
  }

  /** true si el usuario tiene al menos uno de los roles privilegiados de contabilidad */
  async esPrivilegiadoContabilidad(usuario: string, empresaId: number): Promise<boolean> {
    const roles = await this.getRoles(usuario, empresaId);
    return roles.some((r) => ROLES_CONTABILIDAD.includes(r));
  }

  /**
   * true si el usuario puede administrar las fechas autorizadas (tfecma/tfecdet)
   * y corregir la Fecha del Sistema del ERP.
   * Roles: admin, supervisor, contador.
   */
  async esRolFechas(usuario: string, empresaId: number): Promise<boolean> {
    const roles = await this.getRoles(usuario, empresaId);
    return roles.some((r) => ROLES_FECHAS.includes(r));
  }

  /**
   * true si el usuario es administrador (rol `admin`) para la empresa.
   */
  async esAdmin(usuario: string, empresaId: number): Promise<boolean> {
    const roles = await this.getRoles(usuario, empresaId);
    return roles.some((r) => ROLES_ADMIN.includes(r));
  }
}
