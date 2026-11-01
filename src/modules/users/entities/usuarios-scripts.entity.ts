import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tusuariosscripts')
export class TusuariosScripts {
  @PrimaryGeneratedColumn()
  tusuarioscriptsId: number;

  @Column({ type: 'varchar', length: 20 })
  usuario: string;

  @Column({ type: 'varchar', length: 15 })
  script: string;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
