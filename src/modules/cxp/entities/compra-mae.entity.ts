import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpcomprasmae')
export class TCxpCompraMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'compraId' })
  compraId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  nrocompra: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['FCO', 'FCC', 'ORC'], default: 'FCO' })
  TipoCompra: string;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  documentoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  monedaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  factorcambio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subtotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  descuento: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  total: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

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
