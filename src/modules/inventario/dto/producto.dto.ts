import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ required: false, description: 'Código de barras del producto' })
  @IsString() @IsOptional()
  codbarra?: string;

  @ApiProperty({ description: 'Descripción del producto' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ required: false, description: 'Descripción corta del producto' })
  @IsString() @IsOptional()
  descripcion_corta?: string;

   //20261015 ARFM
  @ApiProperty({ required: false, description: 'Descripción del codigo sku' })
  @IsString() @IsOptional()
  codigo_sku?: string;

  @ApiProperty({ required: false, description: 'Costo unitario del producto' })
  @IsNumber() @IsOptional()
  cstounit?: number;

  @ApiProperty({ required: false, description: 'Costo promedio del producto' })
  @IsNumber() @IsOptional()
  cstoprom?: number;

  @ApiProperty({ required: false, description: 'Precio de venta del producto' })
  @IsNumber() @IsOptional()
  precioventa?: number;

  @ApiProperty({ required: false, description: 'Fecha de última compra' })
  @IsDateString() @IsOptional()
  fecUltcom?: string;

  @ApiProperty({ required: false, description: 'Fecha de última venta' })
  @IsDateString() @IsOptional()
  fecUltvta?: string;

  @ApiProperty({ required: false, description: 'Puntos de retorno' })
  @IsNumber() @IsOptional()
  puntoretorno?: number;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsNumber()
  categoriaId: number;

   //20261015 ARFM  
  @ApiProperty({ description: 'ID del departamento' })
  @IsNumber()
  deptoId: number;
  
   //20261015 ARFM
  @ApiProperty({ description: 'ID de la marca del producto' })
  @IsNumber()
  marcaId: number;
  
   //20261015 ARFM  
  @ApiProperty({ description: 'ID del pasillo' })
  @IsNumber()
  pasilloId: number;
  
  @ApiProperty({ required: false, description: 'ID del impuesto' })
  @IsNumber() @IsOptional()
  impuestoId?: number;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Producto controlado (fármacos, material agroindustrial)',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_controlado?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Producto regulado como droga o psicotrópico',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_droga?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Valida manejo de lote de vencimiento',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_valida_lote?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Platillo solicitado a cocina',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviar_a_cocina?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsNumber()
  empresaId: number;
}

export class UpdateProductoDto {
  @ApiProperty({ required: false, description: 'Código de barras del producto' })
  @IsString() @IsOptional()
  codbarra?: string;

  @ApiProperty({ required: false, description: 'Descripción del producto' })
  @IsString() @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, description: 'Descripción corta del producto' })
  @IsString() @IsOptional()
  descripcion_corta?: string;

   //20261015 ARFM
  @ApiProperty({ required: false, description: 'Descripción del codigo sku' })
  @IsString() @IsOptional()
  codigo_sku?: string;

  @ApiProperty({ required: false, description: 'Costo unitario del producto' })
  @IsNumber() @IsOptional()
  cstounit?: number;

  @ApiProperty({ required: false, description: 'Costo promedio del producto' })
  @IsNumber() @IsOptional()
  cstoprom?: number;

  @ApiProperty({ required: false, description: 'Precio de venta del producto' })
  @IsNumber() @IsOptional()
  precioventa?: number;

  @ApiProperty({ required: false, description: 'Fecha de última compra' })
  @IsDateString() @IsOptional()
  fecUltcom?: string;

  @ApiProperty({ required: false, description: 'Fecha de última venta' })
  @IsDateString() @IsOptional()
  fecUltvta?: string;

  @ApiProperty({ required: false, description: 'Puntos de retorno' })
  @IsNumber() @IsOptional()
  puntoretorno?: number;

  @ApiProperty({ required: false, description: 'ID de la categoría' })
  @IsNumber() @IsOptional()
  categoriaId?: number;
  
  @ApiProperty({ required: false, description: 'ID del impuesto' })
  @IsNumber() @IsOptional()
  impuestoId?: number;

   //20261015 ARFM  
  @ApiProperty({ description: 'ID del departamento' })
  @IsNumber()
  deptoId: number;
  
   //20261015 ARFM
  @ApiProperty({ description: 'ID de la marca del producto' })
  @IsNumber()
  marcaId: number;
  
   //20261015 ARFM  
  @ApiProperty({ description: 'ID del pasillo' })
  @IsNumber()
  pasilloId: number;


  @ApiProperty({ enum: ['S', 'N'], required: false, description: 'Activo (Sí/No)' })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_activo?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Producto controlado (fármacos, material agroindustrial)',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_controlado?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Producto regulado como droga o psicotrópico',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_droga?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Valida manejo de lote de vencimiento',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_valida_lote?: string;

  @ApiProperty({
    enum: ['S', 'N'],
    required: false,
    description: 'Platillo solicitado a cocina',
  })
  @IsEnum(['S', 'N']) @IsOptional()
  sn_enviar_a_cocina?: string;
}
