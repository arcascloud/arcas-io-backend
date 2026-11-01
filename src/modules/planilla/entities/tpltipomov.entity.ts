import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tpltipomov')
export class TplTipoMov {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tipomovId' })
  tipomovId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 25 })
  abreviatura: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_porcentual: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_obligatoria: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_por_fecalta: string;


  @ApiProperty()
  @Column()
  periodo_prueba: number;

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
  es_obligacion_patronal: string;


  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['E', 'I'], default: 'E' })
  tipomov: string;

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
