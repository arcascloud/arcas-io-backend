import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('copdadet')
export class Copdadet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'copdadetId' })
  copdadetId: number;

  @ApiProperty()
  @Column({ name: 'partidaId' })
  partidaId: number;

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
  @Column({ type: 'varchar', length: 200, nullable: true })
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

  @ApiProperty({ description: "Anulada: 'S' = anulada, 'N' = vigente" })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_cerrada: string;

  @ApiProperty()
  @Column()
  Idsucursal: number;

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
