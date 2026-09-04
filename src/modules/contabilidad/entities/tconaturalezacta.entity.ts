import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tconaturalezacta')
export class Tconaturalezacta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'naturalezaCtaId' })
  naturalezaCtaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' })
  descripcion: string;

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
