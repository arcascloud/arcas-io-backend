import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poscotmae')
export class TPosCotMae {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'poscotmaeId' })
  poscotmaeId: number;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecharegistro: Date;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  Nombrecliente: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 100 })
  atendio: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  gestorId: number;

  @ApiProperty({ required: false, description: 'ID del descuento aplicado (tposdescuentos)' })
  @Column({ nullable: true })
  descuentoId: number;


  @ApiProperty()
  @Column()
  partidaId: number

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

  @ApiProperty({ enum: ['A', 'F', 'X'], required: false, description: 'Estado carrito: A=Activo, F=Facturado, X=Anulado' })
  @Column({ type: 'enum', enum: ['A', 'F', 'X'], default: 'A' })
  sn_estadocarrito: string;
}
