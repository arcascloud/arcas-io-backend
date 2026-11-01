import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Convierte string numérico ("2.50") o null a number; undefined/null pasan sin transformar */
const toNumber = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return undefined;
  return Number(value);
};

export class CreateTplTipoMovDto {
  @ApiProperty({ description: 'Descripción del tipo de movimiento' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Abreviatura' })
  @IsString() @IsNotEmpty()
  abreviatura: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Se paga por fecha de alta' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_por_fecalta?: string;

  @ApiProperty({ required: false, description: 'Período de prueba (días)' })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  periodo_prueba?: number;

  @ApiProperty({ required: false, description: 'Importe' })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({
    required: false,
    description: 'Importe a cargo del patrono (aporte patronal)',
  })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  imppatron?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligación patronal' })
  @IsEnum(['S', 'N']) @IsOptional()
  es_obligacion_patronal?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, enum: ['E', 'I'], description: 'Tipo: E=egreso, I=ingreso' })
  @IsEnum(['E', 'I']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateTplTipoMovDto {
  @ApiProperty({ required: false, description: 'Descripción del tipo de movimiento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Abreviatura' })
  @IsString() @IsOptional()
  abreviatura?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Se paga por fecha de alta' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_por_fecalta?: string;

  @ApiProperty({ required: false, description: 'Período de prueba (días)' })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  periodo_prueba?: number;

  @ApiProperty({ required: false, description: 'Importe' })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({
    required: false,
    description: 'Importe a cargo del patrono (aporte patronal)',
  })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  imppatron?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligación patronal' })
  @IsEnum(['S', 'N']) @IsOptional()
  es_obligacion_patronal?: string;

  @ApiProperty({ required: false, enum: ['E', 'I'], description: 'Tipo: E=egreso, I=ingreso' })
  @IsEnum(['E', 'I']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
