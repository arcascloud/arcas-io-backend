import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCxcCarteraCtaDto {
  @ApiProperty({ description: 'ID de Cliente' })
  @IsNumber()
  @IsNotEmpty()
  clienteId: number;

  @ApiProperty({ description: 'ID de Cartera Contable (tcocarteras)' })
  @IsNumber()
  @IsNotEmpty()
  carteractaId: number;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber()
  @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  @IsNotEmpty()
  empresaId: number;
}

export class UpdateCxcCarteraCtaDto {
  @ApiProperty({ description: 'ID de Cliente', required: false })
  @IsNumber()
  @IsOptional()
  clienteId?: number;

  @ApiProperty({ description: 'ID de Cartera Contable (tcocarteras)', required: false })
  @IsNumber()
  @IsOptional()
  carteractaId?: number;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber()
  @IsOptional()
  Idsucursal?: number;
}
