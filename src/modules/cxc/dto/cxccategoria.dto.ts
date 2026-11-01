import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCxcCategoriaDto {
  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo' })
  @IsNumber()
  diasplazo: number;

  @ApiProperty({ description: 'Días de Gracia' })
  @IsNumber()
  diasgracia: number;

  @ApiProperty({ description: 'Interés' })
  @IsNumber()
  interes: number;

  @ApiProperty({ description: 'Moratorio' })
  @IsNumber()
  moratorio: number;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCxcCategoriaDto {
  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Días de Gracia', required: false })
  @IsNumber() @IsOptional()
  diasgracia?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de Módulo', required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
