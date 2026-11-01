import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** Catálogo de roles del sistema (`ttipo_rol`) */
@Entity('ttipo_rol')
export class TtipoRol {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @ApiProperty({ description: 'Nombre único del rol (ej: admin, supervisor, contador, auxiliar)' })
  @Column({ type: 'varchar', length: 50, unique: true })
  rol: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  usuarioCreated: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaCreated: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  usuarioUpdate: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdate: Date | null;
}
