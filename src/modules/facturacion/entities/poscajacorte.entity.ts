import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TPosCajaSesion } from './poscajasesion.entity';

@Entity('poscajacorte')
@Unique('uq_corte_sesion_tipo_corr', ['empresaId', 'sesionId', 'tipo_corte', 'numero_correlativo'])
export class TPosCajaCorte {
  @ApiProperty()
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  sesionId: number;

  @ApiProperty({ enum: ['CORTE_X', 'CORTE_Z'] })
  @Column({ type: 'enum', enum: ['CORTE_X', 'CORTE_Z'] })
  tipo_corte: string;

  @ApiProperty()
  @Column({ type: 'int', unsigned: true })
  numero_correlativo: number;

  @ApiProperty()
  @Column({ type: 'datetime', precision: 6 })
  fecha_corte: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  fondo_inicial: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  total_entradas_efectivo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  total_salidas_efectivo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  saldo_efectivo_sistema: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  total_otros_medios: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  efectivo_contado: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  diferencia: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  observaciones: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  usuarioCreated: string;

  @ApiProperty()
  @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  fechaCreated: Date;

  @ManyToOne(() => TPosCajaSesion, (sesion) => sesion.cortes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sesionId' })
  sesion: TPosCajaSesion;
}
