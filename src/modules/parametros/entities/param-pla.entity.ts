import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparampla')
export class TtipoParamPla {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  nropartida: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nroplanilla: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  techo: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_validatecho: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  diaslaborales: number;

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
