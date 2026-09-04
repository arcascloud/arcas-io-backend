import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plecomisiones')
export class PlComisiones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'emplcomId' })
  emplcomId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  comisionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['F', 'P'], default: 'f' })
  tipocomision: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_quincenal: string;

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
