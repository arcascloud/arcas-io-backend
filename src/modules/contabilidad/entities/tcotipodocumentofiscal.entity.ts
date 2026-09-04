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
  @Column()  // va ser para vincular la cuenta contable que va afectar el documento
  cuentacontableId: number;

  @ApiProperty()
  @Column() // en el caso de las facturacion, se puede usar ticket para llever un correlativo de preregistro
  nrocorrelativo: number;

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
}
