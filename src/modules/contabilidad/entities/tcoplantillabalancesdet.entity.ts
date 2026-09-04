import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoplantillabalancesdet')
export class Tcoplantillabalancesdet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcoplantillabalancesdetid' })
  tcoplantillabalancesdetid: number;

  @ApiProperty()
  @Column()
  cocdefbalmaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 1, nullable: true })
  tipo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  columna: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  renglon: number;

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
