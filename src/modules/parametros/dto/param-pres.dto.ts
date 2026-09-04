import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamPresDto {
  @ApiProperty({ required: false, description: 'Tasa de interés' })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ required: false, description: 'Tasa de mora' })
  @IsNumber() @IsOptional()
  mora?: number;

  @ApiProperty({ required: false, description: 'Días de plazo' })
  @IsNumber() @IsOptional()
  diasPlazo?: number;

  @ApiProperty({ required: false, description: 'Límite de crédito' })
  @IsNumber() @IsOptional()
  limitecredito?: number;

  @ApiProperty({ required: false, description: 'Cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;
}

export class UpdateParamPresDto extends CreateParamPresDto {}
