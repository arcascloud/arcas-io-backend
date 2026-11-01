import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipomonedas')
export class TtipoMoneda {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'monedaId' })
  monedaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'char', length: 1 })
  simbolo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
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
