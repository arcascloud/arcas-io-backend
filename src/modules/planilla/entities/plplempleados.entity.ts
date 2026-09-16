import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plplempleados')
export class PlPlEmpleados {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empleadoId' })
  empleadoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: '' })
  nroempleado: string;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechanacimiento: Date;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['M', 'F', 'T'], default: 'M' })
  sexo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'C', 'V', 'D', 'U'], default: 'S' })
  estadocivil: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  paisorigen: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  paisresidencia: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nroseguro: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  celular: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  email: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  profesionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  puestoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldobruto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  techoseguro: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  cuentabancaria: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 200, nullable: true })
  lugardenacimiento: string;

  @ApiProperty({ required: false })
  @Column({ type: 'longblob', nullable: true })
  foto: Buffer;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  tipoempId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
