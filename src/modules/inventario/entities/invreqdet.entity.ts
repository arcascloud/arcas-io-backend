import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invreqdet')
export class TInvReqDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'invreqdetid' })
  invreqdetid: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  invreqmaeid: number;

  @ApiProperty()
  @Column({ type: 'int' })
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'int' })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidadSolicitada: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cantidadEntregada: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['P', 'A', 'R'], default: 'P' })
  sn_estado: 'P' | 'A' | 'R';

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
