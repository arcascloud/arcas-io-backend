import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tempresas } from './empresa.entity';

/**
 * Control independiente de CAIs por empresa (antes en tempresasdet tipo='CAI').
 * Un CAI puede amparar varios rangos autorizados (tcai_autorizado.caiId).
 */
@Entity('tcai')
export class TCai {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'caiId' })
  caiId: number;

  @ApiProperty({ description: 'Código CAI' })
  @Column({ type: 'varchar', length: 50, unique: true })
  cai: string;

  @ApiProperty({ enum: ['S', 'N'], default: 'S' })
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;

  @ManyToOne(() => Tempresas)
  @JoinColumn({ name: 'empresaId' })
  empresa: Tempresas;
}
