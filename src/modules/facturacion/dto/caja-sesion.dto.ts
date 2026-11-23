import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Apertura de turno de caja.
 *
 * `empresaId` y `usuarioId` NO se aceptan por body: se resuelven del JWT
 * (`@CurrentUser()`) para impedir que un usuario abra turno a nombre de otro
 * o en otra empresa. Cualquier valor enviado desde el frontend es descartado
 * por el `ValidationPipe({ whitelist: true })`.
 */
export class AbrirCajaSesionDto {
  @ApiProperty({
    required: false,
    description:
      'Caja a abrir. Opcional: si el usuario tiene una sola caja asignada en tusuarios_caja se resuelve automáticamente.',
  })
  @IsOptional()
  @IsNumber()
  cajaId?: number;

  @ApiProperty({ description: 'Fondo inicial (efectivo) con el que arranca el turno' })
  @IsNumber()
  @Min(0)
  monto_apertura: number;
}

export class CerrarCajaSesionDto {
  @ApiProperty()
  @IsNumber()
  empresaId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  monto_declarado_cierre: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacion_cierre?: string;
}

export class CreateCajaMovimientoDto {
  @ApiProperty()
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false, description: 'Se toma del :id de la URL; no hace falta enviarlo en el body' })
  @IsOptional()
  @IsNumber()
  sesionId?: number;

  @ApiProperty({
    enum: [
      'APERTURA',
      'VENTA_EFECTIVO',
      'DEVOLUCION_EFECTIVO',
      'INGRESO_EFECTIVO',
      'RETIRO_EFECTIVO',
      'COBRO_TARJETA',
      'COBRO_TRANSFERENCIA',
      'APERTURA_GAVETA_MANUAL',
    ],
  })
  @IsEnum([
    'APERTURA',
    'VENTA_EFECTIVO',
    'DEVOLUCION_EFECTIVO',
    'INGRESO_EFECTIVO',
    'RETIRO_EFECTIVO',
    'COBRO_TARJETA',
    'COBRO_TRANSFERENCIA',
    'APERTURA_GAVETA_MANUAL',
  ])
  tipo: string;

  @ApiProperty()
  @IsNumber()
  signo: number; // 1, -1, 0

  @ApiProperty()
  @IsNumber()
  @Min(0)
  monto: number;

  @ApiProperty({ enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'] })
  @IsEnum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'])
  metodo_pago: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referencia_tipo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  referencia_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  autorizado_por?: string;
}

export class GenerarCorteDto {
  @ApiProperty()
  @IsNumber()
  empresaId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  efectivo_contado?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}
