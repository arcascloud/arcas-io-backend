import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cocierredet')
export class Cocierredet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cocierredetId' })
  cocierredetId: number;

  @ApiProperty({ description: 'ID del maestro de cierre (cocierremae)' })
  @Column({ type: 'int', default: 0 })
  cocierremaeId: number;

  @ApiProperty({ description: 'Año contable' })
  @Column({ type: 'int' })
  anio: number;

  @ApiProperty({ description: 'Período contable (1-12)' })
  @Column({ type: 'int' })
  periodo: number;

  @ApiProperty({ description: 'Código de cuenta contable' })
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty({ required: false, description: 'Saldo de cierre' })
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00, nullable: true })
  saldo: number;

  @ApiProperty({ required: false, description: 'Tipo de saldo: D (deudor) / C (acreedor)' })
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D', nullable: true })
  tiposaldo: string;

  @ApiProperty()
  @Column()
  Idsucursal: number;

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
