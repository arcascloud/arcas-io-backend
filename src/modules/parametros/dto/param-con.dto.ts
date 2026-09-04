import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamConDto {
  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'Período fiscal' })
  @IsNumber() @IsOptional()
  periodofiscal?: number;

  @ApiProperty({ required: false, description: 'Año fiscal' })
  @IsNumber() @IsOptional()
  aniofiscal?: number;

  @ApiProperty({ required: false, description: 'ID de moneda fiscal' })
  @IsNumber() @IsOptional()
  monedafiscalId?: number;

  @ApiProperty({ required: false, description: 'Máscara de cuenta contable' })
  @IsString() @IsOptional()
  mascaracta?: string;

  @ApiProperty({ required: false, description: 'Nombre del contador' })
  @IsString() @IsOptional()
  nombrecontador?: string;

  @ApiProperty({ required: false, description: 'Nombre del gerente' })
  @IsString() @IsOptional()
  nombregerente?: string;

  @ApiProperty({ required: false, description: 'Nombre del auditor' })
  @IsString() @IsOptional()
  nombreauditor?: string;
}

export class UpdateParamConDto extends CreateParamConDto {}
