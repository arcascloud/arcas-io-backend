import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';
import { Tusuarios } from '../../users/entities/usuario.entity';

@Entity('tempresas')
export class Tempresas {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'datetime' })
  fechasistema: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, default: 'LA FACTURA ES BENEFICIO DE TODOS' })
  msjfactura: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, default: 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS' })
  msjdevfactura: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 200, default: 'NO SE ACEPTAN DEVOLUCIONES O CAMBIOS DESPUES DE 15 DIAS' })
  msjcotizacion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ApiProperty({ type: () => [Tsucursal], required: false })
  @OneToMany(() => Tsucursal, (s) => s.empresa)
  sucursales: Tsucursal[];

  @ApiProperty({ type: () => [Tusuarios], required: false })
  @OneToMany(() => Tusuarios, (u) => u.empresa)
  usuarios: Tusuarios[];
}
