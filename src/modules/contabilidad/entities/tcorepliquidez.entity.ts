import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcorepliquidez')
export class Tcorepliquidez {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcorepliquidezId' })
  tcorepliquidezId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  objetivo: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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
