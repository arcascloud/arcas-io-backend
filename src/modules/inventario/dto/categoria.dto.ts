import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ description: 'Descripción de la categoría' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID del departamento', required: false })
  @IsNumber() @IsOptional()
  deptoId?: number;

  @ApiProperty({ enum: ['C', 'F', 'R'], required: false, description: 'C=Comercio, F=Farmacias, R=Restaurante' })
  @IsEnum(['C', 'F', 'R']) @IsOptional()
  tipo_giro?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCategoriaDto {
  @ApiProperty({ required: false, description: 'Descripción de la categoría' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'ID del departamento' })
  @IsNumber() @IsOptional()
  deptoId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ enum: ['C', 'F', 'R'], required: false, description: 'C=Comercio, F=Farmacias, R=Restaurante' })
  @IsEnum(['C', 'F', 'R']) @IsOptional()
  tipo_giro?: string;
}
