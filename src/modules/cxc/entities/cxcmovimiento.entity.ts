import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn
} from 'typeorm';
import { Tmodulos } from '../../modules/entities/modulo.entity';

@Entity('cxcmovimientos')
export class CxcMovimiento {
  @PrimaryGeneratedColumn({ name: 'clienteMovId' })
  clienteMovId: number;

  @Column({ type: 'int', default: 0 })
  nromovimiento: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column()
  moduloId: number;

  @ManyToOne(() => Tmodulos, { eager: false })
  @JoinColumn({ name: 'moduloId', referencedColumnName: 'moduloId' })
  modulo: Tmodulos;

  @Column()
  documentoId: number;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  tipomov: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  concepto: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_cotabilizada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_doc_anulado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
