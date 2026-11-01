import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosccdocs')
export class TbcoCcdocs {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcosccdocsId' })
  bcosccdocsId: number;

  @ApiProperty({ required: false, description: 'Descripción del documento' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false, description: 'Abreviatura del documento' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  abreviatura: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @Column()
  empresaId: number;

  @ApiProperty({ enum: ['S', 'N'], description: 'Activo (Sí/No)' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
