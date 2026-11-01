import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TodopagoService } from './todopago.service';
import { ConfirmarPagoDto, WebhookDto } from './dto/todopago.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('TodoPago')
@Controller('todopago')
export class TodopagoController {
  private readonly logger = new Logger(TodopagoController.name);

  constructor(private readonly svc: TodopagoService) {}

  @Get('config')
  @ApiOperation({ summary: 'Estado de la configuración TodoPago (enabled/sandbox)' })
  getConfig() {
    return this.svc.getConfig();
  }

  @Get('links-pendientes')
  @ApiOperation({
    summary:
      'Links de pago pendientes (aplica expiración local de 48h y enriquece con datos de la factura)',
  })
  linksPendientes(@Query('empresaId') empresaId?: string) {
    // Query param opcional → parseo manual (ParseIntPipe solo en params requeridos)
    const emp = empresaId ? Number(empresaId) : NaN;
    return this.svc.listarLinksPendientes(!isNaN(emp) && emp > 0 ? emp : undefined);
  }

  @Post('generar-link/:facturaId')
  @ApiOperation({ summary: 'Generar link de pago TodoPago para una factura' })
  @ApiParam({ name: 'facturaId', type: Number })
  generarLink(
    @Param('facturaId', ParseIntPipe) facturaId: number,
    @CurrentUser() user: any,
  ) {
    const usuario = user?.usuario || 'SISTEMA';
    return this.svc.generarLink(facturaId, usuario);
  }

  @Get('status/:operationId')
  @ApiOperation({ summary: 'Estado de una transacción por OperationId' })
  @ApiParam({ name: 'operationId', type: String })
  status(@Param('operationId') operationId: string) {
    return this.svc.consultarStatus(operationId);
  }

  @Get('transacciones/:facturaId')
  @ApiOperation({ summary: 'Historial de transacciones TodoPago de una factura' })
  @ApiParam({ name: 'facturaId', type: Number })
  transacciones(@Param('facturaId', ParseIntPipe) facturaId: number) {
    return this.svc.listarTransacciones(facturaId);
  }

  @Post('confirmar')
  @ApiOperation({
    summary:
      'Confirmación del pago (callback URL_OK / sandbox) — público, idempotente: transacción + sn_pagada + caja',
  })
  confirmar(@Body() dto: ConfirmarPagoDto) {
    this.logger.log(`confirmar ← key=${dto.PublicRequestKey} order=${dto.Order || '-'}`);
    return this.svc.confirmarPago(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Notificación servidor a servidor (webhook) — público' })
  webhook(@Body() dto: WebhookDto) {
    this.logger.log(`webhook ← op=${dto.OPERATIONID}`);
    return this.svc.webhook(dto);
  }
}
