import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('tcctdiascobros')
export class TcctDiasCobro {
  @PrimaryGeneratedColumn({ name: 'tdiascobrosId' })
  tdiascobrosId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
