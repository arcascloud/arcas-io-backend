import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TinvCategoria } from './categoria.entity';
import { TinvDepto } from './deptos.entity';
import { TinvMarca } from './marca.entity';
import { TinvPasillo } from './pasillo.entity';


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

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo_sku: string;

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
  deptoId: number;
 
  @ApiProperty()
  @Column()
  categoriaId: number;
 
  @ApiProperty()
  @Column()
  marcaId: number;

  @ApiProperty()
  @Column()
  pasilloId: number;
 
  @ApiProperty()
  @Column() 
  impuestoId: number;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_controlado: string; //PRODUCTOS CONTROLADOS COMO FARMACOS ESPECIFICOS, O MATERIAL AGROINDUSTRIAL CONTROLADO
 
  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_droga: string; //PRODUCTOS CONTROLADOS COMO FARMACOS ESPECIFICOS, O MATERIAL AGROINDUSTRIAL CONTROLADO

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_valida_lote: string; //VA A VALIDAR EN EL FUTURO EL MANEJO DE LOTE DE VENCIMIENTO EN LOS PRODUCTOS

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'N' })
  sn_enviar_a_cocina: string; //PLATILLOS QUE SON SOLICITADO A COCINA
  
  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

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

  @ApiProperty({ type: () => TinvDepto })
  @ManyToOne(() => TinvDepto)
  @JoinColumn({ name: 'deptoId' })
  departamento: TinvPasillo;

  @ApiProperty({ type: () => TinvCategoria })
  @ManyToOne(() => TinvCategoria)
  @JoinColumn({ name: 'categoriaId' })
  categoria: TinvCategoria;
  
  @ApiProperty({ type: () => TinvMarca })
  @ManyToOne(() => TinvMarca)
  @JoinColumn({ name: 'marcaId' })
  marca: TinvMarca;
 
  @ApiProperty({ type: () => TinvPasillo })
  @ManyToOne(() => TinvPasillo)
  @JoinColumn({ name: 'pasilloId' })
  pasillo: TinvPasillo;
  
 
 
}
