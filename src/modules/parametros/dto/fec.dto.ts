import {
  IsNumber, IsOptional, IsString, IsDateString, IsArray,
  ValidateNested, IsEnum, IsNotEmpty, Matches, Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Línea del detalle de usuarios autorizados (tfecdet) dentro de un maestro.
 * `usuario` es el login (PK de tunusuarios).
 */
export class FecdetItemDto {
  @ApiProperty({ description: 'Login del usuario autorizado', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  usuario: string;

  @ApiPropertyOptional({ enum: ['S', 'N'], description: '¿Permitido?', default: 'S' })
  @IsOptional()
  @IsEnum(['S', 'N'])
  sn_permitido?: string;
}

/**
 * Alta de un maestro de fechas autorizadas con su detalle de usuarios.
 * El maestro y todas las líneas se insertan en UNA sola transacción.
 */
export class CreateFecmaDto {
  @ApiPropertyOptional({
    description: 'Fecha contable del rango (YYYY-MM-DD). Si se omite usa la Fecha del Sistema',
    example: '2026-10-06',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechasistema debe tener el formato YYYY-MM-DD',
  })
  fechasistema?: string;

  @ApiProperty({ description: 'Fecha desde de vigencia', example: '2026-09-30' })
  @IsNotEmpty()
  fec_vig_desde: Date;

  @ApiProperty({ description: 'Fecha hasta de vigencia', example: '2026-10-05' })
  @IsNotEmpty()
  fec_vig_hasta: Date;

  @ApiPropertyOptional({ description: 'Empresa (se inyecta desde el frontend)', default: 0 })
  @IsOptional()
  @IsNumber()
  empresaId?: number;

  @ApiProperty({ description: 'Detalle de usuarios autorizados', type: [FecdetItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FecdetItemDto)
  detalles: FecdetItemDto[];
}

/**
 * Modificación de un maestro de fechas autorizadas con su detalle.
 * El detalle existente se REEMPLAZA completo (borrado + alta) en transacción.
 */
export class UpdateFecmaDto {
  @ApiPropertyOptional({
    description: 'Fecha contable del rango (YYYY-MM-DD)',
    example: '2026-10-06',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechasistema debe tener el formato YYYY-MM-DD',
  })
  fechasistema?: string;

  @ApiPropertyOptional({ description: 'Fecha desde de vigencia' })
  @IsOptional()
  fec_vig_desde?: Date;

  @ApiPropertyOptional({ description: 'Fecha hasta de vigencia' })
  @IsOptional()
  fec_vig_hasta?: Date;

  @ApiPropertyOptional({ description: 'Empresa', default: 0 })
  @IsOptional()
  @IsNumber()
  empresaId?: number;

  @ApiPropertyOptional({ description: 'Detalle de usuarios autorizados', type: [FecdetItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FecdetItemDto)
  detalles?: FecdetItemDto[];
}

/** Alta de una línea de detalle suelta (tfecdet). */
export class CreateFecdetDto {
  @ApiProperty({ description: 'FK al maestro tfecma' })
  @IsNumber()
  fecmaeId: number;

  @ApiProperty({ description: 'Login del usuario autorizado', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  usuario: string;

  @ApiPropertyOptional({ enum: ['S', 'N'], description: '¿Permitido?', default: 'S' })
  @IsOptional()
  @IsEnum(['S', 'N'])
  sn_permitido?: string;

  @ApiPropertyOptional({ description: 'Empresa (se inyecta desde el frontend)', default: 0 })
  @IsOptional()
  @IsNumber()
  empresaId?: number;
}

/** Modificación de una línea de detalle suelta (tfecdet). */
export class UpdateFecdetDto {
  @ApiPropertyOptional({ description: 'FK al maestro tfecma' })
  @IsOptional()
  @IsNumber()
  fecmaeId?: number;

  @ApiPropertyOptional({ description: 'Login del usuario autorizado' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  usuario?: string;

  @ApiPropertyOptional({ enum: ['S', 'N'], description: '¿Permitido?' })
  @IsOptional()
  @IsEnum(['S', 'N'])
  sn_permitido?: string;

  @ApiPropertyOptional({ description: 'Empresa', default: 0 })
  @IsOptional()
  @IsNumber()
  empresaId?: number;
}

/**
 * Consulta de autorizaci�n: �puede `usuario` registrar datos en `fecha`
 * (habitualmente una fecha de per�odo ya cerrado)?
 */
export class AutorizarFecmaQueryDto {
  @ApiProperty({ description: 'Login del usuario', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiPropertyOptional({ description: 'Fecha a validar (YYYY-MM-DD). Si se omite usa la fecha del sistema' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ description: 'Empresa', default: 0 })
  @IsOptional()
  @IsNumber()
  empresaId?: number;
}

/** Solo para Swagger del endpoint: se usa @Query plano, no este DTO. */
export class VacioDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^$/)
  _?: string;
}


/**
 * Cambio de la Fecha del Sistema del ERP (`tempresas.fechasistema`).
 *
 * Operación reservada a los roles admin / supervisor / contador (ROLES_FECHAS).
 * Es la única escritura exenta del bloqueo por fecha desalineada, porque si no
 * no existiría forma de corregirla.
 */
export class UpdateFechaSistemaDto {
  @ApiProperty({
    description: 'Nueva fecha del sistema en formato YYYY-MM-DD',
    example: '2026-10-02',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechasistema debe tener el formato YYYY-MM-DD',
  })
  fechasistema: string;
}
