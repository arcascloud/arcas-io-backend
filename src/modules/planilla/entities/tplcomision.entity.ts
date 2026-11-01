import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Tramos de comisión sobre ventas (`tplcomision`).
 *
 * Cada fila define un rango [desde..hasta] de ventas mensuales y la `tasa`
 * (en porcentaje, ej. 1.75 = 1.75%) que se aplica al TOTAL de ventas del
 * gestor en el período. El tramo se elige de forma NO progresiva: el que
 * contiene al total de ventas logrado.
 */
@Entity('tplcomision')
export class TplComision {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'plcomisionId' })
  plcomisionId: number;

  @ApiProperty({ description: 'Descripción del tramo (ej. "Ventas entre 15,000.01 y 20000.00 el 1.75%")' })
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty({ description: 'Límite inferior del tramo (ventas)' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  desde: number;

  @ApiProperty({ description: 'Límite superior del tramo (ventas)' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  hasta: number;

  @ApiProperty({ description: 'Tasa de comisión en porcentaje sobre las ventas' })
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  tasa: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
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
