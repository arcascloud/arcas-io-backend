import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedortel')
export class TCxpProveedorTel {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'proveedorestelefonosId' })
  proveedorestelefonosId: number;

  @ApiProperty()
  @Column()
  proveedorId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  telefonoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 10, nullable: true })
  descripcion: string;

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
