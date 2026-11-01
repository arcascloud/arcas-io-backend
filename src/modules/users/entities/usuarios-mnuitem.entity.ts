import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tusuariomnuitem')
export class TusuarioMnuItem {
  @PrimaryGeneratedColumn()
  tusuariomnuitemsId: number;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'int' })
  moduloId: number;

  @Column({ type: 'varchar', length: 20 })
  usuario: string;

  @Column({ type: 'int' })
  parent: number;

  @Column({ type: 'int' })
  parentId: number;

  @Column({ type: 'int' })
  levelId: number;

  @Column({ type: 'varchar', length: 50 })
  nameParent: string;

  @Column({ type: 'varchar', length: 50 })
  nameItem: string;

  @Column({ type: 'varchar', length: 50 })
  labelItem: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  iconItem: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  routerLink: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'int', default: 0 })
  zorden: number;

  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
