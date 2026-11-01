import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxccategorias')
export class CxcCategoria {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cxccategoriaId' })
  cxccategoriaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @ApiProperty()
  @Column({ type: 'int' })
  diasplazo: number;

  @ApiProperty()
  @Column({ type: 'int' })
  diasgracia: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  interes: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  moratorio: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'int', default: 1 })
  Idsucursal: number;

  @ApiProperty()
  @Column({ type: 'int' })
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
