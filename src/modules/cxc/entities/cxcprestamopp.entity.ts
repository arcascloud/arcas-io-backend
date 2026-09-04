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

  @Column({ type: 'int', nullable: true })
  diasvencido: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_anulada: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
