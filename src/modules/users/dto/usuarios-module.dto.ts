import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuariosModuleDto {
  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Submenú Datos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnudatos?: string;

  @ApiProperty({ description: 'Submenú Procesos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnurocesos?: string;

  @ApiProperty({ description: 'Submenú Exportes', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnueportes?: string;
}

export class UpdateUsuariosModuleDto {
  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Submenú Datos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnudatos?: string;

  @ApiProperty({ description: 'Submenú Procesos', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnurocesos?: string;

  @ApiProperty({ description: 'Submenú Exportes', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  submnueportes?: string;
}
