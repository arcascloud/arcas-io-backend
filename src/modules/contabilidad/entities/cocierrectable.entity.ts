import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cocierrectable')
export class Cocierrectable {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'cierrectableId' })
  cierrectableId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  periodo: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  anio: number;

  @ApiProperty()
  @Column({ type: 'datetime' })
  fechacierre: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  observacion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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
