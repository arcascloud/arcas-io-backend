import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import { TransaccionPago } from './entities/transaccion-pago.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { TPosFacCaja } from '../facturacion/entities/posfaccaja.entity';
import { TPosPedMae } from '../facturacion/entities/pospedmae.entity';
import { FechaSistemaService } from '../../shared/fecha-sistema.service';
import { ConfirmarPagoDto, WebhookDto } from './dto/todopago.dto';

/** ttipoformapago.formapagoId de 'TodoPagoLink' (empresa 2) */
const FORMAPAGO_TODOPAGO = 6;

/** Vigencia local de un link de pago pendiente (horas) → luego pasa a 'expired' */
const TTL_LINK_HORAS = 48;

export interface ResultadoSar {
  url: string;
  publicRequestKey: string;
  operationId: string;
  sandbox?: boolean;
}

export interface ResultadoGaa {
  status: 'completed';
  authorizationCode?: string;
  cardData?: Record<string, any> | null;
  sandbox?: boolean;
}

/**
 * Integración con TodoPago (pasarela de pagos Honduras).
 *
 * Modo SANDBOX automático: si no hay credenciales TODOPAGO_* en el .env,
 * SendAuthorizeRequest/GetAuthorizeAnswer/GetStatus responden en simulación
 * y el link apunta a la página de confirmación del frontend ERP.
 *
 * Protocolo (3 operaciones, igual que la referencia Express):
 *  1. SendAuthorizeRequest → devuelve la URL del link de pago
 *  2. GetAuthorizeAnswer   → confirma tras el pago (callback URL_OK)
 *  3. GetStatus            → consulta estado (webhook / polling)
 */
@Injectable()
export class TodopagoService {
  private readonly logger = new Logger(TodopagoService.name);

  constructor(
    @InjectRepository(TransaccionPago)
    private readonly tpRepo: Repository<TransaccionPago>,
    @InjectRepository(TPosFacMae)
    private readonly facMaeRepo: Repository<TPosFacMae>,
    @InjectRepository(TPosFacCaja)
    private readonly facCajaRepo: Repository<TPosFacCaja>,
    @InjectRepository(TPosPedMae)
    private readonly pedMaeRepo: Repository<TPosPedMae>,
    private readonly fechaSistema: FechaSistemaService,
  ) {}

  // ═══════════════════ CONFIGURACIÓN ═══════════════════

  private get merchant(): string {
    return process.env.TODOPAGO_MERCHANT_ID || '';
  }

  private get apiKey(): string {
    return process.env.TODOPAGO_API_KEY || '';
  }

  private get security(): string {
    return process.env.TODOPAGO_SECURITY || '';
  }

  /** true = credenciales completas (pagos reales); false = sandbox/simulación */
  private get enabled(): boolean {
    return Boolean(this.merchant && this.apiKey);
  }

  private get endpoints() {
    return {
      sendAuthorizeRequest:
        process.env.TODOPAGO_ENDPOINT_SAR || 'https://developers.todopago.com.ar/services/t/1.0/',
      getAuthorizeAnswer:
        process.env.TODOPAGO_ENDPOINT_GAA || 'https://developers.todopago.com.ar/services/t/1.0/',
      getStatus:
        process.env.TODOPAGO_ENDPOINT_STATUS || 'https://developers.todopago.com.ar/services/t/1.0/',
    };
  }

  private get urlOk(): string {
    return (
      process.env.TODOPAGO_URL_OK ||
      `${process.env.PUBLIC_URL || 'http://localhost:4200'}/facturacion/pago-confirmado`
    );
  }

  private get urlError(): string {
    return (
      process.env.TODOPAGO_URL_ERROR ||
      `${process.env.PUBLIC_URL || 'http://localhost:4200'}/facturacion/pago-confirmado`
    );
  }

  private get timeout(): number {
    return parseInt(process.env.TODOPAGO_TIMEOUT || '15000', 10);
  }

  private buildHeaders() {
    return {
      Authorization: `TODOPAGO ${this.apiKey}`,
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json',
    };
  }

  /** GET /todopago/config — estado de la configuración */
  getConfig() {
    return {
      enabled: this.enabled,
      sandbox: !this.enabled,
      hasMerchant: Boolean(this.merchant),
      hasApiKey: Boolean(this.apiKey),
      formapagoId: FORMAPAGO_TODOPAGO,
      urlOk: this.urlOk,
    };
  }

