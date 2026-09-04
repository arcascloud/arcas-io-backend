import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParamFacDto {
  @ApiProperty({ required: false, description: 'ID de bodega predeterminada' })
  @IsNumber() @IsOptional()
  bodegaId?: number;

  @ApiProperty({ required: false, description: 'Correlativo de factura' })
  @IsNumber() @IsOptional()
  nrofactura?: number;

  @ApiProperty({ required: false, description: 'Correlativo de cotización' })
  @IsNumber() @IsOptional()
  nrocotizacion?: number;

  @ApiProperty({ required: false, description: 'Correlativo de anulación' })
  @IsNumber() @IsOptional()
  nroanulacion?: number;

  @ApiProperty({ required: false, description: 'ID de impuesto' })
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @ApiProperty({ required: false, description: 'ID de caja' })
  @IsNumber() @IsOptional()
  cajaId?: number;

  @ApiProperty({ required: false, description: 'Líneas por factura' })
  @IsNumber() @IsOptional()
  lineasFactura?: number;

  @ApiProperty({ required: false, description: 'Días para devolución' })
  @IsNumber() @IsOptional()
  diasDevolucion?: number;

  @ApiProperty({ required: false, description: 'Porcentaje máximo de devolución' })
  @IsNumber() @IsOptional()
  porcentajeDevolucion?: number;

  @ApiProperty({ required: false, description: 'Correlativo PDA ventas' })
  @IsNumber() @IsOptional()
  nrodpdaventas?: number;

  @ApiProperty({ required: false, description: 'Correlativo PDA devolución' })
  @IsNumber() @IsOptional()
  nropdadevolucion?: number;

  @ApiProperty({ required: false, description: 'Correlativo PDA anulación' })
  @IsNumber() @IsOptional()
  nropdaanulacion?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Integrado con CxC' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_integrado_cxc?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Punto de venta activo' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_puntoventa?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Integrado con caja' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_integrado_caja?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Anticipos activos' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_anticipos?: string;

  @ApiProperty({ required: false, description: 'Mensaje de factura' })
  @IsString() @IsOptional()
  mensajeFactura?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Correlativo único' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_correlativoUnico?: string;

  @ApiProperty({ required: false, description: 'Margen superior (mm)' })
  @IsNumber() @IsOptional()
  mg_t?: number;

  @ApiProperty({ required: false, description: 'Margen inferior (mm)' })
  @IsNumber() @IsOptional()
  mg_b?: number;

  @ApiProperty({ required: false, description: 'Margen izquierdo (mm)' })
  @IsNumber() @IsOptional()
  mg_l?: number;

  @ApiProperty({ required: false, description: 'Margen derecho (mm)' })
  @IsNumber() @IsOptional()
  mg_d?: number;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Múltiples cajeros' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_multiplezcajeros?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Imprime factura' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_imprimefactura?: string;

  @ApiProperty({ required: false, description: 'Impresora de factura' })
  @IsString() @IsOptional()
  ImpresoraFactura?: string;

  @ApiProperty({ required: false, description: 'Impresora de comprobante' })
  @IsString() @IsOptional()
  ImpresoraComprobante?: string;

  @ApiProperty({ required: false, description: 'Impresora de madera' })
  @IsString() @IsOptional()
  ImpresoraMadera?: string;

  @ApiProperty({ required: false, description: 'Impresora de recibo' })
  @IsString() @IsOptional()
  ImpresoraRecibo?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 1' })
  @IsString() @IsOptional()
  DriverImpresora1?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 2' })
  @IsString() @IsOptional()
  DriverImpresora2?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 3' })
  @IsString() @IsOptional()
  DriverImpresora3?: string;

  @ApiProperty({ required: false, description: 'Driver impresora 4' })
  @IsString() @IsOptional()
  DriverImpresora4?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 1' })
  @IsString() @IsOptional()
  Puerto1?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 2' })
  @IsString() @IsOptional()
  Puerto2?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 3' })
  @IsString() @IsOptional()
  Puerto3?: string;

  @ApiProperty({ required: false, description: 'Puerto impresora 4' })
  @IsString() @IsOptional()
  Puerto4?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Múltiples empresas' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_multipleempresa?: string;

  @ApiProperty({ required: false, enum: ['S', 'N'], description: 'Impuesto incluido' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_impuestoincluido?: string;
}

export class UpdateParamFacDto extends CreateParamFacDto {}
