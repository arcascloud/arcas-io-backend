import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccajamae')
export class CxccajaMae {
  @PrimaryGeneratedColumn({ name: 'cxccajaId' })
  cxccajaId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  moduloId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column()
  documentoId: number;

  @Column({ type: 'char', length: 1, default: 'C' })
  tipomov: string;

  @Column({ type: 'varchar', length: 20 })
  nrodocumento: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  concepto: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_cotabilizada: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

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
