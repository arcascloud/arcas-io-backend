import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tempresas } from '../../companies/entities/empresa.entity';
import { Tsucursal } from '../../sucursales/entities/sucursal.entity';

@Entity('poscorrelativos')
export class TPosCorrelativos {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscorrelativosId' })
  poscorrelativosId: number;

  @ApiProperty()
  @Column()
  nrofactura: number;

  @ApiProperty()
  @Column()
  empresaId: number;
  
  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  rangoDesde;
  
  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  rangoHasta;
  
  @ApiProperty({ required: true })
  @Column({ type: 'datetime', nullable: false })
  fechaLimite;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;
  
  @ApiProperty()
  @Column({ type: 'int' })
  Idsucursal: number;

  @ManyToOne(() => Tsucursal)
  @JoinColumn({ name: 'Idsucursal' })
  sucursal: Tsucursal;
  
  @ManyToOne(() => Tempresas)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;
  
  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
