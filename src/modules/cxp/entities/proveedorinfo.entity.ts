import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('proveedorinfo')
export class TCxpProveedorInfo {
  @ApiProperty({ description: 'ID del registro' })
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty({ description: 'ID del Proveedor (proveedor.proveedorId)' })
  @Column({ name: 'proveedorId', type: 'int' })
  proveedorId: number;

  @ApiProperty({ description: 'Tipo de información', enum: ['CORREO', 'CELULAR', 'DIRECCION'] })
  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['CORREO', 'CELULAR', 'DIRECCION'],
    default: 'CORREO',
  })
  tipo: string;

  @ApiProperty({ description: 'Descripción / valor del contacto (máx. 50 caracteres)', required: false })
  @Column({ name: 'descripcion', type: 'varchar', length: 50, nullable: true })
  descripcion: string | null;

  @ApiProperty({ description: 'Estado activo (S/N)', enum: ['S', 'N'] })
  @Column({ name: 'sn_activo', type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @Column({ name: 'empresaId', type: 'int' })
  empresaId: number;

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
