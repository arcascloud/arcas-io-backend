import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioRolDto {
  @ApiProperty({ description: 'ID del usuario (tusuarios.usuarioId)' })
  @IsNumber()
  @IsNotEmpty()
  usuarioId: number;

  @ApiProperty({ description: 'Rol asignado (debe existir en ttipo_rol)' })
  @IsString()
  @IsNotEmpty()
  rol: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuarioRolDto {
  @ApiProperty({ description: 'ID del usuario', required: false })
  @IsNumber()
  @IsOptional()
  usuarioId?: number;

  @ApiProperty({ description: 'Rol asignado (debe existir en ttipo_rol)', required: false })
  @IsString()
  @IsOptional()
  rol?: string;
}
