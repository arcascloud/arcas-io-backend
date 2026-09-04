import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcparientes')
export class CxcPariente {
  @PrimaryGeneratedColumn({ name: 'parienteId' })
  parienteId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechanacimiento: Date;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellidos: string;

  @Column({ type: 'varchar', length: 20 })
  dni: string;

  @Column({ type: 'enum', enum: ['P', 'H', 'E', 'A', 'M'], default: 'M' })
  tipopariente: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M' })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S' })
  estadocivil: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono1: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion1: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lugar: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cargo: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  salario: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
