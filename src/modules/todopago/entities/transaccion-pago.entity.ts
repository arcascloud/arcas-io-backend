import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Transacciones de pago vía TodoPago (link de pago).
 * Tabla ya existente en arcasdb — FK `facturaid` → posfacmae.facturaId (ON DELETE CASCADE).
 */
@Entity('transacciones_pago')
export class TransaccionPago {
  @ApiProperty()
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @ApiProperty({ description: 'FK posfacmae.facturaId (nombre de columna en BD: facturaid)' })
  @Column({ name: 'facturaid', type: 'int' })
  facturaid: number;

  @ApiProperty()
  @Column({ name: 'operation_id', type: 'varchar', length: 40 })
  operationId: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'public_request_key', type: 'varchar', length: 60, nullable: true })
  publicRequestKey: string | null;

  @ApiProperty({ enum: ['pending', 'completed', 'failed', 'expired', 'reversed'] })
  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'failed', 'expired', 'reversed'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'reversed';

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'varchar', length: 30, nullable: true })
  metodo: string | null;

  @ApiProperty()
  @Column({ name: 'fecha_creacion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaCreacion: Date;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'fecha_confirmacion', type: 'datetime', nullable: true })
  fechaConfirmacion: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'raw_request', type: 'json', nullable: true })
  rawRequest: Record<string, any> | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'raw_response', type: 'json', nullable: true })
  rawResponse: Record<string, any> | null;
}
