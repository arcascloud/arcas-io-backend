import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Nombre' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Contraseña' })
  @IsString() @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'ID de Sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioDto {
  @ApiProperty({ description: 'Nombre', required: false })
  @IsString() @IsOptional()
  nombre?: string;

  @ApiProperty({ description: 'Contraseña', required: false })
  @IsString() @IsOptional()
  password?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsEmail() @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
