import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tcotipodocumentofiscal')
export class TCoTipoDocumentoFiscal {
  @ApiProperty()
  @PrimaryGeneratedColumn({ name: 'tipodocumentofiscalId' })
  tipodocumentofiscalId: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50 })
  descripcion: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10 })
  abreviatura: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: ['D', 'C'], default: 'D' }) // La naturaleza del documento fiscal, si es de tipo Debito o Credito 
  naturaleza: string;

  @ApiProperty()
  @Column() // va ser para vincular los documentos fiscales por modulo
  moduloId: number;

  @ApiProperty()
  @Column()  // va ser para vincular la plantilla contable que va afectar el documento
  plantillapdamaeId: number;

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
}
