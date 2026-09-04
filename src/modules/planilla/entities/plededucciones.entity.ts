import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plededucciones')
export class PlDeducciones {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empdeduccionId' })
  empdeduccionId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  deduccionId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['F', 'P'], default: 'f' })
  tipodeduccion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_quincenal: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentaje: number;

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
