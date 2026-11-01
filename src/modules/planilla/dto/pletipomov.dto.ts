import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return undefined;
  return Number(value);
};

export class CreatePlTipoMovDto {
  @ApiProperty({ description: 'ID del empleado' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ description: 'ID del tipo de movimiento' })
  @IsNumber()
  tipomovId: number;

  @ApiProperty({ required: false, enum: ['S', 'H', 'M', 'A', 'Q'], description: 'Aplicación: H=Hora, Q=Quincena, S=Semana, M=Mes, A=Año' })
  @IsEnum(['S', 'H', 'M', 'A', 'Q']) @IsOptional()
  aplicacion?: string;

  @ApiProperty({ required: false, enum: ['P', 'A', 'R'], description: 'P=Porcentual, A=Aportación, R=Retención' })
  @IsEnum(['P', 'A', 'R']) @IsOptional()
  tipoimporte?: string;

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

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlTipoMovDto {
  @ApiProperty({ required: false, description: 'ID del empleado' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'ID del tipo de movimiento' })
  @IsNumber() @IsOptional()
  tipomovId?: number;

  @ApiProperty({ required: false, enum: ['S', 'H', 'M', 'A', 'Q'], description: 'Aplicación: H=Hora, Q=Quincena, S=Semana, M=Mes, A=Año' })
  @IsEnum(['S', 'H', 'M', 'A', 'Q']) @IsOptional()
  aplicacion?: string;

  @ApiProperty({ required: false, enum: ['P', 'A', 'R'], description: 'P=Porcentual, A=Aportación, R=Retención' })
  @IsEnum(['P', 'A', 'R']) @IsOptional()
  tipoimporte?: string;

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

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

/** Entrada del proceso por lotes «Dar derechos laborales» */
export class DarDerechosLaboralesDto {
  @ApiProperty({ description: 'ID del empleado al que se le asignan los derechos' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}
