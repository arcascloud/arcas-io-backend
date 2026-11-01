import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tfecma } from './fecma.entity';

/**
 * Detalle de fechas autorizadas (tfecdet).
 *
 * Indica qué usuarios están habilitados (sn_permitido) dentro del rango de
 * vigencia definido en el maestro (tfecma).
 */
@Entity('tfecdet')
export class Tfecdet {
  @ApiProperty({ description: 'ID del detalle' })
  @PrimaryGeneratedColumn({ name: 'fecdetId' })
  fecdetId: number;

  @ApiProperty({ description: 'FK al maestro tfecma' })
  @Column({ name: 'fecmaeId', type: 'int' })
  fecmaeId: number;

  @ApiProperty({ description: 'Login del usuario autorizado (tusuarios.usuario)' })
  @Column({ type: 'varchar', length: 20 })
  usuario: string;

  @ApiProperty({ description: '¿Usuario permitido en el rango?', enum: ['S', 'N'] })
  @Column({ name: 'sn_permitido', type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_permitido: string;

  @ApiProperty({ description: 'Empresa a la que pertenece' })
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty({ description: 'Usuario que creó el registro' })
  @Column({ name: 'usuarioCreated', type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ description: 'Fecha de creación' })
  @Column({ name: 'fechaCreated', type: 'datetime' })
  fechaCreated: Date;

  @ApiProperty({ description: 'Usuario de la última modificación' })
  @Column({ name: 'usuarioUpdate', type: 'varchar', length: 20, default: '0' })
  usuarioUpdate: string;

  @ApiProperty({ description: 'Fecha de la última modificación' })
  @Column({ name: 'fechaUpdate', type: 'datetime' })
  fechaUpdate: Date;

  @ApiProperty({ description: 'Maestro al que pertenece', type: () => Tfecma })
  @ManyToOne(() => Tfecma, (mae) => mae.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fecmaeId' })
  fecma: Tfecma;
}
