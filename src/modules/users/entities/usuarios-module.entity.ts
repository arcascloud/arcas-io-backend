import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tusuariosmodule')
export class TusuariosModule {
  @PrimaryGeneratedColumn()
  tusuariosmoduloId: number;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'int' })
  moduloId: number;

  @Column({ type: 'varchar', length: 20 })
  usuario: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  submnudatos: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  submnurocesos: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  submnueportes: string;

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
