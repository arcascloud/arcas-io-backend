import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invmovmae')
export class TInvMovMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invmovmaeid' })
  invmovmaeid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  nroajuste: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  concepto: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_entrada: 'S' | 'N';

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
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
