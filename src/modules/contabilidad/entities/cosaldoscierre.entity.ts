import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cocierredet')
export class Cosaldoscierre {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cocierredetId' })
  cosaldoscierreId: number;

  @ApiProperty()
  @Column()
  anio: number;

  @ApiProperty()
  @Column()
  periodo: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0.00 })
  saldo: number;

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
