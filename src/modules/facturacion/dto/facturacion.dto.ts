import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePosFacMaeDto {
  @ApiProperty({ required: false, description: 'Número de factura' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ enum: ['E', 'C'], required: false, description: 'Tipo de factura (Electrónica/Contingencia)' })
  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsNumber() @IsNotEmpty()
  clienteId: number;

  @ApiProperty({ description: 'Número de cliente' })
  @IsString() @IsNotEmpty()
  nrocliente: string;

  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Subtotal de la factura' })
  @IsNumber() @IsOptional()
  subTotal?: number;

  @ApiProperty({ required: false, description: 'Monto de impuesto' })
  @IsNumber() @IsOptional()
  impuesto?: number;

  @ApiProperty({ required: false, description: 'Monto de descuento' })
  @IsNumber() @IsOptional()
  descuento?: number;

  @ApiProperty({ required: false, description: 'Total de la factura' })
  @IsNumber() @IsOptional()
  total?: number;

  @ApiProperty({ required: false, description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'Importe de cambio' })
  @IsNumber() @IsOptional()
  importe_cambio?: number;

  @ApiProperty({ required: false, description: 'Días de crédito' })
  @IsNumber() @IsOptional()
  diascredito?: number;

  @ApiProperty({ required: false, description: 'Fecha de vencimiento' })
  @IsString() @IsOptional()
  fechavencimiento?: string;

  @ApiProperty({ description: 'ID de la bodega' })
  @IsNumber() @IsNotEmpty()
  bodegaId: number;

  @ApiProperty({ description: 'ID de la caja' })
  @IsNumber() @IsNotEmpty()
  cajaId: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de impuestos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ required: false, description: 'Número de carnet' })
  @IsString() @IsOptional()
  nrocarnet?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosFacMaeDto {
  @ApiProperty({ required: false, description: 'Número de factura' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ enum: ['E', 'C'], required: false, description: 'Tipo de factura (Electrónica/Contingencia)' })
  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @ApiProperty({ required: false, description: 'ID del cliente' })
  @IsNumber() @IsOptional()
  clienteId?: number;

  @ApiProperty({ required: false, description: 'Número de cliente' })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, description: 'Factor de cambio' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ required: false, description: 'Subtotal de la factura' })
  @IsNumber() @IsOptional()
  subTotal?: number;

  @ApiProperty({ required: false, description: 'Monto de impuesto' })
  @IsNumber() @IsOptional()
  impuesto?: number;

  @ApiProperty({ required: false, description: 'Monto de descuento' })
  @IsNumber() @IsOptional()
  descuento?: number;

  @ApiProperty({ required: false, description: 'Total de la factura' })
  @IsNumber() @IsOptional()
  total?: number;

  @ApiProperty({ required: false, description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'Importe de cambio' })
  @IsNumber() @IsOptional()
  importe_cambio?: number;

  @ApiProperty({ required: false, description: 'Días de crédito' })
  @IsNumber() @IsOptional()
  diascredito?: number;

  @ApiProperty({ required: false, description: 'Fecha de vencimiento' })
  @IsString() @IsOptional()
  fechavencimiento?: string;

  @ApiProperty({ required: false, description: 'ID de la bodega' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'ID de la caja' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de impuestos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ required: false, description: 'Número de carnet' })
  @IsString() @IsOptional()
  nrocarnet?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;
}

export class CreatePosCotMaeDto {
  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  Nombrecliente: string;

  @ApiProperty({ description: 'Dirección del cliente' })
  @IsString() @IsNotEmpty()
  direccion: string;

  @ApiProperty({ description: 'Nombre de quien atendió' })
  @IsString() @IsNotEmpty()
  atendio: string;

  @ApiProperty({ description: 'ID del gestor' })
  @IsNumber() @IsNotEmpty()
  gestorId: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosCotMaeDto {
  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  Nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, description: 'Nombre de quien atendió' })
  @IsString() @IsOptional()
  atendio?: string;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;
}

export class CreatePosPedMaeDto {
  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ description: 'Número de teléfono' })
  @IsString() @IsNotEmpty()
  nrotelefono: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Envío gratis' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pedido facturado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;

  @ApiProperty({ required: false, description: 'ID de la factura asociada' })
  @IsNumber() @IsOptional()
  facturaId?: number;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber() @IsNotEmpty()
  empresaId: number;
}

export class UpdatePosPedMaeDto {
  @ApiProperty({ required: false, description: 'Nombre del cliente' })
  @IsString() @IsOptional()
  nombrecliente?: string;

  @ApiProperty({ required: false, description: 'Número de teléfono' })
  @IsString() @IsOptional()
  nrotelefono?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Envío gratis' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pedido facturado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;

  @ApiProperty({ required: false, description: 'ID de la factura asociada' })
  @IsNumber() @IsOptional()
  facturaId?: number;
}

export class CheckoutTiendaDto {
  @ApiProperty({ description: 'ID del carrito (poscotmae)' })
  @IsNumber() @IsNotEmpty()
  poscotmaeId: number;

  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ required: false, description: 'Dirección del cliente' })
  @IsString() @IsOptional()
  direccion?: string;

  @ApiProperty({ description: 'ID de la forma de pago' })
  @IsNumber() @IsNotEmpty()
  formapagoId: number;

  @ApiProperty({ description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'ID de la tarjeta de crédito' })
  @IsNumber() @IsOptional()
  tarjetacreditoId?: number;

  @ApiProperty({ required: false, description: 'Número de tarjeta' })
  @IsString() @IsOptional()
  nrotarjeta?: string;

  @ApiProperty({ required: false, description: 'Número de autorización' })
  @IsString() @IsOptional()
  nroautorizacion?: string;
}

export class CheckoutPedidoDto {
  @ApiProperty({ description: 'ID del pedido (pospedmae)' })
  @IsNumber() @IsNotEmpty()
  pospedmaeId: number;

  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ required: false, description: 'Teléfono del cliente' })
  @IsString() @IsOptional()
  nrotelefono?: string;

  @ApiProperty({ description: 'ID de la forma de pago' })
  @IsNumber() @IsNotEmpty()
  formapagoId: number;

  @ApiProperty({ required: false, description: 'Efectivo recibido' })
  @IsNumber() @IsOptional()
  efectivo_recibido?: number;

  @ApiProperty({ required: false, description: 'ID de la tarjeta de crédito' })
  @IsNumber() @IsOptional()
  tarjetacreditoId?: number;

  @ApiProperty({ required: false, description: 'Número de tarjeta' })
  @IsString() @IsOptional()
  nrotarjeta?: string;

  @ApiProperty({ required: false, description: 'Número de autorización' })
  @IsString() @IsOptional()
  nroautorizacion?: string;

  @ApiProperty({ required: false, description: 'Tipo de pago: T=tarjeta, TR=transferencia, E=efectivo' })
  @IsString() @IsOptional()
  tipopago?: string;
}
