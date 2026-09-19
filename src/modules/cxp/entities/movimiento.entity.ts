import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpmovimientos')
export class TCxpMovimiento {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cxpmovId' })
  bcomovId: number;

  @Column({type:'int', default:0})
  nromovimiento: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, nullable: true })
  nrocuentabco: string;

  @ApiProperty()
  @Column()
  moduloId: number;

  @ApiProperty()
  @Column()
  documentoId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  tipomov: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nroreferencia: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  concepto: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion2: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  nrochq: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_chq: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_chq_anulado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_conciliado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_contabilizado: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_doc_anulado: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fec_anulacion: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  partidaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

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
