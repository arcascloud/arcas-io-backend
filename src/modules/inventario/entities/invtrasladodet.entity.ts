import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invtrasdet')
export class TInvTrasladoDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invtrasladodetId' })
  invtrasladodetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int', name: 'trasladoId' })
  invtrasladomaeId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidad: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'precioCosto' })
  costoUnitario: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'precioVenta', nullable: true })
  precioVenta: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'subTotal' })
  costoTotal: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  bodegaOrigen: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  bodegaDestino: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty()
  @Column({ type: 'int' })
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
