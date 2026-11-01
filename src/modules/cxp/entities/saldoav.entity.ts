import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxpsalfav')
export class TCxpSaldoAv {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cxpsalfavId' })
  cxpsalfavId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codproveedor: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_aplicado: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fec_proceso: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
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
