import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparampap')
export class TtipoParamPap {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 150, nullable: true })
  proforma: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 150, nullable: true })
  reporte: string;

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
