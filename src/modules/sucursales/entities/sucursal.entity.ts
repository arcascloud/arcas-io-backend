import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tempresas } from '../../companies/entities/empresa.entity';

@Entity('tsucursal')
export class Tsucursal {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'Idsucursal' })
  idsucursal: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

  @ApiProperty({ type: () => Tempresas, required: false })
  @ManyToOne(() => Tempresas, (e) => e.sucursales)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;
}
