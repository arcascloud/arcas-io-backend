import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcocarteras')
export class Tcocarteras {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tcocarteraId' })
  tcocarteraId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0, nullable: true })
  moduloId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  ctacontable: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empresaId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioCreated: string;
}
