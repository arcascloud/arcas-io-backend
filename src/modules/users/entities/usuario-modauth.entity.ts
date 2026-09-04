import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('usuariomodauth')
export class UsuarioModAuth {
  @PrimaryGeneratedColumn()
  usuariomodauthId: number;

  @Column({ type: 'varchar', length: 12 })
  usuario: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_devoluciones: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_reversion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_anulaciones: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_auth_facturacion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_auth_contabilizar: string;

  @Column({ type: 'datetime', nullable: true })
  fechaoperativa: Date;

  @Column({ type: 'int' })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
