import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrecioVtaDto {
  @ApiProperty({ description: 'Descripción del precio de venta' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Porcentaje sobre el costo' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ description: 'ID de la empresa (obligatorio: la columna NOT NULL no tiene default)' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class UpdatePrecioVtaDto {
  @ApiProperty({ required: false, description: 'Descripción del precio de venta' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Porcentaje sobre el costo' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
