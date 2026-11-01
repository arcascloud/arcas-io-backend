import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('copdamae')
export class Copdamae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'partidaId' })
  partidaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty()
  @Column()
  documentoId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechadocumento: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  factordecambio: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 70 })
  nroreferencia: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 2000 })
  descripcion: string;

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
  nropartida: number;

  @ApiProperty({
    required: false,
    description: 'Partida origen de la contra partida (solo en la contra)',
  })
  @Column({ type: 'int', nullable: true })
  partidaOrigenId: number | null;

  @ApiProperty({
    required: false,
    description: 'Partida contra generada sobre esta partida (solo en la original)',
  })
  @Column({ type: 'int', nullable: true })
  contrapdaId: number | null;

  @ApiProperty({
    required: false,
    description: 'Fecha en que se generó la contra partida (solo en la original)',
  })
  @Column({ type: 'datetime', nullable: true })
  feccontrapda: Date | null;

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
