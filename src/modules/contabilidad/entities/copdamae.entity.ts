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

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  nropartida: number;

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
