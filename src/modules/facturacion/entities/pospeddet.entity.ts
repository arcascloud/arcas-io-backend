import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Detalle de pedidos. Espejo EXACTO del DDL de `pospeddet` (synchronize: false).
 * empresaId es NOT NULL (obligatorio también en el detalle → regla multi-empresa).
 * nrofila es nullable en la BD (lo asigna el backend al crear cada línea).
 */
@Entity('pospeddet')
export class TPosPedDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pospeddetId' })
  pospeddetId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  pospedmaeId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  facturaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precioventa: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  impuesto: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subtotal: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  descuento: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  p_descuento: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty()
  @Column({ type: 'int' })
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
