import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de alta de departamento de inventario (tinvdeptos).
 * `zorden` es NOT NULL en BD → se exige en el alta (la entidad lo usa para
 * el orden de presentación en el módulo de productos).
 */
export class CreateDeptoDto {
  @ApiProperty({ description: 'Descripción del departamento' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Orden de presentación' })
  @IsNumber()
  zorden: number;

  @ApiProperty({ enum: ['C', 'F', 'R'], required: false, description: 'Tipo de giro: Comercio / Farmacias / Restaurante' })
  @IsEnum(['C', 'F', 'R']) @IsOptional()
  tipo_giro?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateDeptoDto {
  @ApiProperty({ required: false, description: 'Descripción del departamento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Orden de presentación' })
  @IsNumber() @IsOptional()
  zorden?: number;

  @ApiProperty({ enum: ['C', 'F', 'R'], required: false, description: 'Tipo de giro: Comercio / Farmacias / Restaurante' })
  @IsEnum(['C', 'F', 'R']) @IsOptional()
  tipo_giro?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
