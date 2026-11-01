import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacdet')
export class TPosFacDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfacdetId' })
  posfacdetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  facturaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  nrofila: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precioventa: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  impuesto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00, name: 'p_descuento' })
  p_descuento: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
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
