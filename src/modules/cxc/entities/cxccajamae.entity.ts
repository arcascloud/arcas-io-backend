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

  /** Destino del abono: 1 = Cuenta corriente (documentos), 2 = Préstamos (cuotas). */
  @Column({ type: 'tinyint', default: 1 })
  destinoabono: number;

  /** Préstamo destino cuando destinoabono = 2. */
  @Column({ type: 'int', nullable: true })
  prestamoId: number | null;

  @Column()
  documentoId: number;

  @Column({ type: 'char', length: 1, default: 'C' })
  tipomov: string;

  @Column({ type: 'varchar', length: 20 })
  nrodocumento: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  concepto: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizada: string;

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

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
