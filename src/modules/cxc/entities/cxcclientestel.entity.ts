import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('cxcclientestel')
export class CxcClienteTel {
  @PrimaryGeneratedColumn({ name: 'clientetelefonoId' })
  clientetelefonoId: number;

  @Column()
  clienteId: number;

  @Column()
  telefonoId: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
