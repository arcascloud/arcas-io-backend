import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvdeptos')
export class TinvDepto {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'deptoId' })
  deptoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column()
  zorden: number;

  @ApiProperty({ enum: ['C', 'F', 'R'], description: 'Tipo de giro: Comercio / Farmacias / Restaurante' })
  @Column({ type: 'enum', enum: ['C', 'F', 'R'], default: 'C' })
  tipo_giro: string;

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
