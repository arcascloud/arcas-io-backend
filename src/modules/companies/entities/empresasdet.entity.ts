import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tempresasdet')
export class TempresasDet {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tempresasdetId' })
  empresasdetId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['TELEFONO', 'DIRECCION', 'CORREO', 'RUC', 'RTN', 'WEBSITE', 'REDESOCIAL', 'CAI'] })
  tipo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 80 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
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
