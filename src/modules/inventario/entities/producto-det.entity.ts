import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('productosdet')
export class TproductoDet {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  productosdetsId: number;

  @ApiProperty()
  @Column({ type: 'int' })
  produtoId: number;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: ['MARCA', 'MODELO', 'EMBALAJE', 'PASILLO', 'DEPARTAMENTO', 'UBICACION', 'COLOR', 'PESO', 'EQUIVALENCIA', 'CODIGOBARRA', 'TAMAÑO'],
    default: 'MARCA',
  })
  tipo: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 30 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty()
  @Column({ type: 'int' })
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
