import { IsNumber, IsString, IsNotEmpty, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCorrelativoDto {
  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  @IsNotEmpty()
  Idsucursal: number;

  @ApiProperty({ description: 'Rango desde (nro factura inicio)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  rangoDesde: string;

  @ApiProperty({ description: 'Rango hasta (nro factura fin)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  rangoHasta: string;

  @ApiProperty({ description: 'Numero de factura actual' })
  @IsNumber()
  @IsNotEmpty()
  nrofactura: number;

  @ApiProperty({ description: 'Fecha limite de vigencia del CAI' })
  @IsNotEmpty()
  fechaLimite: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  empresaId?: number;
}

export class UpdateCorrelativoDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rangoDesde?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rangoHasta?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  nrofactura?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  fechaLimite?: string;
}
