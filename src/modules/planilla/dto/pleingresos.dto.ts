import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return undefined;
  return Number(value);
};

export class CreatePlIngresosDto {
  @ApiProperty({ description: 'Empleado que cobra el ingreso' })
  @IsNumber()
  empleadoId: number;

  @ApiProperty({ description: 'Jefe que autorizó el pago' })
  @IsNumber()
  jefeId: number;

  @ApiProperty({ description: 'Departamento que autoriza el ingreso' })
  @IsNumber()
  deptoId: number;

  @ApiProperty({ description: 'Importe autorizado' })
  @Transform(toNumber)
  @IsNumber()
  importe: number;

  @ApiProperty({ enum: ['COMISION', 'BONO'], description: 'Concepto del ingreso' })
  @IsEnum(['COMISION', 'BONO'])
  @IsNotEmpty()
  concepto: string;

  @ApiProperty({
    required: false,
    description: 'Ejercicio (año). Si se omite se toma de la fecha de sistema',
  })
  @Transform(toNumber)
  @IsInt()
  @IsOptional()
  anio_ejercicio?: number;

  @ApiProperty({
    required: false,
    description: 'Período (mes 1-12). Si se omite se toma de la fecha de sistema',
  })
  @Transform(toNumber)
  @IsInt()
  @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Fecha y hora del registro' })
  @IsOptional()
  fecha_registro?: Date | string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlIngresosDto {
  @ApiProperty({ required: false, description: 'Empleado que cobra el ingreso' })
  @IsNumber() @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'Jefe que autorizó el pago' })
  @IsNumber() @IsOptional()
  jefeId?: number;

  @ApiProperty({ required: false, description: 'Departamento que autoriza el ingreso' })
  @IsNumber() @IsOptional()
  deptoId?: number;

  @ApiProperty({ required: false, description: 'Importe autorizado' })
  @Transform(toNumber)
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ required: false, enum: ['COMISION', 'BONO'], description: 'Concepto del ingreso' })
  @IsEnum(['COMISION', 'BONO']) @IsOptional()
  concepto?: string;

  @ApiProperty({ required: false, description: 'Ejercicio (año)' })
  @Transform(toNumber)
  @IsInt() @IsOptional()
  anio_ejercicio?: number;

  @ApiProperty({ required: false, description: 'Período (mes 1-12)' })
  @Transform(toNumber)
  @IsInt() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Fecha y hora del registro' })
  @IsOptional()
  fecha_registro?: Date | string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
