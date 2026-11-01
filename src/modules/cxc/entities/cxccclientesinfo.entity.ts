import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cxccclientesinfo')
export class CxcClientesInfo {
  @ApiProperty({ description: 'ID del registro' })
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty({ description: 'ID del Cliente (cxcclientes.clienteId)' })
  @Column({ name: 'clienteid', type: 'int' })
  clienteid: number;

  @ApiProperty({ description: 'Tipo de información', enum: ['CELULAR', 'DIRECCION', 'CORREO'] })
  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['CELULAR', 'DIRECCION', 'CORREO'],
    default: 'CORREO',
  })
  tipo: string;

  @ApiProperty({ description: 'Descripción / valor del contacto', required: false })
  @Column({ name: 'descripcion', type: 'varchar', length: 50, nullable: true })
  descripcion: string | null;

  @ApiProperty({ description: 'Estado activo (S/N)', enum: ['S', 'N'] })
  @Column({ name: 'sn_activo', type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ description: 'ID de Empresa', required: false })
  @Column({ name: 'empresaId', type: 'int', nullable: true })
  empresaId: number | null;

  @ApiProperty({ description: 'Usuario creador' })
  @Column({ name: 'usuarioCreated', type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ description: 'Usuario modificador', required: false })
  @Column({ name: 'usuarioUpdated', type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string | null;

  @ApiProperty({ description: 'Fecha de última modificación', required: false })
  @Column({ name: 'fechaUpdated', type: 'datetime', nullable: true })
  fechaUpdated: Date | null;
}
