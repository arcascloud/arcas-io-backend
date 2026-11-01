import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGestorDto {
  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID del empleado' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ description: 'ID de la empresa (obligatorio: la columna NOT NULL no tiene default)' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID del usuario del sistema vinculado (se resuelve desde el usuario autenticado si no llega)' })
  @IsNumber() @IsOptional()
  usuarioId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es vendedor' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_vendedor?: string;
}

export class UpdateGestorDto {
  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'ID del empleado' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es vendedor' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_vendedor?: string;
}
