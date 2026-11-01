import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Bitácora de partidas contables que afectan una factura.
 * Cada fila representa una partida vinculada: venta, abono CxC, anulación, etc.
 * Permite mantener historial completo sin sobreescribir posfacmae.partidaId.
 */
@Entity('posfacmov')
export class Posfacmov {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'posfacmovId' })
  posfacmovId: number;

  @ApiProperty()
  @Column({ type: 'datetime', nullable: false })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  facturaId: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
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
