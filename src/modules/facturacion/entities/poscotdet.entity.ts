import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscotdet')
export class TPosCotDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscotdetId' })
  poscotdetId: number;

  @ApiProperty()
  @Column()
  poscotmaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  productoId: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  precio: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  subTotal: number;

  @ApiProperty({ required: false, description: 'Importe del descuento de la línea' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  descuento: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
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
