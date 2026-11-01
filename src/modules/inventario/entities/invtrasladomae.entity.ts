import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invtrasmae')
export class TInvTrasladoMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invtrasladomaeId' })
  invtrasladomaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaOrigenId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaDestinoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  nroreferencia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  observaciones: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_procesado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @ApiProperty()
  @Column({ type: 'int' })
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
