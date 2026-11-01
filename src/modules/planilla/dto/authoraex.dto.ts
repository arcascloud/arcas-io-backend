import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsInt,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return undefined;
  return Number(value);
};

/** Una línea del detalle: sólo los campos editables del empleado autorizado. */
export class AuthoraExLineaDto {
  @ApiProperty({ description: 'Empleado autorizado a cobrar horas extras' })
  @Transform(toNumber)
  @IsNumber()
  @IsNotEmpty()
  empleadoId: number;

  @ApiProperty({ required: false, description: 'Departamento del empleado' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'S=paga, N=excluido' })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_pagar?: string;
}

/* ── CABECERA ─────────────────────────────────────────────────────────── */

export class CreateAuthoraExMaeDto {
  @ApiProperty({ required: false, description: 'Ejercicio. Si se omite toma la fecha de sistema' })
  @Transform(toNumber)
  @IsInt()
  @IsOptional()
  anio_ejercicio?: number;

  @ApiProperty({ required: false, description: 'Período (1-12). Si se omite toma la fecha de sistema' })
  @Transform(toNumber)
  @IsInt()
  @IsOptional()
  periodo?: number;

  @ApiProperty({ description: 'Departamento que solicita las horas extras' })
  @Transform(toNumber)
  @IsNumber()
  @IsNotEmpty()
  deptoId: number;

  @ApiProperty({ description: 'Empleado Jefe que SOLICITA las horas extras' })
  @Transform(toNumber)
  @IsNumber()
  @IsNotEmpty()
  solicitado_por: number;

  @ApiProperty({ description: 'Empleado Gerente que APRUEBA las horas extras' })
  @Transform(toNumber)
  @IsNumber()
  @IsNotEmpty()
  autorizado_por: number;

  @ApiProperty({ required: false, description: 'Inicio del rango de fechas autorizadas' })
  @IsOptional()
  fecha_desde?: Date | string;

  @ApiProperty({ required: false, description: 'Fin del rango de fechas autorizadas' })
  @IsOptional()
  fecha_hasta?: Date | string;

  @ApiProperty({ required: false, description: 'Motivo / justificación' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  razon_justificacion?: string;

  @ApiProperty({
    required: false,
    type: [AuthoraExLineaDto],
    description: 'Detalle de empleados autorizados (se crea junto con la cabecera)',
  })
  @IsOptional()
  detalles?: AuthoraExLineaDto[];

  @ApiProperty({ description: 'ID de la empresa' })
  @Transform(toNumber)
  @IsNumber()
  empresaId: number;
}

export class UpdateAuthoraExMaeDto {
  @ApiProperty({ required: false, description: 'Ejercicio (año)' })
  @Transform(toNumber)
  @IsInt()
  @IsOptional()
  anio_ejercicio?: number;

  @ApiProperty({ required: false, description: 'Período (1-12)' })
  @Transform(toNumber)
  @IsInt()
  @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Departamento que solicita las horas extras' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  deptoId?: number;

  @ApiProperty({ required: false, description: 'Empleado Jefe que SOLICITA' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  solicitado_por?: number;

  @ApiProperty({ required: false, description: 'Empleado Gerente que APRUEBA' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  autorizado_por?: number;

  @ApiProperty({ required: false, description: 'Inicio del rango' })
  @IsOptional()
  fecha_desde?: Date | string;

  @ApiProperty({ required: false, description: 'Fin del rango' })
  @IsOptional()
  fecha_hasta?: Date | string;

  @ApiProperty({ required: false, description: 'Motivo / justificación' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  razon_justificacion?: string;
}

/* ── DETALLE ──────────────────────────────────────────────────────────── */

export class CreateAuthoraExDetDto {
  @ApiProperty({ description: 'Autorización (cabecera) a la que pertenece' })
  @Transform(toNumber)
  @IsNumber()
  @IsNotEmpty()
  pleauthoraexmaeid: number;

  @ApiProperty({ description: 'Empleado autorizado a cobrar horas extras' })
  @Transform(toNumber)
  @IsNumber()
  @IsNotEmpty()
  empleadoId: number;

  @ApiProperty({ required: false, description: 'Departamento del empleado' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'S=paga, N=excluido' })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_pagar?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @Transform(toNumber)
  @IsNumber()
  empresaId: number;
}

export class UpdateAuthoraExDetDto {
  @ApiProperty({ required: false, description: 'Empleado autorizado' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  empleadoId?: number;

  @ApiProperty({ required: false, description: 'Departamento del empleado' })
  @Transform(toNumber)
  @IsNumber()
  @IsOptional()
  departamentoId?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'S=paga, N=excluido' })
  @IsEnum(['S', 'N'])
  @IsOptional()
  sn_pagar?: string;
}
