import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxccajeros')
export class Cxccajero {
  @PrimaryGeneratedColumn({ name: 'cajaId' })
  cajaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column()
  empresaId: number;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
