import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBancoDto {
  @ApiProperty({ description: 'Nombre del banco' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBancoDto {
  @ApiProperty({ required: false, description: 'Nombre del banco' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

export class CreateBcoCtaDto {
  @ApiProperty({ description: 'ID del banco' })
  @IsNumber()
  bancoId: number;

  @ApiProperty({ description: 'Número de cuenta bancaria' })
  @IsString() @IsNotEmpty()
  nrocuenta: string;

  @ApiProperty({ description: 'Cuenta contable asociada (coctacontables.ctacontable)' })
  @IsString() @IsNotEmpty()
  ctacontable: string;

  @ApiProperty({ description: 'ID de la moneda' })
  @IsNumber()
  monedaId: number;

  @ApiProperty({ required: false, description: 'Saldo inicial de la cuenta (default 0.00)' })
  @IsNumber() @IsOptional()
  saldo?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBcoCtaDto {
  @ApiProperty({ required: false, description: 'ID del banco' })
  @IsNumber() @IsOptional()
  bancoId?: number;

  @ApiProperty({ required: false, description: 'Número de cuenta bancaria' })
  @IsString() @IsOptional()
  nrocuenta?: string;

  @ApiProperty({ required: false, description: 'Cuenta contable asociada (coctacontables.ctacontable)' })
  @IsString() @IsOptional()
  ctacontable?: string;

  @ApiProperty({ required: false, description: 'ID de la moneda' })
  @IsNumber() @IsOptional()
  monedaId?: number;

  @ApiProperty({ required: false, description: 'Saldo de la cuenta — informativo, lo mueven los movimientos bancarios' })
  @IsNumber() @IsOptional()
  saldo?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}

// ── Movimientos bancarios ──────────────────────────────────

export class CreateBcoMovimientoDto {
  @ApiProperty({ description: 'ID del banco' })
  @IsNumber()
  bancoId: number;

  @ApiProperty({ description: 'ID de la cuenta bancaria' })
  @IsNumber()
  bcoctasId: number;

  @ApiProperty({ description: 'ID del módulo origen' })
  @IsNumber()
  moduloId: number;

  @ApiProperty({ enum: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA', 'PAGO', 'NOTA_DEBITO', 'NOTA_CREDITO'], description: 'Tipo de movimiento' })
  @IsEnum(['DEPOSITO', 'RETIRO', 'TRANSFERENCIA', 'PAGO', 'NOTA_DEBITO', 'NOTA_CREDITO'])
  tipomov: string;

  @ApiProperty({ enum: ['D', 'C'], required: false, description: 'Débito o crédito — se deriva del tipo (DEPOSITO=D; RETIRO/TRANSFERENCIA/PAGO=C)' })
  @IsEnum(['D', 'C']) @IsOptional()
  dc_debitocredito?: string;

  @ApiProperty({ required: false, description: 'Número de referencia' })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ description: 'Importe del movimiento' })
  @IsNumber()
  importe: number;

  @ApiProperty({ required: false, description: 'Concepto del movimiento' })
  @IsString() @IsOptional()
  concepto?: string;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBcoMovimientoDto {
  @ApiProperty({ enum: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA', 'PAGO', 'NOTA_DEBITO', 'NOTA_CREDITO'], required: false })
  @IsEnum(['DEPOSITO', 'RETIRO', 'TRANSFERENCIA', 'PAGO', 'NOTA_DEBITO', 'NOTA_CREDITO']) @IsOptional()
  tipomov?: string;

  @ApiProperty({ enum: ['D', 'C'], required: false })
  @IsEnum(['D', 'C']) @IsOptional()
  dc_debitocredito?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  nroreferencia?: string;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false })
  @IsNumber() @IsOptional()
  importe?: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  concepto?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_doc_anulado?: string;
}

// ── Emisión de cheques ──────────────────────────────────────

export class FacturaPendienteDto {
  @ApiProperty({ description: 'ID de la compra (cxpcomprasmae)' })
  @IsNumber()
  compraId: number;

  @ApiProperty({ description: 'Saldo pendiente de la factura' })
  @IsNumber()
  saldo: number;

  @ApiProperty({ description: 'Nro. referencia de la factura (nroreferencia)' })
  @IsOptional()
  @IsString()
  nroReferencia?: string;
}

export class GrupoProveedorDto {
  @ApiProperty({ description: 'ID del proveedor' })
  @IsNumber()
  proveedorId: number;

  @ApiProperty({ description: 'Código del proveedor' })
  @IsString()
  codproveedor: string;

  @ApiProperty({ description: 'Razón social del proveedor (para el cheque)' })
  @IsString()
  beneficiario: string;

  @ApiProperty({ description: 'Facturas a pagar con sus saldos' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacturaPendienteDto)
  facturas: FacturaPendienteDto[];
}

export class EmitirChequeDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria origen' })
  @IsNumber()
  bcoctasId: number;

  @ApiProperty({ description: 'ID del banco' })
  @IsNumber()
  bancoId: number;

  @ApiProperty({ description: 'Grupos de proveedores — 1 cheque por grupo' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrupoProveedorDto)
  grupos: GrupoProveedorDto[];

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

// ── Cheque a particular / empleado ──────────────────────────

export class EmitirChequeParticularDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria origen' })
  @IsNumber()
  bcoctasId: number;

  @ApiProperty({ description: 'ID del banco' })
  @IsNumber()
  bancoId: number;

  @ApiProperty({ description: 'Nombre del beneficiario (persona particular/empleado)' })
  @IsString()
  beneficiario: string;

  @ApiProperty({ description: 'Concepto / motivo del pago' })
  @IsString()
  concepto: string;

  @ApiProperty({ description: 'Importe del cheque' })
  @IsNumber()
  importe: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

// ── Conciliación Bancaria ──────────────────────────────────

export class CreateConciliacionDetDto {
  @ApiProperty({ description: 'Fecha del movimiento bancario' })
  @IsOptional()
  fecmovbco?: Date;

  @ApiProperty({ description: 'Nro. referencia' })
  @IsString()
  nrorefencia: string;

  @ApiProperty({ description: 'Concepto/descripción' })
  @IsString()
  concepto: string;

  @ApiProperty({ description: 'Importe' })
  @IsNumber()
  importe: number;

  @ApiProperty({ enum: ['D', 'C'], description: 'Naturaleza (Débito/Crédito)' })
  @IsEnum(['D', 'C'])
  naturaleza: string;

  @ApiProperty({ required: false, description: 'Conciliado (S/N)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_conciliado?: string;

  @ApiProperty({ required: false, description: 'ID del movimiento bancario coincidente' })
  @IsNumber() @IsOptional()
  bcomovimientosId?: number;
}

export class CreateConciliacionDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria' })
  @IsNumber()
  ctabcoId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, description: 'Fecha desde del estado de cuenta' })
  @IsOptional()
  fechaDesde?: Date;

  @ApiProperty({ required: false, description: 'Fecha hasta del estado de cuenta' })
  @IsOptional()
  fechaHasta?: Date;

  @ApiProperty({ required: false, description: 'Saldo inicial del estado de cuenta' })
  @IsNumber() @IsOptional()
  saldoInicial?: number;

  @ApiProperty({ required: false, description: 'Saldo final del estado de cuenta' })
  @IsNumber() @IsOptional()
  saldoFinal?: number;

  @ApiProperty({ description: 'Detalle del estado de cuenta importado' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConciliacionDetDto)
  detalles: CreateConciliacionDetDto[];
}

export class UpdateConciliacionDto {
  @ApiProperty({ enum: ['S', 'N'], required: false })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_conciliado?: string;

  @ApiProperty({ required: false })
  @IsArray() @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateConciliacionDetDto)
  detalles?: CreateConciliacionDetDto[];
}

// ── Documentos de conciliación (bcosccdocs) ────────────────

export class CreateBcoCcdocsDto {
  @ApiProperty({ description: 'Descripción del documento' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Abreviatura del documento' })
  @IsString() @IsOptional()
  abreviatura?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateBcoCcdocsDto {
  @ApiProperty({ required: false, description: 'Descripción del documento' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Abreviatura del documento' })
  @IsString() @IsOptional()
  abreviatura?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;
}
