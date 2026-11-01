import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeptoEmpresaDto {
  @ApiProperty({ description: 'Descripción del departamento' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'ID del empleado jefe del departamento' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'ID de la cuenta contable asociada' })
  @IsNumber() @IsOptional()
  cuentacontableId?: number;
}

export class UpdateDeptoEmpresaDto {
  @ApiProperty({ required: false, description: 'Descripción del departamento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'ID del empleado jefe del departamento' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'ID de la cuenta contable asociada' })
  @IsNumber() @IsOptional()
  cuentacontableId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
