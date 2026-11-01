import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tfecdet } from './fecdet.entity';

/**
 * Maestro de fechas autorizadas (tfecma).
 *
 * Define un rango de vigencia (fec_vig_desde .. fec_vig_hasta) dentro del cual
 * los usuarios listados en el detalle (tfecdet) están autorizados a registrar
 * datos en períodos cerrados.
 */
@Entity('tfecma')
export class Tfecma {
  @ApiProperty({ description: 'ID del maestro de fechas' })
  @PrimaryGeneratedColumn({ name: 'tfecmaId' })
  tfecmaId: number;

  @ApiProperty({ description: 'Fecha del sistema (tempresas.fechasistema)' })
  @Column({ type: 'datetime' })
  fechasistema: Date;

  @ApiProperty({ description: 'Fecha desde (inicio de vigencia)' })
  @Column({ name: 'fec_vig_desde', type: 'datetime' })
  fec_vig_desde: Date;

  @ApiProperty({ description: 'Fecha hasta (fin de vigencia)' })
  @Column({ name: 'fec_vig_hasta', type: 'datetime' })
  fec_vig_hasta: Date;

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

  @ApiProperty({ description: 'Detalle de usuarios autorizados', type: () => [Tfecdet] })
  @OneToMany(() => Tfecdet, (det) => det.fecma, { cascade: false })
  detalles: Tfecdet[];
}
