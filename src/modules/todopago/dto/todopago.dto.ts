import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Body del retorno URL_OK / URL_ERROR de TodoPago.
 * Sandbox envía: { PublicRequestKey: 'SIM-...', AnswerKey: 'SIM-...', Order: 'FA-...' }
 */
export class ConfirmarPagoDto {
  @ApiProperty({ description: 'PublicRequestKey devuelto por SendAuthorizeRequest' })
  @IsString()
  @IsNotEmpty()
  PublicRequestKey: string;

  @ApiPropertyOptional({ description: 'AnswerKey de GetAuthorizeAnswer (query param Answer)' })
  @IsOptional()
  @IsString()
  AnswerKey?: string;

  @ApiPropertyOptional({ description: 'OperationId (query param Order)' })
  @IsOptional()
  @IsString()
  Order?: string;
}

/**
 * Body del webhook (notificación servidor a servidor).
 */
export class WebhookDto {
  @ApiProperty({ description: 'OperationId de la transacción' })
  @IsString()
  @IsNotEmpty()
  OPERATIONID: string;
}
