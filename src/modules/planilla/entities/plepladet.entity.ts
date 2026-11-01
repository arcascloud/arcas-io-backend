import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('plepladet')
export class PlPlaDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'plepladetId' })
  plepladetId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  planillaId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'int' })
  empleadoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  departamentoId: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldobruto: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_dihss: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drap: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drtf: number;

  // Impuesto Vecinal (RETECION-VECINAL): antes venía mezclado dentro de
  // importe_drtf; columna propia desde 20/10/2026 (ALTER aprobado).
  // El default 0 es OBLIGATORIO contra la BD (NOT NULL sin default).
  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_drvc: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_dotras: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_ccomision: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_chorasextras: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  importe_cbonos: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  sueldoneto: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_pagar: string;

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
