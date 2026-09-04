import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePosFacCajaDto {
  @ApiProperty({ description: 'ID de la factura' })
  @IsNumber()
  facturaId: number;

  @ApiProperty({ description: 'ID de la forma de pago' })
  @IsNumber()
  formapagoId: number;

  @ApiPropertyOptional({ description: 'ID de la tarjeta de crédito' })
  @IsNumber()
  @IsOptional()
  tarjetacreditoId?: number;

  @ApiPropertyOptional({ description: 'Número de tarjeta' })
  @IsString()
  @IsOptional()
  nrotarjeta?: string;

  @ApiPropertyOptional({ description: 'Número de autorización' })
  @IsString()
  @IsOptional()
  nroautorizacion?: string;

  @ApiPropertyOptional({ description: 'Factor de cambio', default: 0 })
  @IsNumber()
  @IsOptional()
  factordecambio?: number;

  @ApiPropertyOptional({ description: 'Importe en efectivo', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_efectivo?: number;

  @ApiPropertyOptional({ description: 'Importe otros medios de pago', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_otros?: number;

  @ApiPropertyOptional({ description: 'Importe cambio', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_cambio?: number;

  @ApiProperty({ description: 'ID del cajero' })
  @IsNumber()
  cajaId: number;

  @ApiPropertyOptional({ description: 'ID de la empresa' })
  @IsNumber()
  @IsOptional()
  empresaId?: number;

  @ApiPropertyOptional({ description: 'ID de la sucursal' })
  @IsNumber()
  @IsOptional()
  Idsucursal?: number;

  @ApiPropertyOptional({ description: 'Usuario que crea el registro' })
  @IsString()
  @IsOptional()
  usuarioCreated?: string;
}

export class UpdatePosFacCajaDto {
  @ApiPropertyOptional({ description: 'ID de la forma de pago' })
  @IsNumber()
  @IsOptional()
  formapagoId?: number;

  @ApiPropertyOptional({ description: 'ID de la tarjeta de crédito' })
  @IsNumber()
  @IsOptional()
  tarjetacreditoId?: number;

  @ApiPropertyOptional({ description: 'Número de tarjeta' })
  @IsString()
  @IsOptional()
  nrotarjeta?: string;

  @ApiPropertyOptional({ description: 'Número de autorización' })
  @IsString()
  @IsOptional()
  nroautorizacion?: string;

  @ApiPropertyOptional({ description: 'Importe en efectivo', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_efectivo?: number;

  @ApiPropertyOptional({ description: 'Importe otros medios de pago', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_otros?: number;

  @ApiPropertyOptional({ description: 'Importe cambio', default: 0 })
  @IsNumber()
  @IsOptional()
  importe_cambio?: number;

  @ApiPropertyOptional({ description: 'Anulado', enum: ['S', 'N'] })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_anulado?: string;
}
