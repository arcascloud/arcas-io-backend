import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlPlaDetDto {
  @ApiProperty({ description: 'ID de la planilla' })
  @IsNumber()
  planillaId: number;

  @ApiProperty({ description: 'ID del empleado' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ required: false, description: 'ID del departamento' })
  @IsNumber() @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Importe IHSS' })
  @IsNumber() @IsOptional()
  importe_dihss?: number;

  @ApiProperty({ required: false, description: 'Importe Rap' })
  @IsNumber() @IsOptional()
  importe_drap?: number;

  @ApiProperty({ required: false, description: 'Importe RTF' })
  @IsNumber() @IsOptional()
  importe_drtf?: number;

  @ApiProperty({ required: false, description: 'Importe otras deducciones' })
  @IsNumber() @IsOptional()
  importe_dotras?: number;

  @ApiProperty({ required: false, description: 'Importe comisión' })
  @IsNumber() @IsOptional()
  importe_ccomision?: number;

  @ApiProperty({ required: false, description: 'Importe horas extras' })
  @IsNumber() @IsOptional()
  importe_chorasextras?: number;

  @ApiProperty({ required: false, description: 'Importe bonos' })
  @IsNumber() @IsOptional()
  importe_cbonos?: number;

  @ApiProperty({ required: false, description: 'Sueldo neto' })
  @IsNumber() @IsOptional()
  sueldoneto?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlPlaDetDto {
  @ApiProperty({ required: false, description: 'ID de la planilla' })
  @IsNumber() @IsOptional()
  planillaId?: number;

  @ApiProperty({ required: false, description: 'ID del empleado' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'ID del departamento' })
  @IsNumber() @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Importe IHSS' })
  @IsNumber() @IsOptional()
  importe_dihss?: number;

  @ApiProperty({ required: false, description: 'Importe Rap' })
  @IsNumber() @IsOptional()
  importe_drap?: number;

  @ApiProperty({ required: false, description: 'Importe RTF' })
  @IsNumber() @IsOptional()
  importe_drtf?: number;

  @ApiProperty({ required: false, description: 'Importe otras deducciones' })
  @IsNumber() @IsOptional()
  importe_dotras?: number;

  @ApiProperty({ required: false, description: 'Importe comisión' })
  @IsNumber() @IsOptional()
  importe_ccomision?: number;

  @ApiProperty({ required: false, description: 'Importe horas extras' })
  @IsNumber() @IsOptional()
  importe_chorasextras?: number;

  @ApiProperty({ required: false, description: 'Importe bonos' })
  @IsNumber() @IsOptional()
  importe_cbonos?: number;

  @ApiProperty({ required: false, description: 'Sueldo neto' })
  @IsNumber() @IsOptional()
  sueldoneto?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Pagar empleado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagar?: string;
}
