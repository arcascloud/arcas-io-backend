import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBancoDto {
  @ApiProperty({ description: 'Nombre del banco' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBancoDto {
  @ApiProperty({ required: false, description: 'Nombre del banco' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateBcoCtaDto {
  @ApiProperty({ description: 'ID del banco' })
  @IsNumber()
  bancoId: number;

  @ApiProperty({ description: 'Número de cuenta bancaria' })
  @IsString() @IsNotEmpty()
  nrocuenta: string;

  @ApiProperty({ description: 'ID de la moneda' })
  @IsNumber()
  monedaId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBcoCtaDto {
  @ApiProperty({ required: false, description: 'ID del banco' })
  @IsNumber() @IsOptional()
  bancoId?: number;

  @ApiProperty({ required: false, description: 'Número de cuenta bancaria' })
  @IsString() @IsOptional()
  nrocuenta?: string;

  @ApiProperty({ required: false, description: 'ID de la moneda' })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
