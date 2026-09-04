import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccclientesref')
export class CxccClientesRef {
  @PrimaryGeneratedColumn({ name: 'referenciaId' })
  referenciaId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 50 })
  nombres: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apellidos: string;

  @Column({ type: 'datetime', nullable: true })
  fechanacimiento: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dni: string;

  @Column({ type: 'enum', enum: ['AA', 'CO', 'FA'], default: 'FA', nullable: true })
  tiporeferencia: string;

  @Column({ type: 'enum', enum: ['M', 'F'], default: 'M', nullable: true })
  sexo: string;

  @Column({ type: 'enum', enum: ['S', 'C', 'D', 'V', 'U'], default: 'S', nullable: true })
  estadocivil: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono1: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono2: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion1: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  direccion2: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lugarTrabajo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cargo: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, nullable: true })
  salario: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S', nullable: true })
  sn_activo: string;

  @Column({ nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
