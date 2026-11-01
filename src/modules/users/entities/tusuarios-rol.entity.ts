import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tusuarios } from './usuario.entity';

/** Asignación de roles por usuario (`tusuarios_rol`) */
@Entity('tusuarios_rol')
export class TusuariosRol {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'rol_id' })
  rol_id: number;

  @ApiProperty()
  @Column({ type: 'int' })
  usuarioId: number;

  @ApiProperty({ description: 'Nombre del rol (FK lógico a ttipo_rol.rol)' })
  @Column({ type: 'varchar', length: 50 })
  rol: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaCreated: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdate: Date | null;

  @ManyToOne(() => Tusuarios)
  @JoinColumn({ name: 'usuarioId', referencedColumnName: 'usuarioId' })
  usuario: Tusuarios;
}
