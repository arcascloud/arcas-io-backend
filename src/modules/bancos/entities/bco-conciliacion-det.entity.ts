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

  @ApiProperty({ required: false, description: 'Conciliado: S=match, N=diferencia' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_conciliado: string;

  @ApiProperty({ required: false, description: 'ID del movimiento bancario coincidente (bcosmovimientos)' })
  @Column({ type: 'int', nullable: true })
  bcomovimientosId: number;

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
