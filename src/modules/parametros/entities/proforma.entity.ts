import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoproforma')
export class TtipoProforma {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proformaId' })
  proformaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  Alto: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  bajo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  izquierda: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  derecho: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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
