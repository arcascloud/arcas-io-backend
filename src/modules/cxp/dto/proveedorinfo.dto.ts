import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const TIPOS_INFO_PROVEEDOR = ['CORREO', 'CELULAR', 'DIRECCION'] as const;
export type TipoInfoProveedor = (typeof TIPOS_INFO_PROVEEDOR)[number];

export class CreateProveedorInfoDto {
  @ApiProperty({ description: 'ID del Proveedor (proveedor.proveedorId)' })
  @IsNumber()
  @IsNotEmpty()
  proveedorId: number;

  @ApiProperty({ description: 'Tipo de información', enum: TIPOS_INFO_PROVEEDOR })
  @IsIn(TIPOS_INFO_PROVEEDOR as unknown as string[])
  @IsNotEmpty()
  tipo: TipoInfoProveedor;

  @ApiProperty({ description: 'Descripción / valor del contacto (máx. 50 caracteres)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  descripcion?: string;

  @ApiProperty({ description: 'Estado activo (S/N)', enum: ['S', 'N'], required: false })
  @IsOptional()
  @IsIn(['S', 'N'])
  sn_activo?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  @IsNotEmpty()
  empresaId: number;
}

export class UpdateProveedorInfoDto {
  @ApiProperty({ description: 'ID del Proveedor (proveedor.proveedorId)', required: false })
  @IsOptional()
  @IsNumber()
  proveedorId?: number;

  @ApiProperty({ description: 'Tipo de información', enum: TIPOS_INFO_PROVEEDOR, required: false })
  @IsOptional()
  @IsIn(TIPOS_INFO_PROVEEDOR as unknown as string[])
  tipo?: TipoInfoProveedor;

  @ApiProperty({ description: 'Descripción / valor del contacto (máx. 50 caracteres)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  descripcion?: string;

  @ApiProperty({ description: 'Estado activo (S/N)', enum: ['S', 'N'], required: false })
  @IsOptional()
  @IsIn(['S', 'N'])
  sn_activo?: string;
}
