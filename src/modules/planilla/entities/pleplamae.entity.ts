import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pleplamae')
export class PlPlaMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'planillaId' })
  planillaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '' })
  nroplanilla: string;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  periodo: number;

  @ApiProperty()
  @Column({ type: 'int' })
  anio: number;

  @ApiProperty()
  @Column({ type: 'int' })
  bcoctasId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  items: number;

  @ApiProperty({ required: false, description: 'Autorizada para pago (S/N)' })
  @Column({ name: 'sn_autorizada', type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_autorizada: string;

  @ApiProperty({ required: false, description: 'Contabilizada (S/N)' })
  @Column({ name: 'sn_contabilizada', type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

  /**
   * Partida contable asociada. La BD lo creó `NOT NULL` sin default → el
   * default 0 de la entity es OBLIGATORIO: sin él, todo INSERT de
   * `pleplamae` falla con "partidaId cannot be null" (STRICT_TRANS_TABLES).
   * La partida contable real se integrará después (queda en 0).
   */
  @ApiProperty({ required: false, description: 'Partida contable (0 = pendiente)' })
  @Column({ name: 'partidaId', type: 'int', default: 0 })
  partidaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_pagada: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulada: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  totalapagar: number;

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
