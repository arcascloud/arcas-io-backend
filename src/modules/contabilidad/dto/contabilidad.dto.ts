import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// ========== DTOs para Contabilización ==========

export class LineaPartidaDto {
  @ApiProperty({ description: 'Código de cuenta contable' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ required: false, description: 'Descripción del movimiento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Monto de débito' })
  @IsNumber()
  debito: number;

  @ApiProperty({ description: 'Monto de crédito' })
  @IsNumber()
  credito: number;
}

export class ContabilizarPartidaDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ description: 'Período contable (1-12)' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año contable' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'ID del módulo origen' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID del documento origen' })
  @IsNumber()
  documentoId: number;

  @ApiProperty({ required: false, description: 'Fecha del documento' })
  @IsDateString() @IsOptional()
  fechadocumento?: string;

  @ApiProperty({ description: 'Número de referencia' })
  @IsString() @IsNotEmpty()
  nroreferencia: string;

  @ApiProperty({ description: 'Descripción de la partida' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ type: [LineaPartidaDto], description: 'Líneas de la partida (débitos y créditos)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaPartidaDto)
  lineas: LineaPartidaDto[];
}

// ========== DTOs para Cierre Contable ==========

export class CierreContableDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'Período a cerrar (1-12)' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año a cerrar' })
  @IsNumber()
  anio: number;

  @ApiProperty({ required: false, description: 'Observación del cierre' })
  @IsString() @IsOptional()
  observacion?: string;
}

// ========== DTOs para Reportes ==========

export class ReporteContableDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'Período' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año' })
  @IsNumber()
  anio: number;

  @ApiProperty({ required: false, description: 'Fecha desde (ISO string)' })
  @IsDateString() @IsOptional()
  fechaDesde?: string;

  @ApiProperty({ required: false, description: 'Fecha hasta (ISO string)' })
  @IsDateString() @IsOptional()
  fechaHasta?: string;
}

// ========== DTOs para Integración ==========

export class IntegracionModuloDto {
  @ApiProperty({ description: 'ID del documento origen del módulo' })
  @IsNumber()
  documentoId: number;

  @ApiProperty({ required: false, description: 'ID de la empresa' })
  @IsNumber() @IsOptional()
  empresaId?: number;

  @ApiProperty({ required: false, description: 'ID de la factura en posfacmae (para vincular en posfacmov)' })
  @IsNumber() @IsOptional()
  facturaId?: number;
}

// ========== DTOs para Grupos Contables ==========

