import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invexistencias')
export class TinvExistencia {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invexistenciaId' })
  invexistenciaId: number;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  productoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  existencia: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  costounitario: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  precioventa: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltCompra: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltVta: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
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
