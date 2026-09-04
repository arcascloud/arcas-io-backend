import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosdir')
export class TbcoDireccion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcosdireccionid' })
  bcosdireccionid: number;

  @ApiProperty()
  @Column()
  bancoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  direccionId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
