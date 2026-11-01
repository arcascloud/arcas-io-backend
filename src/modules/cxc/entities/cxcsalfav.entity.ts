import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcsalfav')
export class CxcSalFav {
  @PrimaryGeneratedColumn({ name: 'cxcsalfavId' })
  cxcsalfavId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_aplicado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_proceso: Date;

  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
