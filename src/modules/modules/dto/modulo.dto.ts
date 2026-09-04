import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuloDto {
  @ApiProperty({ description: 'Nombre del módulo' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateModuloDto {
  @ApiProperty({ required: false, description: 'Nombre del módulo' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
