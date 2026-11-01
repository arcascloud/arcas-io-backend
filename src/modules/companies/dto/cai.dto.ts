import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCaiDto {
  @ApiProperty({ description: 'Código CAI' })
  @IsString()
  @IsNotEmpty()
  cai: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], default: 'S' })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la empresa' })
  @IsNumber()
  @IsOptional()
  empresaId?: number;
}

export class UpdateCaiDto {
  @ApiProperty({ required: false, description: 'Código CAI' })
  @IsString()
  @IsOptional()
  cai?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_activo?: string;
}