  // ═══════════════════ 1. SendAuthorizeRequest ═══════════════════

  private buildOperationId(facturaId: number): string {
    // varchar(40) en BD → mantener corto
    return `FA-${facturaId}-${Date.now()}`.slice(0, 40);
  }

  /**
   * Crea la solicitud de pago y devuelve la URL del link.
   * Sin credenciales → link simulado a la página de confirmación del ERP.
   */
  private async sendAuthorizeRequest(params: {
    facturaId: number;
    monto: number;
    emailCliente?: string;
    operationId?: string;
  }): Promise<ResultadoSar> {
    const opId = params.operationId || this.buildOperationId(params.facturaId);

    if (!this.enabled) {
      // ── SANDBOX: link simulado que dispara el callback directamente ──
      const publicRequestKey = `SIM-${opId}`.slice(0, 60);
      const url = `${this.urlOk}?Answer=${encodeURIComponent(publicRequestKey)}&Order=${encodeURIComponent(opId)}`;
      this.logger.log(`[SANDBOX] Link simulado para factura ${params.facturaId}: ${url}`);
      return { url, publicRequestKey, operationId: opId, sandbox: true };
    }

    const payload = {
      Security: this.security,
      Merchant: this.merchant,
      URL_OK: this.urlOk,
      URL_ERROR: this.urlError,
      EncodingMethod: 'XML',
      OPERATIONID: opId,
      CURRENCYCODE: '340', // Lempiras (HNL)
      AMOUNT: params.monto.toFixed(2),
      EMAILCLIENTE: params.emailCliente || '',
    };

    try {
      const { data } = await axios.post(this.endpoints.sendAuthorizeRequest, payload, {
        headers: this.buildHeaders(),
        timeout: this.timeout,
      });
      const statusCode = data.StatusCode || 0;
      if (statusCode !== 1 && statusCode !== 0) {
        throw new Error(`TodoPago SAR error [${statusCode}]: ${data.StatusMessage || 'Error desconocido'}`);
      }
      return {
        url: data.URL_Request || '',
        publicRequestKey: data.PublicRequestKey || '',
        operationId: opId,
        sandbox: false,
      };
    } catch (err: any) {
      if (err.response) {
        throw new BadRequestException(
          `TodoPago SAR HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`,
        );
      }
      throw new BadRequestException(err.message || 'Error al contactar TodoPago');
    }
  }

  // ═══════════════════ 2. GetAuthorizeAnswer ═══════════════════

  /** Confirma la transacción tras el pago. Sandbox → completed simulado. */
  private async getAuthorizeAnswer(params: {
    publicRequestKey: string;
    answerKey?: string;
  }): Promise<ResultadoGaa> {
    if (!this.enabled) {
      return {
        status: 'completed',
        authorizationCode: 'SIM-CODE',
        cardData: { lastFour: '0000' },
        sandbox: true,
      };
    }

    const payload = {
      Security: this.security,
      Merchant: this.merchant,
      RequestKey: params.publicRequestKey,
      AnswerKey: params.answerKey || params.publicRequestKey,
    };

    try {
      const { data } = await axios.post(this.endpoints.getAuthorizeAnswer, payload, {
        headers: this.buildHeaders(),
        timeout: this.timeout,
      });
      const statusCode = data.StatusCode || 0;
      if (statusCode !== 1) {
        throw new Error(`TodoPago GAA error [${statusCode}]: ${data.StatusMessage || 'Error desconocido'}`);
      }
      let cardData: Record<string, any> | null = null;
      try {
        cardData = data.CardData ? JSON.parse(data.CardData) : null;
      } catch {
        cardData = null;
      }
      return {
        status: 'completed',
        authorizationCode: data.AuthorizationCode || '',
        cardData,
        sandbox: false,
      };
    } catch (err: any) {
      if (err.response) {
        throw new BadRequestException(
          `TodoPago GAA HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`,
        );
      }
      throw new BadRequestException(err.message || 'Error al confirmar el pago en TodoPago');
    }
  }

  // ═══════════════════ 3. GetStatus ═══════════════════

