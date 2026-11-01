import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tempresas } from '../../companies/entities/empresa.entity';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';
import { TCai } from '../../companies/entities/tcai.entity';

/** Rango de facturación autorizado bajo un CAI (tcai.caiId) */
@Entity('tcai_autorizado')
export class TCaiAutorizado {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'caiautorizadoId' })
  caiAutorizadoId: number;

  @ApiProperty({ description: 'CAI que ampara el rango (tcai)' })
  @Column()
  caiId: number;

  @ApiProperty({ type: () => TCai, required: false })
  @ManyToOne(() => TCai)
  @JoinColumn({ name: 'caiId' })
  cai: TCai;

  @ApiProperty()
  @Column()
  nrofactura: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  rangoDesde: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  rangoHasta: string;

  @ApiProperty({ required: true })
  @Column({ type: 'datetime', nullable: false })
  fechaLimite: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty()
  @Column({ type: 'int' })
  Idsucursal: number;

  @ManyToOne(() => Tsucursal)
  @JoinColumn({ name: 'Idsucursal' })
  sucursal: Tsucursal;

  @ManyToOne(() => Tempresas)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
