import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCxcClienteDto {
  @ApiProperty({ description: 'Número de Cliente', required: false })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ description: 'Fecha de Nacimiento', required: false })
  @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ description: 'Nombres' })
  @IsString() @IsNotEmpty()
  nombres: string;

  @ApiProperty({ description: 'Apellidos' })
  @IsString() @IsNotEmpty()
  apellidos: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'ID de Módulo', required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de Sucursal (lo inyecta el ApiService del usuario logueado)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class UpdateCxcClienteDto {
  @ApiProperty({ description: 'Número de Cliente', required: false })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ description: 'Fecha de Nacimiento', required: false })
  @IsDateString() @IsOptional()
  fechanacimiento?: string;

  @ApiProperty({ description: 'Nombres', required: false })
  @IsString() @IsOptional()
  nombres?: string;

  @ApiProperty({ description: 'Apellidos', required: false })
  @IsString() @IsOptional()
  apellidos?: string;

  @ApiProperty({ description: 'Razón Social', required: false })
  @IsString() @IsOptional()
  razonsocial?: string;

  @ApiProperty({ description: 'DNI', required: false })
  @IsString() @IsOptional()
  dni?: string;

  @ApiProperty({ description: 'Sexo', enum: ['M', 'F'], required: false })
  @IsEnum(['M', 'F']) @IsOptional()
  sexo?: string;

  @ApiProperty({ description: 'Estado Civil', enum: ['S', 'C', 'D', 'V', 'U'], required: false })
  @IsEnum(['S', 'C', 'D', 'V', 'U']) @IsOptional()
  estadocivil?: string;

  @ApiProperty({ description: 'RTN', required: false })
  @IsString() @IsOptional()
  rtn?: string;

  @ApiProperty({ description: 'Límite de Crédito', required: false })
  @IsNumber() @IsOptional()
  limiteCredito?: number;

  @ApiProperty({ description: 'Días de Plazo', required: false })
  @IsNumber() @IsOptional()
  diasplazo?: number;

  @ApiProperty({ description: 'Interés', required: false })
  @IsNumber() @IsOptional()
  interes?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'Categoría', enum: ['A', 'B', 'C', 'D', 'E'], required: false })
  @IsEnum(['A', 'B', 'C', 'D', 'E']) @IsOptional()
  categoria?: string;

  @ApiProperty({ description: 'Activo', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de Sucursal (lo inyecta el ApiService del usuario logueado)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateCxcMovimientoDto {
  @ApiProperty({ description: 'ID de Cliente' })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ description: 'Número de Cliente' })
  @IsString() @IsNotEmpty()
  nrocliente: string;

  @ApiProperty({ description: 'ID de Módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID de Documento' })
  @IsNumber()
  documentoId: number;

  @ApiProperty({ description: 'ID de Sucursal', required: false })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'Tipo de Movimiento', enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ description: 'Número de Referencia', required: false })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ description: 'Factor de Cambio', required: false })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Importe', required: false })
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ description: 'Concepto', required: false })
  @IsString() @IsOptional()
  concepto?: string;

  @ApiProperty({ description: 'ID de Cartera Contable', required: false })
  @IsNumber() @IsOptional()
  carteracontableId?: number;

  @ApiProperty({ description: 'Documento capturado manualmente (S) o generado por el sistema (N)', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_doc_manual?: string;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCxcMovimientoDto {
  @ApiProperty({ description: 'Tipo de Movimiento', enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ description: 'Número de Referencia', required: false })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ description: 'Factor de Cambio', required: false })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Importe', required: false })
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ description: 'Concepto', required: false })
  @IsString() @IsOptional()
  concepto?: string;

  @ApiProperty({ description: 'Contabilizada', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_cotabilizada?: string;

  @ApiProperty({ description: 'Documento Anulado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_doc_anulado?: string;

  @ApiProperty({ description: 'Documento capturado manualmente (S) o generado por el sistema (N)', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_doc_manual?: string;

  @ApiProperty({ description: 'ID de Cartera Contable', required: false })
  @IsNumber() @IsOptional()
  carteracontableId?: number;
}

export class CreateCxcPrestamoDto {
  @ApiProperty({ description: 'Número de Préstamo' })
  @IsString() @IsOptional()
  nroprestamo?: string;

  @ApiProperty({ description: 'ID de Cliente' })
  @IsNumber()
  clienteId: number;

  @ApiProperty({ description: 'Capital', required: false })
  @IsNumber() @IsOptional()
  capital?: number;

  @ApiProperty({ description: 'Prima', required: false })
  @IsNumber() @IsOptional()
  prima?: number;

  @ApiProperty({ description: 'Capital Neto', required: false })
  @IsNumber() @IsOptional()
  capitalneto?: number;

  @ApiProperty({ description: 'Valor de la cuota pactada', required: false })
  @IsNumber() @IsOptional()
  vlrcuota?: number;

  @ApiProperty({ description: 'Tasa', required: false })
  @IsNumber() @IsOptional()
  tasa?: number;

  @ApiProperty({ description: 'Cuotas', required: false })
  @IsNumber() @IsOptional()
  cuotas?: number;

  @ApiProperty({ description: 'Días Cuotas', required: false })
  @IsNumber() @IsOptional()
  diascuotas?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'ID de Gestor', required: false })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ description: 'ID de Moneda', required: false })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ description: 'Gracia', required: false })
  @IsNumber() @IsOptional()
  gracia?: number;

  @ApiProperty({ description: 'Fecha de aprobación del préstamo (default = fecha del sistema)', required: false })
  @IsOptional()
  fecha_aprobacion?: Date | string;

  @ApiProperty({ description: 'Fecha de última cuota pagada', required: false })
  @IsOptional()
  fechaUltPago?: Date | string;

  @ApiProperty({ description: 'Fecha efectiva del préstamo', required: false })
  @IsOptional()
  fechaEfectiva?: Date | string;

  @ApiProperty({ description: 'Saldo de capital pendiente', required: false })
  @IsNumber() @IsOptional()
  saldoactual?: number;

  @ApiProperty({ description: 'Pre-aprobado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_preaprobado?: string;

  @ApiProperty({ description: 'Aprobado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_aprobado?: string;

  @ApiProperty({ description: 'Activo', required: false })
  @IsString() @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Contabilizado', required: false })
  @IsString() @IsOptional()
  sn_contabilizado?: string;

  @ApiProperty({ description: 'ID partida contable (copdamae)', required: false })
  @IsOptional()
  partidaId?: number;

  @ApiProperty({ description: 'Anulado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulado?: string;

  @ApiProperty({ description: 'ID de Módulo', required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ description: 'ID de Empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de Sucursal (lo inyecta el ApiService del usuario logueado)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class UpdateCxcPrestamoDto {
  @ApiProperty({ description: 'Capital', required: false })
  @IsNumber() @IsOptional()
  capital?: number;

  @ApiProperty({ description: 'Prima', required: false })
  @IsNumber() @IsOptional()
  prima?: number;

  @ApiProperty({ description: 'Capital Neto', required: false })
  @IsNumber() @IsOptional()
  capitalneto?: number;

  @ApiProperty({ description: 'Valor de la cuota pactada', required: false })
  @IsNumber() @IsOptional()
  vlrcuota?: number;

  @ApiProperty({ description: 'Tasa', required: false })
  @IsNumber() @IsOptional()
  tasa?: number;

  @ApiProperty({ description: 'Cuotas', required: false })
  @IsNumber() @IsOptional()
  cuotas?: number;

  @ApiProperty({ description: 'Días Cuotas', required: false })
  @IsNumber() @IsOptional()
  diascuotas?: number;

  @ApiProperty({ description: 'Moratorio', required: false })
  @IsNumber() @IsOptional()
  moratorio?: number;

  @ApiProperty({ description: 'ID de Gestor', required: false })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ description: 'ID de Moneda', required: false })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ description: 'Gracia', required: false })
  @IsNumber() @IsOptional()
  gracia?: number;

  @ApiProperty({ description: 'Última Cuota Pagada', required: false })
  @IsNumber() @IsOptional()
  ultcuotapagada?: number;

  @ApiProperty({ description: 'Fecha de aprobación del préstamo', required: false })
  @IsOptional()
  fecha_aprobacion?: Date | string;

  @ApiProperty({ description: 'Fecha de última cuota pagada', required: false })
  @IsOptional()
  fechaUltPago?: Date | string;

  @ApiProperty({ description: 'Fecha efectiva del préstamo', required: false })
  @IsOptional()
  fechaEfectiva?: Date | string;

  @ApiProperty({ description: 'Saldo de capital pendiente', required: false })
  @IsNumber() @IsOptional()
  saldoactual?: number;

  @ApiProperty({ description: 'Pre-aprobado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_preaprobado?: string;

  @ApiProperty({ description: 'Aprobado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_aprobado?: string;

  @ApiProperty({ description: 'Activo', required: false })
  @IsString() @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'Contabilizado', required: false })
  @IsString() @IsOptional()
  sn_contabilizado?: string;

  @ApiProperty({ description: 'ID partida contable (copdamae)', required: false })
  @IsOptional()
  partidaId?: number;

  @ApiProperty({ description: 'Anulado', enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulado?: string;

  @ApiProperty({ required: false, description: 'ID de Sucursal (lo inyecta el ApiService del usuario logueado)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
