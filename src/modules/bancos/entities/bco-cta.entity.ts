import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('bcosctas')
export class TbcoCta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'bcoctasId' })
  bcoctasId: number;

  @ApiProperty()
  @Column()
  bancoId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  nrocuenta: string;

  @ApiProperty()
  @Column()
  monedaId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  Idsucursal: number;

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
