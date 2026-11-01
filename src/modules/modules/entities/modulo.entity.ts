import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tmodulos')
export class Tmodulos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'moduloId' })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false, description: 'Abreviatura del módulo (ej: INV, FAC, CXC)' })
  @Column({ type: 'varchar', length: 20, default: '' })
  abreviatura: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion_contable: string;

  @ApiProperty({ required: false })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_auxiliar_contable: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false, description: 'Orden de presentación en el menú' })
  @Column({ type: 'int', default: 0 })
  zorden: number;

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
