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

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 2000, nullable: true })
  direccion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono1: string;
  
  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono2: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false, description: 'Bodega por defecto de la sucursal (facturación/kardex)' })
  @Column({ type: 'int', nullable: true })
  bodegaId: number;

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

  @ApiProperty({ type: () => Tempresas, required: false })
  @ManyToOne(() => Tempresas, (e) => e.sucursales)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;
}
