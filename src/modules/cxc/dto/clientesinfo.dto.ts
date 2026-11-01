import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const TIPOS_INFO_CLIENTE = ['CELULAR', 'DIRECCION', 'CORREO'] as const;
export type TipoInfoCliente = (typeof TIPOS_INFO_CLIENTE)[number];

export class CreateCxcClientesInfoDto {
  @ApiProperty({ description: 'ID del Cliente (cxcclientes.clienteId)' })
  @IsNumber()
  @IsNotEmpty()
  clienteid: number;

  @ApiProperty({ description: 'Tipo de información', enum: TIPOS_INFO_CLIENTE })
  @IsIn(TIPOS_INFO_CLIENTE as unknown as string[])
  @IsNotEmpty()
  tipo: TipoInfoCliente;

  @ApiProperty({ description: 'Descripción / valor del contacto', required: false })
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

export class UpdateCxcClientesInfoDto {
  @ApiProperty({ description: 'ID del Cliente (cxcclientes.clienteId)', required: false })
  @IsOptional()
  @IsNumber()
  clienteid?: number;

  @ApiProperty({ description: 'Tipo de información', enum: TIPOS_INFO_CLIENTE, required: false })
  @IsOptional()
  @IsIn(TIPOS_INFO_CLIENTE as unknown as string[])
  tipo?: TipoInfoCliente;

  @ApiProperty({ description: 'Descripción / valor del contacto', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  descripcion?: string;

  @ApiProperty({ description: 'Estado activo (S/N)', enum: ['S', 'N'], required: false })
  @IsOptional()
  @IsIn(['S', 'N'])
  sn_activo?: string;
}
