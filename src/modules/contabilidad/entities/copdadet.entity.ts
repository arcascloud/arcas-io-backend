import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('copdadet')
export class Copdadet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'copdadetId' })
  copdadetId: number;

  @ApiProperty()
  @Column()
  copdamaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  periodo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  anio: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nropartida: number;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrofila: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 70, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  debito: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  credito: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
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
