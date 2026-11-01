import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioCajaDto {
  @ApiProperty({ description: 'Usuario (FK tunidades/tusuarios.usuario)' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ required: false, description: 'Código de caja (default 0)' })
  @IsNumber() @IsOptional()
  codigo?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, enum: ['TICKET', 'CARTA'], description: 'Formato de impresión' })
  @IsEnum(['TICKET', 'CARTA']) @IsOptional()
  forma?: string;

  @ApiProperty({ required: false, enum: ['A', 'M'], description: 'Modo de correlativo' })
  @IsEnum(['A', 'M']) @IsOptional()
  modo_correlativo?: string;

  @ApiProperty({ description: 'Empresa (lo inyecta el frontend)' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioCajaDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  usuario?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  codigo?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, enum: ['TICKET', 'CARTA'] })
  @IsEnum(['TICKET', 'CARTA']) @IsOptional()
  forma?: string;

  @ApiProperty({ required: false, enum: ['A', 'M'] })
  @IsEnum(['A', 'M']) @IsOptional()
  modo_correlativo?: string;
}
