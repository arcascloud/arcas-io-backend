import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTcoctacontablesDto {
  @ApiProperty({ description: 'Código de la cuenta contable' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ description: 'Descripción de la cuenta contable' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ enum: ['D', 'C'], required: false, description: 'Naturaleza de la cuenta (Débito/Crédito)' })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ description: 'Nivel de la cuenta en la jerarquía' })
  @IsNumber()
  nivel: number;

  @ApiProperty({ required: false, description: 'Código de la cuenta padre' })
  @IsString() @IsOptional()
  padre?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si la cuenta es operable' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_operable?: string;

  @ApiProperty({ description: 'ID del grupo contable' })
  @IsNumber()
  tcogrupocontableId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class UpdateTcoctacontablesDto {
  @ApiProperty({ required: false, description: 'Código de la cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Descripción de la cuenta contable' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['D', 'C'], required: false, description: 'Naturaleza de la cuenta (Débito/Crédito)' })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ required: false, description: 'Nivel de la cuenta en la jerarquía' })
  @IsNumber() @IsOptional()
  nivel?: number;

  @ApiProperty({ required: false, description: 'Código de la cuenta padre' })
  @IsString() @IsOptional()
  padre?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si la cuenta es operable' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_operable?: string;

  @ApiProperty({ required: false, description: 'ID del grupo contable' })
  @IsNumber() @IsOptional()
  tcogrupocontableId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si la cuenta está activa' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCopdamaeDto {
  @ApiProperty({ description: 'Período contable' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año contable' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID del documento' })
  @IsNumber()
  documentoId: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Número de referencia' })
  @IsString() @IsNotEmpty()
  nroreferencia: string;

  @ApiProperty({ description: 'Descripción del comprobante' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Número de partida' })
  @IsNumber()
  nropartida: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCopdamaeDto {
  @ApiProperty({ required: false, description: 'Período contable' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'ID del documento' })
  @IsNumber() @IsOptional()
  documentoId?: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Número de referencia' })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ required: false, description: 'Descripción del comprobante' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si está activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCopdadetDto {
  @ApiProperty({ description: 'ID del comprobante padre' })
  @IsNumber()
  copdamaeId: number;

  @ApiProperty({ required: false, description: 'Período contable' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ required: false, description: 'Número de fila' })
  @IsNumber() @IsOptional()
  nrofila?: number;

  @ApiProperty({ required: false, description: 'Código de cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Descripción del movimiento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Monto de débito' })
  @IsNumber() @IsOptional()
  debito?: number;

  @ApiProperty({ required: false, description: 'Monto de crédito' })
  @IsNumber() @IsOptional()
  credito?: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCopdadetDto {
  @ApiProperty({ required: false, description: 'ID del comprobante padre' })
  @IsNumber() @IsOptional()
  copdamaeId?: number;

  @ApiProperty({ required: false, description: 'Período contable' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'Número de fila' })
  @IsNumber() @IsOptional()
  nrofila?: number;

  @ApiProperty({ required: false, description: 'Código de cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Descripción del movimiento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Monto de débito' })
  @IsNumber() @IsOptional()
  debito?: number;

  @ApiProperty({ required: false, description: 'Monto de crédito' })
  @IsNumber() @IsOptional()
  credito?: number;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Indica si está activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