export class CreateGrupocontableDto {
  @ApiProperty({ description: 'Descripción del grupo contable' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateGrupocontableDto {
  @ApiProperty({ required: false, description: 'Descripción del grupo contable' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Nivel Cta ==========

export class CreateNivelctaDto {
  @ApiProperty({ enum: ['1','2','3','4','5','6','7','8'], description: 'Nivel' })
  @IsEnum(['1','2','3','4','5','6','7','8'])
  nivel: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Diario' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_diario?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateNivelctaDto {
  @ApiProperty({ enum: ['1','2','3','4','5','6','7','8'], required: false })
  @IsEnum(['1','2','3','4','5','6','7','8']) @IsOptional()
  nivel?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_diario?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Naturaleza Cta ==========

export class CreateNaturalezactaDto {
  @ApiProperty({ enum: ['D', 'C'], description: 'Naturaleza' })
  @IsEnum(['D', 'C'])
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateNaturalezactaDto {
  @ApiProperty({ enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Periodo Contable ==========

export class CreatePeriodoctableDto {
  @ApiProperty({ description: 'Año' })
  @IsNumber()
  nroanio: number;

  @ApiProperty({ description: 'Mes (1-12)' })
  @IsNumber()
  nromes: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'S' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_abierto?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePeriodoctableDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  nroanio?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  nromes?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_abierto?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Cierre Contable (Catálogo) ==========

export class CreateCierrectableDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ description: 'Fecha de cierre' })
  @IsDateString()
  fechacierre: string;

  @ApiProperty({ required: false, description: 'Observación' })
  @IsString() @IsOptional()
  observacion?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCierrectableDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false })
  @IsDateString() @IsOptional()
  fechacierre?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  observacion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Saldos Cta ==========

export class CreateSaldosctaDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ description: 'Código de cuenta contable' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  saldoanterior?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  enero?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  febrero?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  marzo?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  abril?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  mayo?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  junio?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  julio?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  agosto?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  septiembre?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  octubre?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  noviembre?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber() @IsOptional()
  diciembre?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateSaldosctaDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  saldoanterior?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  enero?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  febrero?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  marzo?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  abril?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  mayo?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  junio?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  julio?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  agosto?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  septiembre?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  octubre?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  noviembre?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  diciembre?: number;
}

// ========== DTOs para Impuesto Vecinal ==========

export class CreateImpuestovecinalDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Rango desde' })
  @IsNumber()
  del: number;

  @ApiProperty({ description: 'Rango hasta' })
  @IsNumber()
  al: number;

  @ApiProperty({ description: 'Importe' })
  @IsNumber()
  importe: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateImpuestovecinalDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  del?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  al?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Tipos Doc Fiscal ==========

export class CreateTipoDocFiscalDto {
  @ApiProperty({ description: 'Descripción' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Abreviatura' })
  @IsString() @IsNotEmpty()
  abreviatura: string;

  @ApiProperty({ enum: ['D', 'C'], description: 'Naturaleza' })
  @IsEnum(['D', 'C'])
  naturaleza: string;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID cuenta contable' })
  @IsNumber()
  cuentacontableId: number;

  @ApiProperty({ description: 'Nro correlativo' })
  @IsNumber()
  nrocorrelativo: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateTipoDocFiscalDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  abreviatura?: string;

  @ApiProperty({ enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  cuentacontableId?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  nrocorrelativo?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Factor de Cambio ==========

export class CreateFactordecambioDto {
  @ApiProperty({ description: 'Precio de compra' })
  @IsNumber()
  preciocompra: number;

  @ApiProperty({ description: 'Precio de venta' })
  @IsNumber()
  precioventa: number;

  @ApiProperty({ enum: ['D', 'E', 'Y'], description: 'Tipo de moneda' })
  @IsEnum(['D', 'E', 'Y'])
  tipomoneda: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateFactordecambioDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  preciocompra?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  precioventa?: number;

  @ApiProperty({ enum: ['D', 'E', 'Y'], required: false })
  @IsEnum(['D', 'E', 'Y']) @IsOptional()
  tipomoneda?: string;
}

// ========== DTOs para Plantilla PDA ==========

export class CreatePlantillaPdaMaeDto {
  @ApiProperty({ description: 'Descripción' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID del módulo' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlantillaPdaMaeDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class CreatePlantillaPdaDetDto {
  @ApiProperty({ description: 'ID plantilla padre' })
  @IsNumber()
  tcoplantillapdamaeId: number;

  @ApiProperty({ description: 'Número de fila' })
  @IsNumber()
  nrofila: number;

  @ApiProperty({ description: 'Código cuenta contable' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  ctamayorId?: string;

  @ApiProperty({ enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlantillaPdaDetDto {
  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  nrofila?: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  ctamayorId?: string;

  @ApiProperty({ enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

// ========== DTOs para Plantilla Balances ==========

export class CreatePlantillaBalancesMaeDto {
  @ApiProperty({ description: 'Descripción' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlantillaBalancesMaeDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

export class CreatePlantillaBalancesDetDto {
  @ApiProperty({ description: 'ID plantilla padre' })
  @IsNumber()
  cocdefbalmaId: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  tipo?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  columna?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  renglon?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdatePlantillaBalancesDetDto {
  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  tipo?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  columna?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  renglon?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}

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
  partidaId: number;

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
  partidaId?: number;

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
