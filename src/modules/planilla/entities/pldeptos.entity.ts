import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Departamento de planilla (`tpldeptos`).
 *
 * Catálogo de departamentos de la empresa usado por el detalle de planilla
 * (`plepladet.departamentoId`) y por el filtro de departamentos del
 * formulario de pagar planilla.
 */
@Entity('tpldeptos')
export class TplDepto {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tpldeptosId' })
  tpldeptosId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['S', 'N'], default: 'S' })
  sn_activo: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  empleadoId: number | null;

  @ApiProperty()
  @Column()
  empresaId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20 })
  usuarioCreated: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  usuarioUpdated: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'datetime', nullable: true })
  fechaUpdated: Date | null;
}
