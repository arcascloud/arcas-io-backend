import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImpuestoDto {
  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'Descripción del impuesto' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Porcentaje del impuesto' })
  @IsNumber()
  porcentaje: number;
}

export class UpdateImpuestoDto {
  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'Descripción del impuesto' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Porcentaje del impuesto' })
  @IsNumber() @IsOptional()
  porcentaje?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
