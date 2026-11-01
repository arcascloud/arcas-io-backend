import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('timpresoras')
export class TImpresora {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'timpresorasId' })
  timpresorasId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['TICKET', 'CARTA'], default: 'TICKET' })
  formato: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  driver: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  puerto: string;

  @ApiProperty({ enum: ['A', 'M'], description: 'Modo correlativo: A=Automático, M=Manual' })
  @Column({ type: 'enum', enum: ['A', 'M'], default: 'A' })
  modo_correlativo: string;

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
