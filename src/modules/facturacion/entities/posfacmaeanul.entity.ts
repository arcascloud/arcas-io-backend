import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfacmaeanul')
export class TPosFacMaeAnul {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfacmaeanulId' })
  posfacmaeanulId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  facturaId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  bodegaId: number;

  @ApiProperty()
  @Column()
  clienteId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_excento: string;

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

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  observacion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  estado: string;

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