  /** Consulta el estado en el gateway (solo modo real). Sandbox → no aplica. */
  private async consultarGateway(operationId: string): Promise<string | null> {
    if (!this.enabled) return null;
    try {
      const payload = {
        Security: this.security,
        Merchant: this.merchant,
        OPERATIONID: operationId,
      };
      const { data } = await axios.post(this.endpoints.getStatus, payload, {
        headers: this.buildHeaders(),
        timeout: this.timeout,
      });
      const results = data.Operations?.Operations || [];
      if (results.length === 0) return null;
      const statusMap: Record<number, string> = {
        1: 'completed',
        2: 'pending',
        3: 'failed',
        [-1]: 'expired',
      };
      return statusMap[results[0].StatusCode] || null;
    } catch (err: any) {
      this.logger.warn(`GetStatus falló para ${operationId}: ${err.message}`);
      return null;
    }
  }

  // ═══════════════════ OPERACIONES DE PERSISTENCIA ═══════════════════

  /**
   * Genera el link de pago para una factura.
   * Monto = total de la factura − lo ya registrado en posfaccaja.
   */
  async generarLink(facturaId: number, currentUser: string) {
    const factura = await this.facMaeRepo.findOne({ where: { facturaId } });
    if (!factura) throw new NotFoundException(`Factura ${facturaId} no encontrada`);
    if (factura.sn_anulada === 'S') throw new BadRequestException('La factura está anulada');

    const cajas = await this.facCajaRepo.find({ where: { facturaId } });
    const yaPagado = cajas.reduce(
      (s, c) => s + Number(c.importe_efectivo || 0) + Number(c.importe_otros || 0),
      0,
    );
    const monto = Math.round((Number(factura.total) - yaPagado) * 100) / 100;
    if (monto <= 0) throw new BadRequestException('La factura ya está saldada');

    const operationId = this.buildOperationId(facturaId);
    const sar = await this.sendAuthorizeRequest({
      facturaId,
      monto,
      emailCliente: '',
      operationId,
    });

    // Un solo link vigente por factura: los pendientes anteriores quedan 'expired'
    await this.tpRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'expired' })
      .where('facturaid = :fid', { fid: facturaId })
      .andWhere('status = :st', { st: 'pending' })
      .execute();

    const tx = await this.tpRepo.save(
      this.tpRepo.create({
        facturaid: facturaId,
        operationId: sar.operationId,
        publicRequestKey: sar.publicRequestKey,
        status: 'pending',
        monto: monto.toFixed(2) as any,
        metodo: 'link',
        rawRequest: {
          url: sar.url,
          sandbox: Boolean(sar.sandbox),
          amount: monto,
          nrofactura: factura.nrofactura,
          solicitadoPor: currentUser,
        },
      }),
    );

    this.logger.log(
      `Link de pago generado: factura=${facturaId} op=${sar.operationId} monto=${monto} sandbox=${Boolean(sar.sandbox)}`,
    );

    return {
      transaccionId: tx.id,
      url: sar.url,
      publicRequestKey: sar.publicRequestKey,
      operationId: sar.operationId,
      sandbox: Boolean(sar.sandbox),
      monto,
      status: tx.status as string,
    };
  }

  /**
   * GET /todopago/status/:operationId
   * Devuelve la transacción de BD (fuente de verdad). En modo real y si está
   * pending, sincroniza contra el gateway y actualiza.
   */
  async consultarStatus(operationId: string) {
    const tx = await this.tpRepo.findOne({ where: { operationId } });
    if (!tx) throw new NotFoundException(`Transacción ${operationId} no encontrada`);

    if (tx.status === 'pending') {
      // Expiración local: link vencido (TTL) → 'expired' sin consultar el gateway
      const edadMs = Date.now() - new Date(tx.fechaCreacion).getTime();
      if (edadMs > TTL_LINK_HORAS * 3600 * 1000) {
        tx.status = 'expired';
        await this.tpRepo.save(tx);
        return this.mapTx(tx);
      }

      const estadoGateway = await this.consultarGateway(operationId);
      if (estadoGateway && estadoGateway !== tx.status) {
        if (estadoGateway === 'completed') {
          return this.aplicarConfirmacion(tx, { status: 'completed', sandbox: false }, 'gateway');
        }
        tx.status = estadoGateway as TransaccionPago['status'];
        await this.tpRepo.save(tx);
      }
    }
    return this.mapTx(tx);
  }

  /** GET /todopago/transacciones/:facturaId — historial de la factura */
  async listarTransacciones(facturaId: number) {
    const filas = await this.tpRepo.find({
      where: { facturaid: facturaId },
      order: { id: 'DESC' },
    });
    return filas.map((f) => this.mapTx(f));
  }

  /** Pasa a 'expired' todo link pendiente con más de TTL_LINK_HORAS de creado (lazy, idempotente). */
  private async expirarLinksVencidos(): Promise<void> {
    await this.tpRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'expired' as TransaccionPago['status'] })
      .where('status = :st', { st: 'pending' })
      .andWhere('fecha_creacion < NOW() - INTERVAL ' + TTL_LINK_HORAS + ' HOUR')
      .execute();
  }

  /**
   * GET /todopago/links-pendientes — links de pago pendientes (para pantalla TodoPago).
   * Aplica expiración local de 48h antes de listar y enriquece con datos de la factura.
   * Filtra por empresaId (transacciones_pago no tiene la columna; se filtra vía posfacmae).
   */
  async listarLinksPendientes(empresaId?: number) {
    await this.expirarLinksVencidos();

    const pendientes = await this.tpRepo.find({
      where: { status: 'pending' },
      order: { fechaCreacion: 'DESC' },
    });
    if (pendientes.length === 0) return [];

    const facturaIds = [...new Set(pendientes.map((p) => p.facturaid))];
    const facturas = await this.facMaeRepo.find({ where: { facturaId: In(facturaIds) } });
    const porId = new Map(facturas.map((f) => [f.facturaId, f]));

    const filas = pendientes.map((tx) => {
      const fac = porId.get(tx.facturaid);
      return {
        ...this.mapTx(tx),
        nrofactura: (tx.rawRequest as any)?.nrofactura ?? fac?.nrofactura ?? null,
        nombrecliente: fac?.nombrecliente ?? null,
        totalFactura: fac ? Number(fac.total) : null,
        empresaId: fac ? Number(fac.empresaId) : null,
        snPagada: fac?.sn_pagada ?? null,
        snAnulada: fac?.sn_anulada ?? null,
      };
    });

    return empresaId ? filas.filter((f) => f.empresaId === empresaId) : filas;
  }

  /**
   * POST /todopago/confirmar — callback público (URL_OK / sandbox).
   * Idempotente: si la transacción ya está completed, no re-aplica.
   */
  async confirmarPago(dto: ConfirmarPagoDto) {
    const key = dto.PublicRequestKey;
    let tx = await this.tpRepo.findOne({ where: { publicRequestKey: key } });
    if (!tx && dto.Order) {
      tx = await this.tpRepo.findOne({ where: { operationId: dto.Order } });
    }
    if (!tx) throw new NotFoundException('Transacción no encontrada');

    if (tx.status === 'completed') {
      this.logger.log(`confirmar: transacción ${tx.operationId} ya estaba completada (idempotente)`);
      return { ...this.mapTx(tx), alreadyProcessed: true };
    }

    const gaa = await this.getAuthorizeAnswer({
      publicRequestKey: tx.publicRequestKey || key,
      answerKey: dto.AnswerKey,
    });

    return this.aplicarConfirmacion(tx, gaa, 'confirmar');
  }

  /**
   * POST /todopago/webhook — notificación servidor a servidor.
   */
  async webhook(dto: WebhookDto) {
    const tx = await this.tpRepo.findOne({ where: { operationId: dto.OPERATIONID } });
    if (!tx) throw new NotFoundException('Transacción no encontrada');

    if (tx.status === 'completed') {
      return { ...this.mapTx(tx), alreadyProcessed: true };
    }

    const estado = await this.consultarGateway(dto.OPERATIONID);
    if (!estado) return { ...this.mapTx(tx), estado: 'sin-cambios' };

    if (estado === 'completed') {
      return this.aplicarConfirmacion(tx, { status: 'completed', sandbox: false }, 'webhook');
    }
    tx.status = estado as TransaccionPago['status'];
    await this.tpRepo.save(tx);
    return this.mapTx(tx);
  }

  // ═══════════════════ CONFIRMACIÓN (transacción + factura + caja) ═══════════════════

  /**
   * Aplica el resultado confirmado (decisión del usuario, "todo"):
   *  1. transacciones_pago → completed + fecha_confirmacion + raw_response
   *  2. posfacmae          → sn_pagada='S'
   *  3. posfaccaja         → fila del link (formapagoId=6), idempotente
   */
  private async aplicarConfirmacion(
    tx: TransaccionPago,
    gaa: ResultadoGaa,
    origen: string,
  ) {
    // 1. Transacción
    tx.status = 'completed';
    tx.fechaConfirmacion = await this.fechaSistema.getFecha(2);
    tx.rawResponse = { ...gaa, origen, confirmadoEn: new Date().toISOString() } as any;
    await this.tpRepo.save(tx);

    // 2 y 3. Factura + caja
    const factura = await this.facMaeRepo.findOne({ where: { facturaId: tx.facturaid } });
    if (!factura) {
      this.logger.warn(`confirmar: factura ${tx.facturaid} no existe (transacción ${tx.operationId})`);
      return { ...this.mapTx(tx), factura: 'no-encontrada' };
    }
    if (factura.sn_anulada === 'S') {
      this.logger.warn(`confirmar: factura ${factura.facturaId} anulada — no se registra caja`);
      return { ...this.mapTx(tx), factura: 'anulada' };
    }

    const monto = Number(tx.monto) || 0;

    // 3. posfaccaja idempotente (solo 1 fila de link por factura)
    const existeCaja = await this.facCajaRepo.findOne({
      where: { facturaId: factura.facturaId, formapagoId: FORMAPAGO_TODOPAGO },
    });
    if (!existeCaja) {
      await this.facCajaRepo.save(
        this.facCajaRepo.create({
          facturaId: factura.facturaId,
          formapagoId: FORMAPAGO_TODOPAGO,
          nroautorizacion: tx.operationId.slice(0, 20),
          factordecambio: Number(factura.factordecambio) || 1,
          importe_efectivo: 0,
          importe_otros: monto,
          importe_cambio: 0,
          cajaId: Number(factura.cajaId) || 1,
          sn_anulado: 'N',
          Idsucursal: factura.Idsucursal,
          empresaId: Number(factura.empresaId),
          usuarioCreated: (factura.usuarioCreated || 'SISTEMA').slice(0, 20),
        }),
      );
      this.logger.log(
        `[${origen}] posfaccaja creada: factura=${factura.facturaId} importe_otros=${monto}`,
      );
    } else {
      this.logger.log(`[${origen}] posfaccaja link ya existía (idempotente)`);
    }

    // 2. Factura pagada
    if (factura.sn_pagada !== 'S') {
      await this.facMaeRepo
        .createQueryBuilder()
        .update()
        .set({
          sn_pagada: 'S',
          usuarioUpdated: (factura.usuarioCreated || 'SISTEMA').slice(0, 20),
          fechaUpdated: await this.fechaSistema.getFecha(Number(factura.empresaId)),
        })
        .where('facturaId = :id', { id: factura.facturaId })
        .execute();
      this.logger.log(`[${origen}] posfacmae ${factura.facturaId} → sn_pagada='S'`);
    }

    // 2b. Si la factura provino de un pedido (checkout), el pedido también
    //     queda pagado — coherencia con el estado de la lista de pedidos.
    try {
      const pedido = await this.pedMaeRepo.findOne({ where: { facturaId: factura.facturaId } as any });
      if (pedido && pedido.sn_pagada !== 'S') {
        await this.pedMaeRepo
          .createQueryBuilder()
          .update()
          .set({
            sn_pagada: 'S',
            usuarioUpdated: (factura.usuarioCreated || 'SISTEMA').slice(0, 20),
            fechaUpdated: await this.fechaSistema.getFecha(Number(factura.empresaId)),
          })
          .where('pospedmaeId = :id', { id: pedido.pospedmaeId })
          .execute();
        this.logger.log(`[${origen}] pospedmae ${pedido.pospedmaeId} → sn_pagada='S'`);
      }
    } catch (err) {
      this.logger.warn(`[${origen}] no se pudo actualizar el pedido: ${err}`);
    }

    return {
      ...this.mapTx(tx),
      alreadyProcessed: false,
      facturaId: factura.facturaId,
      nrofactura: factura.nrofactura,
    };
  }

  private mapTx(tx: TransaccionPago) {
    const raw = (tx.rawRequest || {}) as Record<string, any>;
    return {
      id: tx.id,
      facturaid: tx.facturaid,
      operation_id: tx.operationId,
      public_request_key: tx.publicRequestKey,
      status: tx.status,
      monto: Number(tx.monto),
      metodo: tx.metodo,
      fecha_creacion: tx.fechaCreacion,
      fecha_confirmacion: tx.fechaConfirmacion,
      url: raw.url || null,
      sandbox: Boolean(raw.sandbox),
    };
  }
}
