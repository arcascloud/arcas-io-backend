import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccajadet')
export class CxccajaDet {
  @PrimaryGeneratedColumn({ name: 'cxccajadetId' })
  cxccajadetId: number;

  @Column()
  cxccajaId: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  factordecambio: number;

  @Column()
  formapagoId: number;

  @Column({ type: 'int', nullable: true })
  tarjetacreditoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nrotarjeta: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  nroautorizacion: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @Column()
  cajaId: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

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
