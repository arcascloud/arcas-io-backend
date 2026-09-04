import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tempresas } from '../../companies/entities/empresa.entity';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';

@Entity('tusuarios')
export class Tusuarios {
  @PrimaryColumn({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'int', unique: true })
  usuarioId: number;

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  @Column({ type: 'varchar', length: 12 })
  password: string;

  @Column({ type: 'varchar', length: 20 })
  email: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'int' })
  Idsucursal: number;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ManyToOne(() => Tempresas, (e) => e.usuarios)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;

  @ManyToOne(() => Tsucursal)
  @JoinColumn({ name: 'Idsucursal' })
  sucursal: Tsucursal;
}
