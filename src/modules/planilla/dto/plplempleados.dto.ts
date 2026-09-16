import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlEmpleadosDto {
  @ApiProperty({ required: false, description: 'Número de empleado (auto-generado si se omite)' })
  @IsString() @IsOptional()
  nroempleado?: string;

  @ApiProperty({ description: 'Nombres del empleado' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos del empleado' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ description: 'Documento de identidad' })
  @IsString() @IsNotEmpty()
  dni: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento' })
  @IsString() @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'T'], description: 'Sexo' })
  @IsEnum(['M', 'F', 'T']) @IsOptional()
  sexo?: string;

  @ApiProperty({ required: false, enum: ['S', 'C', 'V', 'D', 'U'], description: 'Estado civil' })
  @IsEnum(['S', 'C', 'V', 'D', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'ID del país de origen' })
  @IsNumber() @IsOptional()
  paisorigen?: number;

  @ApiProperty({ required: false, description: 'ID del país de residencia' })
  @IsNumber() @IsOptional()
  paisresidencia?: number;

  @ApiProperty({ required: false, description: 'Número de seguro' })
  @IsString() @IsOptional()
  nroseguro?: string;

  @ApiProperty({ description: 'Teléfono' })
  @IsString() @IsNotEmpty()
  telefono: string;

  @ApiProperty({ description: 'Celular' })
  @IsString() @IsNotEmpty()
  celular: string;

  @ApiProperty({ description: 'Correo electrónico' })
  @IsString() @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false, description: 'ID de profesión' })
  @IsNumber() @IsOptional()
  profesionId?: number;

  @ApiProperty({ required: false, description: 'ID de puesto' })
  @IsNumber() @IsOptional()
  puestoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Techo del seguro' })
  @IsNumber() @IsOptional()
  techoseguro?: number;

  @ApiProperty({ required: false, description: 'Cuenta bancaria' })
  @IsString() @IsOptional()
  cuentabancaria?: string;

  @ApiProperty({ required: false, description: 'Lugar de nacimiento' })
  @IsString() @IsOptional()
  lugardenacimiento?: string;

  @ApiProperty({ description: 'ID de tipo de empleado' })
  @IsNumber()
  tipoempId: number;

  @ApiProperty({ description: 'ID de sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlEmpleadosDto {
  @ApiProperty({ required: false, description: 'Nombres del empleado' })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ required: false, description: 'Apellidos del empleado' })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ required: false, description: 'Documento de identidad' })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento' })
  @IsString() @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ required: false, enum: ['M', 'F', 'T'], description: 'Sexo' })
  @IsEnum(['M', 'F', 'T']) @IsOptional()
  sexo?: string;

  @ApiProperty({ required: false, enum: ['S', 'C', 'V', 'D', 'U'], description: 'Estado civil' })
  @IsEnum(['S', 'C', 'V', 'D', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ required: false, description: 'ID del país de origen' })
  @IsNumber() @IsOptional()
  paisorigen?: number;

  @ApiProperty({ required: false, description: 'ID del país de residencia' })
  @IsNumber() @IsOptional()
  paisresidencia?: number;

  @ApiProperty({ required: false, description: 'Número de seguro' })
  @IsString() @IsOptional()
  nroseguro?: string;

  @ApiProperty({ required: false, description: 'Teléfono' })
  @IsString() @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false, description: 'Celular' })
  @IsString() @IsOptional()
  celular?: string;

  @ApiProperty({ required: false, description: 'Correo electrónico' })
  @IsString() @IsOptional()
  email?: string;

  @ApiProperty({ required: false, description: 'ID de profesión' })
  @IsNumber() @IsOptional()
  profesionId?: number;

  @ApiProperty({ required: false, description: 'ID de puesto' })
  @IsNumber() @IsOptional()
  puestoId?: number;

  @ApiProperty({ required: false, description: 'Sueldo bruto' })
  @IsNumber() @IsOptional()
  sueldobruto?: number;

  @ApiProperty({ required: false, description: 'Techo del seguro' })
  @IsNumber() @IsOptional()
  techoseguro?: number;

  @ApiProperty({ required: false, description: 'Cuenta bancaria' })
  @IsString() @IsOptional()
  cuentabancaria?: string;

  @ApiProperty({ required: false, description: 'Lugar de nacimiento' })
  @IsString() @IsOptional()
  lugardenacimiento?: string;

  @ApiProperty({ required: false, description: 'ID de tipo de empleado' })
  @IsNumber() @IsOptional()
  tipoempId?: number;

  @ApiProperty({ required: false, description: 'ID de sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
