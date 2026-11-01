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

  @ApiProperty({ description: 'Cuenta contable asociada (coctacontables.ctacontable)' })
  @Column({ type: 'varchar', length: 20 })
  ctacontable: string;

  @ApiProperty()
  @Column()
  monedaId: number;

  @ApiProperty()
  @Column()
  saldo: number;

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
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date;
}
