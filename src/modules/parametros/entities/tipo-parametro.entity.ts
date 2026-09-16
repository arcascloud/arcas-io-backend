import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipoparametros')
export class TipoParametro {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ttipoparametrosId' })
  ttipoparametrosId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  field: string;

  @ApiProperty({ enum: ['NUMBER', 'STRING'] })
  @Column({ type: 'enum', enum: ['NUMBER', 'STRING'], default: 'NUMBER' })
  tipo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: '0' })
  valor: string;

  @ApiProperty({ enum: ['S', 'N'] })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  moduloId: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  Idsucursal: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 12 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 12, nullable: true })
  usuarioUpdate: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdate: Date;
}
