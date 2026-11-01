import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, IsIn } from 'class-validator';
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

  @ApiProperty({ required: false, description: 'RTN del cliente' })
  @IsString() @IsOptional()
  rtn_cliente?: string;

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

  @ApiProperty({ required: false, description: 'ID de la bodega (si no viene, la resuelve el backend desde la sucursal del usuario)' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'ID de la caja (si no viene, la resuelve el backend por parámetro)' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ required: false, description: 'Número de mesa del restaurante' })
  @IsNumber() @IsOptional()
  nromesa?: number | null;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsIn(['S', 'N']) @IsOptional()
  sn_entregado?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de impuestos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ enum: ['OCE', 'SAG', 'CEA', 'FNE'], required: false, description: 'Tipo de constancia' })
  @IsEnum(['OCE', 'SAG', 'CEA', 'FNE']) @IsOptional()
  tipoconstancia?: string;

  @ApiProperty({ required: false, description: 'Número de constancia' })
  @IsString() @IsOptional()
  nroconstancia?: string;

  @ApiProperty({ required: false, description: 'Importe exento de impuestos' })
  @IsNumber() @IsOptional()
  importe_excento?: number;

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

  @ApiProperty({ required: false, description: 'ID de la sucursal' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, description: 'Correlativo CAI autorizado (tcai_autorizado) del que proviene el nrofactura' })
  @IsNumber() @IsOptional()
  caiAutorizadoId?: number;
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

  @ApiProperty({ required: false, description: 'RTN del cliente' })
  @IsString() @IsOptional()
  rtn_cliente?: string;

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

  @ApiProperty({ required: false, description: 'Número de mesa del restaurante' })
  @IsNumber() @IsOptional()
  nromesa?: number | null;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsIn(['S', 'N']) @IsOptional()
  sn_entregado?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de impuestos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ enum: ['OCE', 'SAG', 'CEA', 'FNE'], required: false, description: 'Tipo de constancia' })
  @IsEnum(['OCE', 'SAG', 'CEA', 'FNE']) @IsOptional()
  tipoconstancia?: string;

  @ApiProperty({ required: false, description: 'Número de constancia' })
  @IsString() @IsOptional()
  nroconstancia?: string;

  @ApiProperty({ required: false, description: 'Importe exento de impuestos' })
  @IsNumber() @IsOptional()
  importe_excento?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura anulada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anulada?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Factura contabilizada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_contabilizada?: string;

  @ApiProperty({ required: false, description: 'Correlativo CAI autorizado (tcai_autorizado) del que proviene el nrofactura' })
  @IsNumber() @IsOptional()
  caiAutorizadoId?: number;
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

  @ApiProperty({ required: false, description: 'ID del descuento (tposdescuentos)' })
  @IsNumber() @IsOptional()
  descuentoId?: number;

  @ApiProperty({ required: false, description: 'ID de la empresa. Opcional en canales públicos (tienda online): el backend resuelve la empresa default' })
  @IsNumber() @IsOptional()
  empresaId?: number;
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

  @ApiProperty({ required: false, description: 'Número de mesa del restaurante' })
  @IsNumber() @IsOptional()
  nromesa?: number | null;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsIn(['S', 'N']) @IsOptional()
  sn_entregado?: string;

  @ApiProperty({ required: false, description: 'ID del descuento (tposdescuentos)' })
  @IsNumber() @IsOptional()
  descuentoId?: number;
}

export class CreatePosPedMaeDto {
  @ApiProperty({ description: 'Nombre del cliente' })
  @IsString() @IsNotEmpty()
  nombrecliente: string;

  @ApiProperty({ description: 'Número de teléfono' })
  @IsString() @IsOptional()
  nrotelefono?: string;

  @ApiProperty({ required: false, description: 'ID del cliente (cxcclientes). Si no viene, el backend resuelve el cliente TIENDA' })
  @IsNumber() @IsOptional()
  clienteId?: number;

