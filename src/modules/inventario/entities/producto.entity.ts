import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TinvCategoria } from './categoria.entity';

@Entity('productos')
export class Tproducto {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'productoId' })
  produtoId: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  codbarra: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 250, nullable: true })
  descripcion: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  descripcion_corta: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cstounit: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  cstoprom: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  precioventa: number;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltcom: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fecUltvta: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  puntoretorno: number;

  @ApiProperty()
  @Column()
  categoriaId: number;
 
  @ApiProperty()
  @Column() // se agrego para el manejo de impuestos por productos, sin embargo se podra obtener de forma preinicializada 
  // de la ttipoparaminv por medio de impuestoventaId, ya que hay productos que pagan mas impuestos como por ejemplo los licores y cerverza 
  impuestoId: number;

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

  @ApiProperty({ type: () => TinvCategoria })
  @ManyToOne(() => TinvCategoria)
  @JoinColumn({ name: 'categoriaId' })
  categoria: TinvCategoria;
}
