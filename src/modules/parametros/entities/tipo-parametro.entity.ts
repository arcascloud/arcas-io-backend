import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** Grupos de ttipoparametros — debe coincidir EXACTAMENTE con el enum de la BD */
export const GRUPOS_TIPO_PARAMETRO = ['CORRELATIVO', 'IMPUESTO', 'INTERES', 'IMPRESION', 'ASIENTO', 'CONTABLE'] as const;
export type GrupoTipoParametro = (typeof GRUPOS_TIPO_PARAMETRO)[number];

@Entity('ttipoparametros')
export class TipoParametro {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'ttipoparametrosId' })
  ttipoparametrosId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  field: string;

  @ApiProperty({ description: 'Descripción del parámetro (máx. 80)', maxLength: 80 })
  @Column({ type: 'varchar', length: 80, default: '0' })
  descripcion: string;

  @ApiProperty({ enum: ['NUMBER', 'STRING'] })
  @Column({ type: 'enum', enum: ['NUMBER', 'STRING'], default: 'NUMBER' })
  tipo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: '0' })
  valor: string;

  @ApiProperty({ enum: ['S', 'N'] })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ enum: GRUPOS_TIPO_PARAMETRO, description: 'Grupo del parámetro' })
  @Column({ type: 'enum', enum: [...GRUPOS_TIPO_PARAMETRO], default: 'CORRELATIVO' })
  grupo: GrupoTipoParametro;

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
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdate: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdate: Date;
}
