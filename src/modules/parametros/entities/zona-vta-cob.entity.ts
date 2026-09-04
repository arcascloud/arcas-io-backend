import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipozonasvtacob')
export class TtipoZonaVtaCob {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ttipozonasvtacobId' })
  ttipozonasvtacobId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  tzonadId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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
