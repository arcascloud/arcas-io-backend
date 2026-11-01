import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bcosmovimientos')
export class TbcoMovimiento {
  @PrimaryGeneratedColumn()
  bcomovimientosId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @Column()
  bancoId: number;

  @Column()
  bcoctasId: number;

  @Column()
  moduloId: number;

  @Column({ type: 'enum', enum: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA', 'PAGO', 'NOTA_DEBITO', 'NOTA_CREDITO'], default: 'DEPOSITO' })
  tipomov: string;

  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  dc_debitocredito: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroreferencia: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nrochq: string;

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

  @Column({ nullable: true })
  partidaId: number;

  @Column({ nullable: true })
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
