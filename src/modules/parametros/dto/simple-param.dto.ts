import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimpleParamDto {
  @ApiProperty({ description: 'Descripción del parámetro' })
  @IsString() @IsNotEmpty()
  descripcion: string;
}

export class UpdateSimpleParamDto {
  @ApiProperty({ required: false, description: 'Descripción del parámetro' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
