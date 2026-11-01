import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Central de transacciones: trazabilidad de los IDs maestros de las tablas
 * transaccionales del ERP hacia la partida contable (copdamae) y su módulo.
 *
 * Una fila responde: "este registro maestro de <moduloId> pertenece a la
 * partida <partidaId>", con empresa y usuario autor.
 */
@Entity('trasaviblidad')
export class Trasaviblidad {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  /** ID del registro maestro en la tabla transaccional de su módulo */
  @Column({ type: 'int', nullable: true })
  referenciaId: number | null;

  /** FK a tmodulos (1 Inventario, 3 Facturación, 4 CxC, 5 CxP, 6 Bancos, 7 Contabilidad, 8 Planilla) */
  @Column({ type: 'int', nullable: true })
  moduloId: number | null;

  /** FK a copdamae.partidaId — partida contable a la que se integra el documento */
  @Column({ type: 'int', nullable: true })
  partidaId: number | null;

  /** FK a tsucursal.Idsucursal */
  @Column({ type: 'int', name: 'Idsucursal', nullable: true })
  Idsucursal: number | null;

  @Column({ type: 'int' })
  empresaId: number;

  /** FK a tusuarios.usuario */
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string | null;
}
