import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

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

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  interes: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  moratorio: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['A', 'B', 'C', 'D', 'E'], default: 'A' })
  categoria: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
