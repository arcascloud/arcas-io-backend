import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamPlaDto {
  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'Número de planilla' })
  @IsNumber() @IsOptional()
  nroplanilla?: number;

  @ApiProperty({ required: false, description: 'Techo salarial' })
  @IsNumber() @IsOptional()
  techo?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Validar techo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_validatecho?: string;

  @ApiProperty({ required: false, description: 'Días laborales' })
  @IsNumber() @IsOptional()
  diaslaborales?: number;
}

export class UpdateParamPlaDto extends CreateParamPlaDto {}
