import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcprestamos')
export class CxcPrestamo {
  @PrimaryGeneratedColumn({ name: 'prestamoId' })
  prestamoId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column({ type: 'varchar', length: 50 })
  nroprestamo: string;

  @Column()
  clienteId: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  capital: number;

  @Column({ type: 'int', nullable: true })
  prima: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  capitalneto: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  tasa: number;

  @Column({ type: 'int', nullable: true })
  cuotas: number;

  @Column({ type: 'int', nullable: true })
  diascuotas: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  moratorio: number;

  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @Column({ type: 'int', nullable: true })
  monedaId: number;

  @Column({ type: 'int', nullable: true })
  gracia: number;

  @Column({ type: 'int', nullable: true })
  ultcuotapagada: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_contabilizado: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
