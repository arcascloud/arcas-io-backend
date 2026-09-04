import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuariosScriptsDto {
  @ApiProperty({ description: 'Usuario' })
  @IsString() @IsNotEmpty()
  usuario: string;

  @ApiProperty({ description: 'Script' })
  @IsString() @IsNotEmpty()
  script: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateUsuariosScriptsDto {
  @ApiProperty({ description: 'Script', required: false })
  @IsString() @IsOptional()
  script?: string;
}
