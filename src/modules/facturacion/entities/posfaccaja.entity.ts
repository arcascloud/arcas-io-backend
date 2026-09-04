import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posfaccaja')
export class TPosFacCaja {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfaccajaId' })
  posfaccajaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  facturaId: number;

  @ApiProperty()
  @Column()
  formapagoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  tarjetacreditoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nrotarjeta: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroautorizacion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_efectivo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_otros: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_cambio: number;

  @ApiProperty()
  @Column()
  cajaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

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
