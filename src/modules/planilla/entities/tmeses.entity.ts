import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Meses del año (`tmeses`).
 *
 * Catálogo global (sin empresaId) de los 12 meses; se usa para etiquetar
 * los períodos del select de Periodo en el formulario de pagar planilla
 * (el valor del control sigue siendo el número de mes de `coperiodoctable`).
 */
@Entity('tmeses')
export class TMes {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tmesId' })
  tmesId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 45 })
  descripcion: string;
}
