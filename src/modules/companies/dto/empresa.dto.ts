import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ description: 'Nombre de la empresa' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Mensaje de factura' })
  @IsString() @IsOptional()
  msjfactura?: string;

  @ApiProperty({ required: false, description: 'Mensaje de devolución de factura' })
  @IsString() @IsOptional()
  msjdevfactura?: string;

  @ApiProperty({ required: false, description: 'Mensaje de cotización' })
  @IsString() @IsOptional()
  msjcotizacion?: string;
}

export class UpdateEmpresaDto {
  @ApiProperty({ required: false, description: 'Nombre de la empresa' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Mensaje de factura' })
  @IsString() @IsOptional()
  msjfactura?: string;

  @ApiProperty({ required: false, description: 'Mensaje de devolución de factura' })
  @IsString() @IsOptional()
  msjdevfactura?: string;

  @ApiProperty({ required: false, description: 'Mensaje de cotización' })
  @IsString() @IsOptional()
  msjcotizacion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
