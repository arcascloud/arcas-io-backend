import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Tramos de horas extras (`tplhorasextras`) — tabla configurable por empresa.
 *
 * Define la franja de horario de reloj y el porcentaje de recargo:
 *   · 17:00:01 – 19:00:00  Hora extra diurna   (+25%)
 *   · 19:00:01 – 23:59:59  Hora extra nocturna (+50%)
 *   · 24:00:00 – 05:00:00  Prolongación nocturna (+75%)
 *
 * NOTA: `desde = '24:00:00'` es un valor válido en MySQL TIME y equivale a
 * medianoche; al clasificar se normaliza con `valor % 86400`.
 */
@Entity('tplhorasextras')
@Index('tplhorasextrasUnique', ['descripcion', 'empresaId'], { unique: true })
export class TplHorasExtra {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'horaextraId' })
  horaextraId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true, default: () => "'00:00:00'" })
  desde: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true, default: () => "'00:00:00'" })
  hasta: string | null;

  /** Porcentaje de recargo aplicable al tramo (25 = +25%). */
  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, default: 0 })
  tasa: number;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date | null;
}
