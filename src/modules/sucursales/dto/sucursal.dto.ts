import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty({ description: 'Nombre de la sucursal' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateSucursalDto {
  @ApiProperty({ required: false, description: 'Nombre de la sucursal' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
