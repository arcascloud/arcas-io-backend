import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Ingresos autorizados por un departamento (comisiones y bonos).
 *
 * Cada fila registra un ingreso aprobado: qué departamento lo autoriza
 * (`deptoId`), quién es el jefe que firmó (`jefeId`), el empleado que lo
 * cobra (`empleadoId`), el importe y el concepto (comisión o bono).
 */
@Entity('pleingresos')
export class PlIngresos {
  /**
   * PK de la tabla. La columna física sigue llamándose `emplcomId` porque la
   * tabla nació como `plecomisiones` y fue renombrada (sus FK siguen siendo
   * `fk_plecomisiones_*`). No se renombra la columna para evitar un DDL.
   */
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'emplcomId' })
  pleingresoId: number;

  @ApiProperty({ required: false, description: 'Fecha y hora del registro' })
  @Column({ type: 'datetime', nullable: true })
  fecha_registro: Date;

  @ApiProperty({ description: 'Ejercicio (año) al que pertenece el ingreso' })
  @Column({ type: 'int' })
  anio_ejercicio: number;

  @ApiProperty({ description: 'Período (mes) al que pertenece el ingreso' })
  @Column({ type: 'int' })
  periodo: number;

  @ApiProperty({ description: 'Empleado que cobra el ingreso' })
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty({ description: 'Jefe que autorizó el pago' })
  @Column({ type: 'int' })
  jefeId: number;

  @ApiProperty({ description: 'Departamento que autoriza el ingreso' })
  @Column({ type: 'int' })
  deptoId: number;

  @ApiProperty({ description: 'Importe autorizado' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty({ enum: ['COMISION', 'BONO'], description: 'Concepto del ingreso' })
  @Column({ type: 'enum', enum: ['COMISION', 'BONO'], default: 'COMISION' })
  concepto: string;

  @ApiProperty({ enum: ['S', 'N'], description: 'Estado activo' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ description: 'ID de la empresa' })
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
