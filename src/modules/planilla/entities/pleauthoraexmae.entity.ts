import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Cabecera de autorización para el pago de horas extras.
 *
 * Registra QUIÉN solicita (`solicitado_por`), QUIÉN aprueba
 * (`autorizado_por`), el departamento (`deptoId`) y el RANGO de fechas
 * (`fecha_desde` / `fecha_hasta`) al que se aplica la autorización.
 *
 * Sólo se pagan horas extras a los empleados del detalle con
 * `sn_pagar='S'` y CUYA ASISTENCIA (`pleasistencia`) caiga dentro de
 * ese rango.
 */
@Entity('pleauthoraexmae')
export class PlAuthoraExMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pleauthoraexmaeid' })
  pleauthoraexmaeid: number;

  /** Fecha/hora en que se registró la autorización */
  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecha_registro: Date;

  @ApiProperty({ description: 'Ejercicio (año) al que pertenece la autorización' })
  @Column({ name: 'anio_ejercicio' })
  anio_ejercicio: number;

  @ApiProperty({ description: 'Período (mes 1-12)' })
  @Column()
  periodo: number;

  @ApiProperty({ description: 'Departamento que solicita las horas extras' })
  @Column()
  deptoId: number;

  @ApiProperty({ description: 'Empleado (jefe) que SOLICITA las horas extras' })
  @Column({ name: 'solicitado_por' })
  solicitado_por: number;

  @ApiProperty({ description: 'Empleado (gerente) que APRUEBA las horas extras' })
  @Column({ name: 'autorizado_por' })
  autorizado_por: number;

  @ApiProperty({ required: false, description: 'Inicio del rango de fechas autorizado' })
  @Column({ type: 'datetime', nullable: true })
  fecha_desde: Date;

  @ApiProperty({ required: false, description: 'Fin del rango de fechas autorizado' })
  @Column({ type: 'datetime', nullable: true })
  fecha_hasta: Date;

  @ApiProperty({ required: false, description: 'Motivo / justificación de la solicitud' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  razon_justificacion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @Column({ name: 'empresaid' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ name: 'usuariocreated', type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ name: 'fechacreated', type: 'datetime', nullable: true })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ name: 'usuarioupdated', type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ name: 'fechaupdated', type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
