import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImpresoraDto {
  @ApiProperty({ required: false, description: 'Nombre/Descripción de la impresora' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['TICKET', 'CARTA'], required: false, description: 'Formato de impresión' })
  @IsEnum(['TICKET', 'CARTA']) @IsOptional()
  formato?: string;

  @ApiProperty({ required: false, description: 'Driver de la impresora' })
  @IsString() @IsOptional()
  driver?: string;

  @ApiProperty({ required: false, description: 'Puerto de conexión' })
  @IsString() @IsOptional()
  puerto?: string;

  @ApiProperty({ enum: ['A', 'M'], required: false, description: 'Modo correlativo: A=Automático, M=Manual' })
  @IsEnum(['A', 'M']) @IsOptional()
  modo_correlativo?: string;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber() @IsNotEmpty()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdateImpresoraDto {
  @ApiProperty({ required: false, description: 'Nombre/Descripción de la impresora' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['TICKET', 'CARTA'], required: false, description: 'Formato de impresión' })
  @IsEnum(['TICKET', 'CARTA']) @IsOptional()
  formato?: string;

  @ApiProperty({ required: false, description: 'Driver de la impresora' })
  @IsString() @IsOptional()
  driver?: string;

  @ApiProperty({ required: false, description: 'Puerto de conexión' })
  @IsString() @IsOptional()
  puerto?: string;

  @ApiProperty({ enum: ['A', 'M'], required: false, description: 'Modo correlativo: A=Automático, M=Manual' })
  @IsEnum(['A', 'M']) @IsOptional()
  modo_correlativo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
