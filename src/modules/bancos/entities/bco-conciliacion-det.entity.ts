import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosccdet')
export class TbcoConciliacionDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcosdetconciliacionId' })
  bcosdetconciliacionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  bcoconcilacionId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecmovbco: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrorefencia: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 150 })
  concepto: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

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
