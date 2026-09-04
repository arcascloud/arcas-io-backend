import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscbodet')
export class TPosCboDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscbodetId' })
  poscbodetId: number;

  @ApiProperty()
  @Column()
  poscbomaeId: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  productoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  cantidad: number;

  @ApiProperty({ required: false })
  @Column({ type: 'double', nullable: true })
  precioventa: number;

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
