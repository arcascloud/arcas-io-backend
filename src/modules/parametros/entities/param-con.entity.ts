import {
  Entity, PrimaryColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparamcon')
export class TtipoParamCon {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  nropartida: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  periodofiscal: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  aniofiscal: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  monedafiscalId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  mascaracta: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nombrecontador: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nombregerente: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  nombreauditor: string;

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
