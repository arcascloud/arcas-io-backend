import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaLogoDto {
  @ApiProperty({ description: 'Imagen en base64 (data:image/...)' })
  @IsString() @IsNotEmpty()
  img: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdateEmpresaLogoDto {
  @ApiProperty({ required: false, description: 'Imagen en base64 (data:image/...)' })
  @IsString() @IsOptional()
  img?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
