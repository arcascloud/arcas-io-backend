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

  /** Valor de la cuota pactada (se persiste en BD; antes se calculaba en UI). */
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  vlrcuota: number;

  // MAPEO A COLUMNAS REALES DE LA BD (synchronize: false — los nombres de la
  // entity deben coincidir con la BD): tasa → tasa_interes_anual,
  // diascuotas → diasplazo, moratorio → tasa_interes_moratorio_anual,
  // gracia → diasgracia.

  @Column({ name: 'tasa_interes_anual', type: 'decimal', precision: 20, scale: 2, default: 0 })
  tasa: number;

  @Column({ type: 'int', nullable: true })
  cuotas: number;

  @Column({ name: 'diasplazo', type: 'int', nullable: true })
  diascuotas: number;

  @Column({ name: 'tasa_interes_moratorio_anual', type: 'decimal', precision: 20, scale: 2, default: 0 })
  moratorio: number;

  @Column({ type: 'int', nullable: true })
  gestorId: number;

  @Column({ type: 'int', nullable: true })
  monedaId: number;

  @Column({ name: 'diasgracia', type: 'int', nullable: true })
  gracia: number;

  /** Fecha en que se aprobó el préstamo (default = fecha de registro). */
  @Column({ name: 'fecha_aprobacion', type: 'datetime', nullable: true })
  fecha_aprobacion: Date;

  @Column({ type: 'int', nullable: true })
  ultcuotapagada: number;

  /** Fecha de última cuota pagada (se actualiza al cobrar cuotas desde caja). */
  @Column({ name: 'fechaUltPago', type: 'datetime', nullable: true })
  fechaUltPago: Date;

  /** Fecha de inicio/efectividad del préstamo (default = fecha de registro). */
  @Column({ name: 'fechaEfectiva', type: 'datetime', nullable: true })
  fechaEfectiva: Date;

  /** Saldo de capital pendiente = Σ capital de cuotas no pagadas (recalculado al cobrar/anular). */
  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  saldoactual: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_preaprobado: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_aprobado: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizado: string;

  /** ID de la partida contable generada al contabilizar (FK copdamae.partidaId). */
  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_anulado: string;

  /** Sucursal del préstamo (FK tsucursal; NOT NULL sin default en BD). */
  @Column()
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
