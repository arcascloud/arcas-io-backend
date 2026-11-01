import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsDateString, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Tipos de documento admitidos por `tusuariosinfoinfo.tipodoc`. */
export const TIPOS_DOC_INFO = ['D', 'R', 'C', 'P', 'L'] as const;

export class CreateUsuarioInfoDto {
  @ApiProperty({ description: 'ID del usuario (tusuarios.usuarioId) — PK de la fila' })
  @IsNumber()
  @IsNotEmpty()
  usuarioId: number;

  @ApiProperty({ description: 'Número de documento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nrodocumento: string;

  @ApiProperty({ description: 'Tipo de documento', enum: TIPOS_DOC_INFO, required: false, default: 'D' })
  @IsOptional()
  @IsIn(TIPOS_DOC_INFO as unknown as string[])
  tipodoc?: 'D' | 'R' | 'C' | 'P' | 'L';

  @ApiProperty({ description: 'Fecha de nacimiento (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  fecnac?: string;

  @ApiProperty({ description: '¿Es cliente?', enum: ['S', 'N'], required: false, default: 'S' })
  @IsOptional()
  @IsIn(['S', 'N'])
  sn_cliente?: 'S' | 'N';

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false, default: 'M' })
  @IsOptional()
  @IsIn(['M', 'F'])
  sexo?: 'M' | 'F';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  pais: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  departamento: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  ciudad: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  direccion: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  telefono: string;

  @ApiProperty({ required: false, description: 'ID del empleado (planilla)' })
  @IsOptional()
  @IsNumber()
  empleadoId?: number;

  @ApiProperty({ description: 'ID de empresa (para validar pertenencia del usuario)' })
  @IsNumber()
  @IsNotEmpty()
  empresaId: number;
}

export class UpdateUsuarioInfoDto {
  @ApiProperty({ description: 'Número de documento', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nrodocumento?: string;

  @ApiProperty({ description: 'Tipo de documento', enum: TIPOS_DOC_INFO, required: false })
  @IsOptional()
  @IsIn(TIPOS_DOC_INFO as unknown as string[])
  tipodoc?: 'D' | 'R' | 'C' | 'P' | 'L';

  @ApiProperty({ description: 'Fecha de nacimiento (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  fecnac?: string;

  @ApiProperty({ description: '¿Es cliente?', enum: ['S', 'N'], required: false })
  @IsOptional()
  @IsIn(['S', 'N'])
  sn_cliente?: 'S' | 'N';

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsOptional()
  @IsIn(['M', 'F'])
  sexo?: 'M' | 'F';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  pais?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  departamento?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  ciudad?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  direccion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  telefono?: string;

  @ApiProperty({ required: false, description: 'ID del empleado (planilla)' })
  @IsOptional()
  @IsNumber()
  empleadoId?: number;
}
