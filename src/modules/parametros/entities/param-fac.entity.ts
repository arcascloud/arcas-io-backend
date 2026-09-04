import {
  Entity, PrimaryColumn, Column, ManyToOne, JoinColumn
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cxccajero } from '../../cxc/entities/cxccajero.entity';

@Entity('ttipoparamfac')
export class TtipoParamFac {
  @ApiProperty()
  @PrimaryColumn({ name: 'empresaId' })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  bodegaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrofactura: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrocotizacion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nroanulacion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  impuestoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  cajaId: number;

  @ApiProperty({ type: () => Cxccajero, required: false })
  @ManyToOne(() => Cxccajero)
  @JoinColumn({ name: 'cajaId' })
  cajero: Cxccajero;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  lineasFactura: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  diasDevolucion: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  porcentajeDevolucion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nrodpdaventas: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nropdadevolucion: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  nropdaanulacion: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_integrado_cxc: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_puntoventa: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_integrado_caja: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_anticipos: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  mensajeFactura: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_correlativoUnico: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-t' })
  mg_t: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-b' })
  mg_b: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-l' })
  mg_l: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0, name: 'mg-d' })
  mg_d: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multiplezcajeros: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_imprimefactura: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraFactura: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraComprobante: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraMadera: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ImpresoraRecibo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora1: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora2: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora3: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  DriverImpresora4: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto1: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto2: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto3: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 6, nullable: true })
  Puerto4: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_multipleempresa: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_impuestoincluido: string;

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
