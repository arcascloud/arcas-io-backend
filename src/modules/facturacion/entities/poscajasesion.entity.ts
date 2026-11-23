import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TPosCajaMovimiento } from './poscajamovimiento.entity';
import { TPosCajaCorte } from './poscajacorte.entity';

@Entity('poscajasesion')
@Index('idx_sesion_empresa_caja_estado', ['empresaId', 'cajaId', 'estado'])
@Index('idx_sesion_usuario_fecha', ['empresaId', 'usuarioId', 'fecha_apertura'])
export class TPosCajaSesion {
  @ApiProperty()
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @ApiProperty()
  @Column({ type: 'bigint', unsigned: true })
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'bigint', unsigned: true })
  cajaId: number;

  @ApiProperty()
  @Column({ type: 'bigint', unsigned: true })
  usuarioId: number;

  @ApiProperty({ enum: ['ABIERTA', 'CERRADA'] })
  @Column({ type: 'enum', enum: ['ABIERTA', 'CERRADA'], default: 'ABIERTA' })
  estado: string;

  @ApiProperty()
  @Column({ type: 'datetime', precision: 6 })
  fecha_apertura: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0.00 })
  monto_apertura: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', precision: 6, nullable: true })
  fecha_cierre: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  monto_sistema_cierre: number | null;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  monto_declarado_cierre: number | null;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  diferencia_cierre: number | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 500, nullable: true })
  observacion_cierre: string | null;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  usuarioCreated: string;

  @ApiProperty()
  @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  usuarioUpdated: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', precision: 6, nullable: true })
  fechaUpdated: Date | null;

  @OneToMany(() => TPosCajaMovimiento, (mov) => mov.sesion)
  movimientos: TPosCajaMovimiento[];

  @OneToMany(() => TPosCajaCorte, (corte) => corte.sesion)
  cortes: TPosCajaCorte[];
}
