import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('comovcta')
export class Comovcta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'movctascontablesId' })
  movctascontablesId: number;

  @ApiProperty()
  @Column()
  monedaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  sacum: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  debe: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  haber: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecultmov: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  ultnropda: number;

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
