import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Información extendida del usuario (`tusuariosinfoinfo`).
 *
 * ⚠️ La tabla NO tiene columna `empresaId` (no se hace ALTER TABLE sin
 * aprobación). El scoping multi-empresa se resuelve en el service
 * filtrando contra `tusuarios.empresaId` vía `usuarioId`.
 *
 * PK: `usuarioId` (1 fila por usuario). UNIQUE: (`tipodoc`, `nrodocumento`).
 */
@Entity('tusuariosinfo')
export class TusuarioInfo {
  @ApiProperty({ description: 'Login del usuario (denormalizado desde tusuarios.usuario)' })
  @Column({ name: 'usuario', type: 'varchar', length: 20 })
  usuario: string;

  @ApiProperty({ description: 'ID del usuario (PK, FK lógico a tusuarios.usuarioId)' })
  @PrimaryColumn({ name: 'usuarioId', type: 'int' })
  usuarioId: number;

  @ApiProperty({ description: 'Número de documento (DNI/RTN/pasaporte)' })
  @Column({ name: 'nrodocumento', type: 'varchar', length: 30 })
  nrodocumento: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento' })
  @Column({ name: 'fecnac', type: 'datetime', nullable: true })
  fecnac: Date | null;

  @ApiProperty({ description: 'Tipo de documento', enum: ['D', 'R', 'C', 'P', 'L'] })
  @Column({ type: 'enum', enum: ['D', 'R', 'C', 'P', 'L'], default: 'D' })
  tipodoc: 'D' | 'R' | 'C' | 'P' | 'L';

  @ApiProperty({ description: '¿Es cliente?', enum: ['S', 'N'] })
  @Column({ name: 'sn_cliente', type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_cliente: 'S' | 'N';

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'] })
  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: 'M' | 'F';

  @ApiProperty()
  @Column({ type: 'varchar', length: 80 })
  pais: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 80 })
  departamento: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 80 })
  ciudad: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 2000 })
  direccion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 80 })
  telefono: string;

  @ApiProperty({ required: false, description: 'ID del empleado (planilla) si aplica' })
  @Column({ name: 'empleadoId', type: 'int', nullable: true })
  empleadoId: number | null;

  @ApiProperty({ required: false })
  @Column({ name: 'usuarioCreated', type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'fechaCreated', type: 'datetime', nullable: true })
  fechaCreated: Date | null;

  @ApiProperty({ required: false })
  @Column({ name: 'usuarioUpdated', type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'fechaUpdated', type: 'datetime', nullable: true })
  fechaUpdated: Date | null;
}
