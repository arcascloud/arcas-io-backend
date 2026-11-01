import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosccmae')
export class TbcoConciliacion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcoconcilacionId' })
  bcoconcilacionId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  ctabcoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_conciliado: string;

  @ApiProperty({ required: false, description: 'Fecha desde del estado de cuenta' })
  @Column({ type: 'datetime', nullable: true })
  fechaDesde: Date;

  @ApiProperty({ required: false, description: 'Fecha hasta del estado de cuenta' })
  @Column({ type: 'datetime', nullable: true })
  fechaHasta: Date;

  @ApiProperty({ required: false, description: 'Saldo inicial del estado de cuenta' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldoInicial: number;

  @ApiProperty({ required: false, description: 'Saldo final del estado de cuenta' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldoFinal: number;

  @ApiProperty()
  @Column()
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
