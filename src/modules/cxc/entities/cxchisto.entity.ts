import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxchisto')
export class CxcHistoro {
  @PrimaryGeneratedColumn({ name: 'historicoclienteId' })
  historicoclienteId: number;

  @Column()
  anio: number;

  @Column()
  periodo: number;

  @Column()
  clienteId: number;

  @Column({ type: 'varchar', length: 20 })
  nrocliente: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  saldo: number;

  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
