import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TPosCajaSesion } from './poscajasesion.entity';

@Entity('poscajamovimiento')
@Index('idx_mov_sesion_tipo', ['empresaId', 'sesionId', 'tipo'])
@Index('idx_mov_fecha', ['empresaId', 'fechaCreated'])
export class TPosCajaMovimiento {
  @ApiProperty()
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  sesionId: number;

  @ApiProperty({
    enum: [
      'APERTURA',
      'VENTA_EFECTIVO',
      'DEVOLUCION_EFECTIVO',
      'INGRESO_EFECTIVO',
      'RETIRO_EFECTIVO',
      'COBRO_TARJETA',
      'COBRO_TRANSFERENCIA',
      'APERTURA_GAVETA_MANUAL',
    ],
  })
  @Column({
    type: 'enum',
    enum: [
      'APERTURA',
      'VENTA_EFECTIVO',
      'DEVOLUCION_EFECTIVO',
      'INGRESO_EFECTIVO',
      'RETIRO_EFECTIVO',
      'COBRO_TARJETA',
      'COBRO_TRANSFERENCIA',
      'APERTURA_GAVETA_MANUAL',
    ],
  })
  tipo: string;

  @ApiProperty({ description: '1: entrada/suma, -1: salida/resta, 0: informativo/auditoría' })
  @Column({ type: 'tinyint', default: 1 })
  signo: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  monto: number;

  @ApiProperty({ enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'] })
  @Column({ type: 'enum', enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'], default: 'EFECTIVO' })
  metodo_pago: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 30, nullable: true })
  referencia_tipo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  referencia_id: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 300, nullable: true })
  motivo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  autorizado_por: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  usuarioCreated: string;

  @ApiProperty()
  @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  fechaCreated: Date;

  @ManyToOne(() => TPosCajaSesion, (sesion) => sesion.movimientos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sesionId' })
  sesion: TPosCajaSesion;
}
