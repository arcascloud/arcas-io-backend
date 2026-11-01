import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcogrupocontable')
export class Tcogrupocontable {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcogrupocontableId' })
  tcogrupocontableId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
