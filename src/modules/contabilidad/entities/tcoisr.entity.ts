import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcoisr')
export class Tcoisr {
  @ApiProperty({ description: 'ID del rango de ISR' })
  @PrimaryGeneratedColumn({ name: 'tcoisrId' })
  tcoisrId: number;

  @ApiProperty({ required: false, description: 'Descripción del rango' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ description: 'Rango desde' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.0 })
  del: number;

  @ApiProperty({ description: 'Rango hasta' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.0 })
  al: number;

  @ApiProperty({ description: 'Importe' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.0 })
  importe: number;

  @ApiProperty({ enum: ['S', 'N'], default: 'S' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ description: 'ID de la empresa' })
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
