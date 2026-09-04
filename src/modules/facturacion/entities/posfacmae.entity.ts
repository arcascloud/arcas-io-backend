import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacmae')
export class TPosFacMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'facturaId' })
  facturaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  nrofactura: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['E', 'C'], default: 'E' })
  tipofactura: string;

  @ApiProperty()
  @Column()
  clienteId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 80, nullable: true })
  nombrecliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 120, nullable: true })
  direccion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  total: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  efectivo_recibido: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  importe_cambio: number;

  @ApiProperty()
  @Column({ default: 0 })
  diascredito: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechavencimiento: Date;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  cajaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  gestorId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_excenta: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  nrocarnet: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  Hora: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaanulacion: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'anulacionId', nullable: true })
  anulacionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
