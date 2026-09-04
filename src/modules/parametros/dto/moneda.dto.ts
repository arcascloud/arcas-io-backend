import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMonedaDto {
  @ApiProperty({ description: 'Nombre de la moneda' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Símbolo de la moneda' })
  @IsString() @IsNotEmpty()
  simbolo: string;
}

export class UpdateMonedaDto {
  @ApiProperty({ required: false, description: 'Nombre de la moneda' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Símbolo de la moneda' })
  @IsString() @IsOptional()
  simbolo?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
