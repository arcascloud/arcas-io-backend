import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsIn,
  IsDateString,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Tipo de documento: D=DNI, R=RTN, L=Licencia, C=Carnet Residente, P=Pasaporte. */
export type TipoDocRegistro = 'D' | 'R' | 'C' | 'P' | 'L';

/**
 * Registro público de usuario (sin sesión).
 * Límites según estructura real:
 * - `tusuarios`: usuario varchar(20) PK, nombre/apellidos varchar(80),
 *   email varchar(30), password varchar(250).
 * - `tusuariosinfoinfo`: nrodocumento varchar(30), tipodoc enum,
 *   sexo enum, fecnac datetime, pais/departamento/ciudad varchar(80),
 *   direccion varchar(2000), telefono varchar(80). UNIQUE (tipodoc, nrodocumento).
 */
export class RegisterDto {
  @ApiProperty({ description: 'Usuario (máx. 20 caracteres, sin espacios)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  usuario: string;

  @ApiProperty({ description: 'Nombres' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre: string;

  @ApiProperty({ description: 'Apellidos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  apellidos: string;

  @ApiProperty({ description: 'Correo electrónico (máx. 30 caracteres)' })
  @IsEmail()
  @MaxLength(30)
  email: string;

  @ApiProperty({
    description:
      'Contraseña: mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 carácter especial (.,!@#$%^&*()=+~/?;:ñÑ)',
    minLength: 8,
    maxLength: 250,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @Matches(/[A-ZÁÉÍÓÚÜÑ]/, {
    message: 'La contraseña debe contener al menos 1 mayúscula',
  })
  @Matches(/[0-9]/, { message: 'La contraseña debe contener al menos 1 número' })
  @Matches(/[.,!@#$%^&*()=+~\/?;:ñÑ]/, {
    message: 'La contraseña debe contener al menos 1 carácter especial (.,!@#$%^&*()=+~/?;:ñÑ)',
  })
  @MaxLength(250)
  password: string;

  @ApiProperty({
    description: 'Tipo de documento: D=DNI, R=RTN, L=Licencia, C=Carnet Residente, P=Pasaporte',
    enum: ['D', 'R', 'C', 'P', 'L'],
  })
  @IsIn(['D', 'R', 'C', 'P', 'L'])
  tipodoc: TipoDocRegistro;

  @ApiProperty({ description: 'Número de documento (DNI/RTN/pasaporte/etc.)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nrodocumento: string;

  @ApiProperty({ description: 'Celular/teléfono' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  telefono: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'] })
  @IsIn(['M', 'F'])
  sexo: 'M' | 'F';

  @ApiProperty({
    description: 'Fecha de nacimiento (YYYY-MM-DD). Año entre 1931 y el año actual.',
    example: '1990-05-15',
  })
  @IsDateString()
  fechanacimiento: string;

  @ApiProperty({ description: 'Dirección completa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  direccion: string;

  @ApiProperty({ description: 'País (nombre)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  pais: string;

  @ApiProperty({ description: 'Departamento/estado/provincia (nombre)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  departamento: string;

  @ApiProperty({ description: 'Ciudad (nombre)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  ciudad: string;

  @ApiProperty({
    required: false,
    description:
      'ID del empleado (plempleados) vinculado, si el documento coincide con su nrodocumento',
  })
  @IsOptional()
  @IsNumber()
  empleadoId?: number;
}
