import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxcclientes')
export class CxcCliente {
  @PrimaryGeneratedColumn({ name: 'clienteId' })
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechanacimiento: Date;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50 })
  apellidos: string;

  @Column({ type: 'varchar', length: 120 })
  razonsocial: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rtn: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  limiteCredito: number;

  @Column()
  diasplazo: number;

  @ApiProperty({ required: false, description: 'Días de gracia después del vencimiento del plazo (mora)' })
  @Column({ type: 'int', default: 0 })
  diasgracia: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  moratorio: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

  @Column({ type: 'int', default: 4 })
  moduloId: number;

  @Column()
  empresaId: number;

  // Columna NOT NULL en BD (sin default) - sin este mapeo el INSERT la omitía
  // y MySQL devolvía ER_NO_DEFAULT_FOR_FIELD (1364).
  @Column({ type: 'int', default: 0 })
  Idsucursal: number;

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
