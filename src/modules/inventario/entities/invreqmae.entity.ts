import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invreqmae')
export class TInvReqMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invreqmaeid' })
  invreqmaeid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  nrorequisicion: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaOrigenId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaDestinoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  concepto: string;

  @ApiProperty({ required: false })
  @Column({ type: 'enum', enum: ['B', 'M', 'A', 'U'], default: 'M', nullable: true })
  prioridad: 'B' | 'M' | 'A' | 'U';

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  fechaEntrega: string | Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  observaciones: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['P', 'A', 'R', 'X'], default: 'P' })
  sn_estado: 'P' | 'A' | 'R' | 'X';

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesado: string;


  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: 'S' | 'N';

  @ApiProperty()
  @Column({ type: 'int' })
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
