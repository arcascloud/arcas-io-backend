import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTplIngresosDto {
  @ApiProperty({ description: 'Descripción del tipo de ingreso' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, description: 'Porcentaje' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateTplIngresosDto {
  @ApiProperty({ required: false, description: 'Descripción del tipo de ingreso' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es porcentual' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_porcentual?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Es obligatoria' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_obligatoria?: string;

  @ApiProperty({ required: false, description: 'Porcentaje' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
