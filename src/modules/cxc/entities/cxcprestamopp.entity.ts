import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcprestamospp')
export class CxcPrestamoPP {
  @PrimaryGeneratedColumn({ name: 'pppId' })
  pppId: number;

  @Column()
  prestamoId: number;

  @Column({ type: 'datetime' })
  FechaPago: Date;

  @Column()
  clienteId: number;

  @Column()
  nrofila: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  vlrcuota: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  capital: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  mora: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldo: number;

  @Column({ name: 'diasmora', type: 'int', nullable: true })
  diasvencido: number;

  /** Defaults alineados con la BD: cuota nace pendiente (N) y sin anular (N). */
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  /** Caja (cxccajamae) que pagó esta cuota — permite reversa al anular la caja. */
  @Column({ type: 'int', nullable: true })
  cxccajaId: number | null;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
