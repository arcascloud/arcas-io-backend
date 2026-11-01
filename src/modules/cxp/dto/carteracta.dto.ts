import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarteraCtaDto {
  @ApiProperty({ description: 'ID de Proveedor' })
  @IsNumber()
  @IsNotEmpty()
  proveedorId: number;

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

export class UpdateCarteraCtaDto {
  @ApiProperty({ description: 'ID de Proveedor', required: false })
  @IsNumber()
  @IsOptional()
  proveedorId?: number;

  @ApiProperty({ description: 'ID de Cartera Contable (tcocarteras)', required: false })
  @IsNumber()
  @IsOptional()
  carteractaId?: number;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber()
  @IsOptional()
  Idsucursal?: number;
}
