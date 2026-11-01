import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoimpuestos')
export class TtipoImpuesto {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'impuestoId' })
  impuestoId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

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
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
