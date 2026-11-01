import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Asignación de caja por usuario (tusuarios_caja).
 * Define el formato de impresión (TICKET/CARTA) y el modo de correlativo (A/M)
 * para cada usuario de caja, con scoping multi-empresa.
 */
@Entity('tusuarios_caja')
export class TusuarioCaja {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty({ description: 'Usuario (FK a tunidades/tusuarios.usuario)' })
  @Column({ type: 'varchar', length: 20 })
  usuario: string;

  @ApiProperty({ description: 'Código de caja' })
  @Column({ type: 'int', default: 0 })
  codigo: number;

  @ApiProperty({ enum: ['S', 'N'] })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ enum: ['TICKET', 'CARTA'], description: 'Formato de impresión' })
  @Column({ type: 'enum', enum: ['TICKET', 'CARTA'], default: 'TICKET' })
  forma: string;

  @ApiProperty({ enum: ['A', 'M'], description: 'Modo de correlativo (Automático/Manual)' })
  @Column({ type: 'enum', enum: ['A', 'M'], default: 'A' })
  modo_correlativo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
