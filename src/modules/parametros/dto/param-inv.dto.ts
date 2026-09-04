import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamInvDto {
  @ApiProperty({ required: false, description: 'ID de bodega predeterminada' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'Correlativo de compra' })
  @IsNumber() @IsOptional()
  nrocompra?: number;

  @ApiProperty({ required: false, description: 'Correlativo de traslado' })
  @IsNumber() @IsOptional()
  nrotrasladoo?: number;

  @ApiProperty({ required: false, description: 'Correlativo de ajuste' })
  @IsNumber() @IsOptional()
  nroajuste?: number;

  @ApiProperty({ required: false, description: 'Correlativo físico' })
  @IsNumber() @IsOptional()
  nrofisico?: number;

  @ApiProperty({ required: false, description: 'Correlativo de requisición' })
  @IsNumber() @IsOptional()
  nrorequisicion?: number;

 @ApiProperty({ required: false, description: 'ID de impuesto de compra' })
  @IsNumber() @IsOptional()
  impuestocompraId?: number;


  @ApiProperty({ required: false, description: 'ID de precio de venta' })
  @IsNumber() @IsOptional()
  preciovtaId?: number;

  @ApiProperty({ required: false, description: 'ID de impuesto de venta' })
  @IsNumber() @IsOptional()
  impuestoventaId?: number;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Requiere lote' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_requirelote?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Modo supermercado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_supermercado?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Múltiples precios' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_multiplesprecios?: string;
}

export class UpdateParamInvDto extends CreateParamInvDto {}
