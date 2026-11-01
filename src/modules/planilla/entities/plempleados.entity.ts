import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plempleados')
export class PlEmpleados {
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
  nrodocumento: string;

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
  @Column({ type: 'varchar', length: 30 })
  email: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  profesionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  puestoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  deptoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  jefeId: number;

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

  @ApiProperty({ description: 'Jornada: D=Diurna (8h), M=Mixta (7h), N=Nocturna (6h)' })
  @Column({ type: 'enum', enum: ['D', 'M', 'N'], default: 'D' })
  sn_jornada: string;

  @ApiProperty()
  @Column({ type: 'int' })
  tipoempId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecha_alta: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecha_baja: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  Idsucursal: number;

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
