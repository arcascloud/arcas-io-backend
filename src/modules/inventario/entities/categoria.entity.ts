import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tinvcategoria')
export class TinvCategoria {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'categoriaId' })
  categoriaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  deptoId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ enum: ['C', 'F', 'R'], required: false, description: 'C=Comercio, F=Farmacias, R=Restaurante' })
  @Column({ type: 'enum', enum: ['C', 'F', 'R'], default: 'C' })
  tipo_giro: string;

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
