import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('invfisdet')
export class TInvFisDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'nvfisdetId' })
  nvfisdetId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  invfisId: number;

  @ApiProperty()
  @Column()
  bodegaId: number;

  @ApiProperty()
  @Column()
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  existencia: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  fisico: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  ajusteEntrada: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  ajusteSalida: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoUnitario: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  costoTotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  preciovta: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_posteado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_aplicado: string;

  @ApiProperty()
  @Column()
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