  @ApiProperty({ required: false, description: 'Nro. de cliente (cxcclientes.nrocliente)' })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ required: false, description: 'Dirección de entrega del pedido' })
  @IsString() @IsOptional()
  direccion_entrega?: string;

  @ApiProperty({ required: false, description: 'RTN del cliente en el pedido' })
  @IsString() @IsOptional()
  rtn_cliente?: string;

  @ApiProperty({ enum: ['E', 'C'], required: false, description: 'E=contado, C=crédito' })
  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @ApiProperty({ required: false, description: 'Días de crédito' })
  @IsNumber() @IsOptional()
  diascredito?: number;

  @ApiProperty({ required: false, description: 'Fecha de vencimiento (crédito)' })
  @IsOptional()
  fechavencimiento?: string | Date;

  @ApiProperty({ required: false, description: 'Factor de cambio (default 1 = Lempiras)' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de ISV' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ enum: ['OCE', 'SAG', 'CEA', 'FNE'], required: false, description: 'Tipo de constancia (si exenta)' })
  @IsEnum(['OCE', 'SAG', 'CEA', 'FNE']) @IsOptional()
  tipoconstancia?: string;

  @ApiProperty({ required: false, description: 'Nro. de constancia (si exenta)' })
  @IsString() @IsOptional()
  nroconstancia?: string;

  @ApiProperty({ required: false, description: 'Importe excento de ISV (calculado desde el detalle)' })
  @IsNumber() @IsOptional()
  importe_excento?: number;

  @ApiProperty({ required: false, description: 'ID de la bodega (si no viene, el backend aplica la bodega por defecto)' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'ID de la caja (si no viene, el backend aplica la caja por defecto)' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'ID de la sucursal (inyectado por el controller desde el JWT)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ required: false, description: 'Número de mesa del restaurante' })
  @IsNumber() @IsOptional()
  nromesa?: number | null;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsIn(['S', 'N']) @IsOptional()
  sn_entregado?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ required: false, description: 'Subtotal (recalculado por el backend desde el detalle)' })
  @IsNumber() @IsOptional()
  subTotal?: number;

  @ApiProperty({ required: false, description: 'Impuesto (recalculado por el backend)' })
  @IsNumber() @IsOptional()
  impuesto?: number;

  @ApiProperty({ required: false, description: 'Descuento (recalculado por el backend)' })
  @IsNumber() @IsOptional()
  descuento?: number;

  @ApiProperty({ required: false, description: 'Total (recalculado por el backend)' })
  @IsNumber() @IsOptional()
  total?: number;

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

  @ApiProperty({ required: false, description: 'ID del cliente (cxcclientes)' })
  @IsNumber() @IsOptional()
  clienteId?: number;

  @ApiProperty({ required: false, description: 'Nro. de cliente (cxcclientes.nrocliente)' })
  @IsString() @IsOptional()
  nrocliente?: string;

  @ApiProperty({ required: false, description: 'Dirección de entrega del pedido' })
  @IsString() @IsOptional()
  direccion_entrega?: string;

  @ApiProperty({ required: false, description: 'RTN del cliente en el pedido' })
  @IsString() @IsOptional()
  rtn_cliente?: string;

  @ApiProperty({ enum: ['E', 'C'], required: false, description: 'E=contado, C=crédito' })
  @IsEnum(['E', 'C']) @IsOptional()
  tipofactura?: string;

  @ApiProperty({ required: false, description: 'Días de crédito' })
  @IsNumber() @IsOptional()
  diascredito?: number;

  @ApiProperty({ required: false, description: 'Fecha de vencimiento (crédito)' })
  @IsOptional()
  fechavencimiento?: string | Date;

  @ApiProperty({ required: false, description: 'Factor de cambio (default 1 = Lempiras)' })
  @IsNumber() @IsOptional()
  factordecambio?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Exenta de ISV' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_excenta?: string;

  @ApiProperty({ enum: ['OCE', 'SAG', 'CEA', 'FNE'], required: false, description: 'Tipo de constancia (si exenta)' })
  @IsEnum(['OCE', 'SAG', 'CEA', 'FNE']) @IsOptional()
  tipoconstancia?: string;

  @ApiProperty({ required: false, description: 'Nro. de constancia (si exenta)' })
  @IsString() @IsOptional()
  nroconstancia?: string;

  @ApiProperty({ required: false, description: 'Importe excento de ISV (calculado desde el detalle)' })
  @IsNumber() @IsOptional()
  importe_excento?: number;

  @ApiProperty({ required: false, description: 'ID de la bodega' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'ID de la caja' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'ID del gestor' })
  @IsNumber() @IsOptional()
  gestorId?: number;

  @ApiProperty({ required: false, description: 'Número de mesa del restaurante' })
  @IsNumber() @IsOptional()
  nromesa?: number | null;

  @ApiProperty({ required: false, enum: ['S', 'N'] })
  @IsIn(['S', 'N']) @IsOptional()
  sn_entregado?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pagada' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_pagada?: string;

  @ApiProperty({ required: false, description: 'ID de la factura asociada' })
  @IsNumber() @IsOptional()
  facturaId?: number;

  @ApiProperty({ required: false, description: 'Nro. de factura asociada' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Envío gratis' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviogratis?: string;

  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Pedido facturado' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_facturado?: string;
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

  @ApiProperty({ required: false, description: 'ID de la forma de pago (opcional en pedidos a crédito: no generan filas de caja)' })
  @IsNumber() @IsOptional()
  formapagoId?: number;

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

  @ApiProperty({
    required: false,
    description:
      'Múltiples formas de pago (tabla de pagos de Nueva Factura). ' +
      'Cada item: { formapagoId, tarjetacreditoId?, nrotarjeta?, nroautorizacion?, importe, esEfectivo? }. ' +
      'Si se envía, se crea una fila en posfaccaja por cada pago; si no, se mantiene la fila única (legacy).',
  })
  @IsArray() @IsOptional()
  pagos?: any[];

  @ApiProperty({ required: false, description: 'ID de la sucursal (inyectado por el controller desde el JWT)' })
  @IsNumber() @IsOptional()
  Idsucursal?: number;
}
