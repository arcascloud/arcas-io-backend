import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedor')
export class Tproveedor {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proveedorId' })
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nroproveedor: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 120, nullable: true })
  razonsocial: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  diasplazo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  moratorio: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

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
