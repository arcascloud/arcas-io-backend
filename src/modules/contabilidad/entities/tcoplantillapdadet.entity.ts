import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoplantillapdadet')
export class Tcoplantillapdadet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcoplantillapdadetId' })
  tcoplantillapdadetId: number;

  @ApiProperty()
  @Column()
  tcoplantillapdamaeId: number;

  @ApiProperty()
  @Column()
  nrofila: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  ctamayorId: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  naturaleza: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
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
