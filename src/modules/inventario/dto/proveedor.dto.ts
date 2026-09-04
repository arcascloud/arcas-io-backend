import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ description: 'Número de proveedor' })
  @IsString() @IsNotEmpty()
  nroproveedor: string;

  @ApiProperty({ description: 'Nombres del proveedor' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos del proveedor' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ required: false, description: 'Razón social del proveedor' })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ required: false, description: 'DNI del proveedor' })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ enum: ['M', 'F'], required: false, description: 'Sexo del proveedor' })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ enum: ['S', 'C', 'D', 'V', 'U'], required: false, description: 'Estado civil del proveedor' })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'RTN del proveedor' })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ required: false, description: 'Límite de crédito del proveedor' })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ required: false, description: 'Días de plazo del proveedor' })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ required: false, description: 'Tasa de interés del proveedor' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de moratorio del proveedor' })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ enum: ['A', 'B', 'C', 'D', 'E'], required: false, description: 'Categoría del proveedor' })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateProveedorDto {
  @ApiProperty({ required: false, description: 'Número de proveedor' })
  @IsString() @IsOptional()
  nroproveedor?: string;

  @ApiProperty({ required: false, description: 'Nombres del proveedor' })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ required: false, description: 'Apellidos del proveedor' })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ required: false, description: 'Razón social del proveedor' })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ required: false, description: 'DNI del proveedor' })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ enum: ['M', 'F'], required: false, description: 'Sexo del proveedor' })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ enum: ['S', 'C', 'D', 'V', 'U'], required: false, description: 'Estado civil del proveedor' })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'RTN del proveedor' })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ required: false, description: 'Límite de crédito del proveedor' })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ required: false, description: 'Días de plazo del proveedor' })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ required: false, description: 'Tasa de interés del proveedor' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de moratorio del proveedor' })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ enum: ['A', 'B', 'C', 'D', 'E'], required: false, description: 'Categoría del proveedor' })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
