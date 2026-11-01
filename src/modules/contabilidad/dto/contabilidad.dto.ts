import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ArrayNotEmpty, ValidateNested, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/** Decimal de MySQL llega como string ("1.00") — se coacciona a number antes de validar */
const aNumero = ({ value }: { value: unknown }) =>
  value === '' || value == null ? undefined : Number(value);

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
  @Transform(aNumero)
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ type: [LineaPartidaDto], description: 'Líneas de la partida (débitos y créditos)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaPartidaDto)
  lineas: LineaPartidaDto[];
}

/**
 * Carga de la partida inicial de operaciones (balance inicial).
 *
 * El período NO viaja en el DTO: se lee en el servicio desde `coperiodoctable`
 * (período abierto de la empresa) para garantizar que la partida caiga siempre
 * en el período vigente.
 */
export class CrearPartidaInicialDto {
  @ApiProperty({ required: false, description: 'ID de la empresa' })
  @IsNumber() @IsOptional()
  empresaId?: number;

  @ApiProperty({ required: false, description: 'ID de sucursal (default: 1)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, description: 'Auxiliar / módulo de origen (default 7 = CONTABILIDAD)' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'Concepto de la partida (default: balances inicial de operaciones mercantiles)' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Referencia (default: INICIAL-{periodo}-{año})' })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ type: [LineaPartidaDto], description: 'Líneas leídas del archivo Excel (débitos y créditos)' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineaPartidaDto)
  lineas: LineaPartidaDto[];
}

// ========== DTOs para Cierre Contable ==========

export class CierreContableDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'Período a cerrar (1-12)' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Año a cerrar' })
  @IsNumber()
  anio: number;

  @ApiProperty({ required: false, description: 'Cuenta de utilidad/pérdida del ejercicio' })
  @IsString() @IsOptional()
  ctaUtilidad?: string;

  @ApiProperty({ required: false, description: 'Observación del cierre' })
  @IsString() @IsOptional()
  observacion?: string;
}

// ========== DTOs para Reportes ==========

export class ReporteContableDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'Período' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'Cuenta contable (auxiliar)' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Fecha desde (ISO string)' })
  @IsDateString() @IsOptional()
  fechaDesde?: string;

  @ApiProperty({ required: false, description: 'Fecha hasta (ISO string)' })
  @IsDateString() @IsOptional()
  fechaHasta?: string;
}

// ========== DTO para Estado de Resultado ==========

export class ReporteEstadoResultadoDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'Año (1900-2200)' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'Período de referencia (1-12)' })
  @IsNumber()
  periodo: number;

  @ApiProperty({
    enum: ['P', 'A', 'N'],
    description:
      'Base del reporte (se genera UNA variante por vez): P = Período (mes), ' +
      'A = Acumulado enero–mes, N = Año anterior (mismo mes)',
  })
  @IsEnum(['P', 'A', 'N'])
  tipo: string;
}

// ========== DTO para Reporte de Balances Dinámico ==========

export class ReporteBalanceDinamicoDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ description: 'ID de la plantilla de balance (tcoplantillabalancesmae)' })
  @IsNumber()
  plantillaId: number;

  @ApiProperty({ required: false, description: 'Nivel máximo de detalle a mostrar (1-8). Las líneas de nivel superior se ocultan; sus saldos quedan agregados en el padre.' })
  @IsNumber() @IsOptional()
  nivelDetalle?: number;

  @ApiProperty({ required: false, description: 'Período (1-12)' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Año' })
  @IsNumber() @IsOptional()
  anio?: number;
}

// ========== DTO para Integración ==========

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

// ========== DTO para Reconstrucción de coctamov ==========

export class ReconstruirCoctamovDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal (default 1)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
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

// ========== DTOs para Detalle de Cierre Contable ==========

export class CreateCocierredetDto {
  @ApiProperty({ description: 'ID del maestro de cierre (cocierremae)' })
  @IsNumber()
  cocierremaeId: number;

  @ApiProperty({ description: 'Año contable' })
  @IsNumber()
  anio: number;

  @ApiProperty({ description: 'Período contable (1-12)' })
  @IsNumber()
  periodo: number;

  @ApiProperty({ description: 'Código de cuenta contable' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ required: false, description: 'Saldo de cierre' })
  @IsNumber() @IsOptional()
  saldo?: number;

  @ApiProperty({ required: false, description: 'Tipo de saldo: D (deudor) / C (acreedor)' })
  @IsEnum(['D', 'C']) @IsOptional()
  tiposaldo?: string;

  @ApiProperty({ required: false, description: 'ID de sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateCocierredetDto {
  @ApiProperty({ required: false, description: 'ID del maestro de cierre' })
  @IsNumber() @IsOptional()
  cocierremaeId?: number;

  @ApiProperty({ required: false, description: 'Año contable' })
  @IsNumber() @IsOptional()
  anio?: number;

  @ApiProperty({ required: false, description: 'Período contable (1-12)' })
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ required: false, description: 'Código de cuenta contable' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'Saldo de cierre' })
  @IsNumber() @IsOptional()
  saldo?: number;

  @ApiProperty({ required: false, description: 'Tipo de saldo: D (deudor) / C (acreedor)' })
  @IsEnum(['D', 'C']) @IsOptional()
  tiposaldo?: string;

  @ApiProperty({ required: false, description: 'ID de sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
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

// ========== DTOs para ISR (Retención en la Fuente) ==========

export class CreateTcoisrDto {
  @ApiProperty({ required: false, description: 'Descripción del rango' })
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

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'S' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateTcoisrDto {
  @ApiProperty({ required: false, description: 'Descripción del rango' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Rango desde' })
  @IsNumber() @IsOptional()
  del?: number;

  @ApiProperty({ required: false, description: 'Rango hasta' })
  @IsNumber() @IsOptional()
  al?: number;

  @ApiProperty({ required: false, description: 'Importe' })
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

  @ApiProperty({ description: 'ID de plantilla contable' })
  @IsNumber()
  plantillapdamaeId: number;

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
  plantillapdamaeId?: number;

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

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Siempre se fuerza a S' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
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

  @ApiProperty({ enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  naturaleza?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Siempre se fuerza a S' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
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

export class CreateCoctacontablesDto {
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

  @ApiProperty({ required: false, description: 'Orden de visualización' })
  @IsNumber() @IsOptional()
  zorden?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Estado activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class UpdateCoctacontablesDto {
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

  @ApiProperty({ required: false, description: 'Orden de visualización' })
  @IsNumber() @IsOptional()
  zorden?: number;

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
  @Transform(aNumero)
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Número de referencia' })
  @IsString() @IsNotEmpty()
  nroreferencia: string;

  @ApiProperty({ description: 'Descripción del comprobante' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Numero de partida (lo asigna el backend desde ttipoparametros)' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está cerrada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_cerrada?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'Partida origen de la contra partida (solo en la contra)' })
  @IsNumber() @IsOptional()
  partidaOrigenId?: number;

  @ApiProperty({ required: false, description: 'Partida contra generada sobre esta partida (solo en la original)' })
  @IsNumber() @IsOptional()
  contrapdaId?: number;

  @ApiProperty({ required: false, description: 'Fecha en que se generó la contra partida (solo en la original)' })
  @IsOptional()
  feccontrapda?: Date;
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
  @Transform(aNumero)
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Número de referencia' })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ required: false, description: 'Descripción del comprobante' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: "Anulada: 'S' = anulada, 'N' = vigente", default: 'N' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está cerrada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_cerrada?: string;

  @ApiProperty({ required: false, description: 'Número de partida' })
  @IsNumber() @IsOptional()
  nropartida?: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, description: 'Partida origen de la contra partida (solo en la contra)' })
  @IsNumber() @IsOptional()
  partidaOrigenId?: number;

  @ApiProperty({ required: false, description: 'Partida contra generada sobre esta partida (solo en la original)' })
  @IsNumber() @IsOptional()
  contrapdaId?: number;

  @ApiProperty({ required: false, description: 'Fecha en que se generó la contra partida (solo en la original)' })
  @IsOptional()
  feccontrapda?: Date;
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
  @Transform(aNumero)
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'ID de la sucursal' })
  @IsNumber()
  Idsucursal: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está cerrada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_cerrada?: string;

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
  @Transform(aNumero)
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: "Anulada: 'S' = anulada, 'N' = vigente", default: 'N' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N', description: 'Indica si está cerrada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_cerrada?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

// ========== DTOs para Carteras Contables ==========

export class CreateTcocarterasDto {
  @ApiProperty({ required: false, description: 'ID del módulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ description: 'Descripción de la cartera' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Cuenta contable (código)' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, default: 'N' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

// ========== DTO para cálculo de saldos (equivalente backend del SP) ==========
export class CalcularSaldosCtaDto {
  @ApiProperty({ description: 'Año contable a recalcular', example: 2026 })
  @Transform(aNumero)
  @IsNumber()
  anio: number;

  @ApiProperty({
    description: 'Período (mes) 1-12. Si se omite se recalculan los 12 meses',
    required: false,
    example: 9,
  })
  @Transform(aNumero)
  @IsNumber() @IsOptional()
  periodo?: number;

  @ApiProperty({ description: 'ID de la empresa', example: 2 })
  @Transform(aNumero)
  @IsNumber()
  empresaId: number;
}

export class UpdateTcocarterasDto {
  @ApiProperty({ required: false, description: 'ID del mA3dulo' })
  @IsNumber() @IsOptional()
  moduloId?: number;

  @ApiProperty({ required: false, description: 'Descripción de la cartera' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Cuenta contable (código)' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
