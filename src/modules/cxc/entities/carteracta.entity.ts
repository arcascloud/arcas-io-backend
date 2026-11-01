import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Cartera contable por cliente (CxC).
 * Nota: la columna sucursal en BD se llama "Idsucusal" (typo original) — se mapea aquí.
 * La tabla NO tiene sn_activo: las eliminaciones son físicas.
 */
@Entity('cxccarteracta')
export class CxcCarteraCta {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty()
  @Column()
  clienteId: number;

  @ApiProperty()
  @Column({ name: 'carteractaId' })
  carteractaId: number;

  @ApiProperty({ description: 'ID de Sucursal (columna Idsucusal en BD)' })
  @Column({ name: 'Idsucusal' })
  Idsucursal: number;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaCreated: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, default: 'NOW()' })
  usuarioUpdate: string;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaUpdate: Date;
}
