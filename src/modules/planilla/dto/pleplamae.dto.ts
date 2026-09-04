import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlPlaMaeDto {
  @ApiProperty({ description: 'Período de la planilla' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año de la planilla' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'ID de cuenta bancaria' })
  @IsNumber()
  bcoctasId: number;

  @ApiProperty({ required: false, description: 'Cantidad de ítems' })
  @IsNumber() @IsOptional()
  items?: number;

  @ApiProperty({ required: false, description: 'Total a pagar' })
  @IsNumber() @IsOptional()
  totalapagar?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlPlaMaeDto {
  @ApiProperty({ required: false, description: 'Período de la planilla' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año de la planilla' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'ID de cuenta bancaria' })
  @IsNumber() @IsOptional()
  bcoctasId?: number;

  @ApiProperty({ required: false, description: 'Cantidad de ítems' })
  @IsNumber() @IsOptional()
  items?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Planilla pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Planilla anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ required: false, description: 'Total a pagar' })
  @IsNumber() @IsOptional()
  totalapagar?: number;
}
