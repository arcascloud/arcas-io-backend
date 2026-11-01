import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pletipomov')
export class PlTipoMov {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pletipomovId' })
  pletipomovId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  tipomovId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S','H','M','A','Q'], default: 'M' })
  aplicacion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['P','A','R'], default: 'A' })
  tipoimporte: string;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty({
    required: false,
    description: 'Importe a cargo del patrono (aporte patronal)',
  })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  imppatron: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
