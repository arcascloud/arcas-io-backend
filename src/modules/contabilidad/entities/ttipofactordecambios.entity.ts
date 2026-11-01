import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ttipofactordecambios')
export class Ttipofactordecambios {
  @ApiProperty()
  @PrimaryColumn({ name: 'factordecambioId' })
  factordecambioId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0.0000 })
  preciocompra: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0.0000 })
  precioventa: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'E', 'Y'], default: 'D' })
  tipomoneda: string;

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
