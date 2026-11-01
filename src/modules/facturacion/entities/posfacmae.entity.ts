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
  @Column({ name: 'direccion_entrega', type: 'varchar', length: 2000, nullable: true })
  direccion: string;
  
  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  rtn_cliente: string;

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

  @ApiProperty()
  @Column({ type: 'enum', enum: ['OCE','SAG','CEA','FNE'], default: 'FNE' })
  tipoconstancia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroconstancia: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0.00 })
  importe_excento: number;

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

  @ApiProperty()
  @Column({ name: 'nroanulacion', nullable: true })
  nroanulacion: number;

  @ApiProperty({ required: false })
  @Column({ name: 'anulacionId', nullable: true })
  anulacionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  partidaId: number;   // FK a copdamae — partida contable generada

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  Idsucursal: number;

  @ApiProperty({ required: false, description: 'Correlativo CAI autorizado (tcai_autorizado) del que proviene el nrofactura' })
  @Column({ name: 'caiautorizadoId', nullable: true })
  caiAutorizadoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false, description: 'Fecha del último abono aplicado a la factura (CxC)' })
  @Column({ name: 'fechaultPago', type: 'datetime', nullable: true })
  fechaultabono: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
