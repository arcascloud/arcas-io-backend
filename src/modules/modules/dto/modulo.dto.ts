import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuloDto {
  @ApiProperty({ description: 'Nombre del módulo' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ description: 'Abreviatura del módulo (ej: INV, FAC, CXC)', maxLength: 20 })
  @IsString() @IsOptional()
  @MaxLength(20)
  abreviatura?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateModuloDto {
  @ApiProperty({ required: false, description: 'Nombre del módulo' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ required: false, description: 'Abreviatura del módulo', maxLength: 20 })
  @IsString() @IsOptional()
  @MaxLength(20)
  abreviatura?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
