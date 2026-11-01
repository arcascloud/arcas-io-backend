import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Detalle de una autorización de pago de horas extras.
 *
 * Cada fila es un empleado AUTORIZADO a recibir el pago (`sn_pagar='S'`).
 * El UNIQUE (cabecera, empleado, empresa) impide autorizar dos veces al
 * mismo empleado dentro de la misma solicitud.
 *
 * No tiene `sn_activo`: la baja es una eliminación definitiva (y la FK
 * hacia la cabecera restringe borrar un detalle huérfano).
 */
@Entity('pleauthoraexdet')
@Index('pleauthoraexdetUnique', ['pleauthoraexmaeid', 'empleadoId', 'empresaId'], { unique: true })
export class PlAuthoraExDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'pleauthoraexdetId' })
  pleauthoraexdetId: number;

  @ApiProperty({ description: 'Autorización (cabecera) a la que pertenece' })
  @Column({ name: 'pleauthoraexmaeid' })
  pleauthoraexmaeid: number;

  @ApiProperty({ description: 'Fecha/hora del registro' })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty({ description: 'Empleado autorizado a cobrar horas extras' })
  @Column()
  empleadoId: number;

  @ApiProperty({ required: false, description: 'Departamento del empleado al momento de autorizar' })
  @Column({ type: 'int', nullable: true })
  departamentoId: number;

  @ApiProperty({ enum: ['S', 'N'], description: 'S=se pagan las horas extras, N=excluido' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagar: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
