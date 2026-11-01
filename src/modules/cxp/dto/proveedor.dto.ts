import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ required: false, description: 'Número de Proveedor (auto-generado si se omite)' })
  @IsString() @IsOptional()
  nroproveedor?: string;

  @ApiProperty({ description: 'Nombres' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo' })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio' })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateProveedorDto {
  @ApiProperty({ description: 'Número de Proveedor', required: false })
  @IsString() @IsOptional()
  nroproveedor?: string;

  @ApiProperty({ description: 'Nombres', required: false })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ description: 'Apellidos', required: false })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;
}
