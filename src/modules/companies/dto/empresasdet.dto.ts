import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDetDto {
  @ApiProperty({ enum: ['TELEFONO', 'DIRECCION', 'CORREO', 'RUC', 'RTN', 'WEBSITE', 'REDESOCIAL'] })
  @IsEnum(['TELEFONO', 'DIRECCION', 'CORREO', 'RUC', 'RTN', 'WEBSITE', 'REDESOCIAL'])
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Valor del dato' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], default: 'S' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  empresaId?: number;
}

export class UpdateEmpresaDetDto extends CreateEmpresaDetDto {}
