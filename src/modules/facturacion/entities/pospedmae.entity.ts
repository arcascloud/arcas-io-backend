import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Maestro de pedidos (tienda virtual / ERP).
 * Espejo EXACTO del DDL de la tabla `pospedmae` (synchronize: false → sin DDL automático).
 * REGLA: clienteId, nrocliente, bodegaId, cajaId, nrotelefono, empresaId e Idsucursal
 * son NOT NULL sin default → SIEMPRE deben resolverse antes del INSERT.
 * OJO: sn_facturado tiene DEFAULT 'S' en la BD → el backend fuerza 'N' en altas.
 */
@Entity('pospedmae')
export class TPosPedMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pospedmaeId' })
  pospedmaeId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  facturaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrofactura: number;

  @ApiProperty({ enum: ['E', 'C'], required: false })
  @Column({ type: 'enum', enum: ['E', 'C'], default: 'E' })
  tipofactura: string;

  @ApiProperty()
  @Column({ type: 'int' })
  clienteId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 80, nullable: true })
  nombrecliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 2000, nullable: true })
  direccion_entrega: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true, default: 'N/A' })
  rtn_cliente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  caiautorizadoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 4, nullable: true, default: 0 })
  factordecambio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, default: 0 })
  subTotal: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, default: 0 })
  impuesto: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, default: 0 })
  descuento: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, default: 0 })
  total: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, default: 0 })
  efectivo_recibido: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, default: 0 })
  importe_cambio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  diascredito: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechavencimiento: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  cajaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @ApiProperty({ required: false, description: 'Número de mesa (restaurante). NULL = sin mesa' })
  @Column({ type: 'int', nullable: true })
  nromesa: number | null;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'S = pedido entregado a la mesa' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_entregado: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrotelefono: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_enviogratis: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_facturado: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_excenta: string;

  @ApiProperty({ enum: ['OCE', 'SAG', 'CEA', 'FNE'], required: false })
  @Column({ type: 'enum', enum: ['OCE', 'SAG', 'CEA', 'FNE'], default: 'FNE' })
  tipoconstancia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroconstancia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  importe_excento: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  Hora: Date;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaanulacion: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nroanulacion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  anulacionId: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  partidaId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  Idsucursal: number;

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
