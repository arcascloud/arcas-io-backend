import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { cargarEnvTodoPago } from './modules/todopago/todopago.env';

/**
 * Límite del cuerpo de la petición (JSON / urlencoded / raw / text).
 *
 * El default de Express es 100 KB, y el ERP sube imágenes de productos en
 * base64 y fotos para el OCR que pesan varios megas: esas peticiones se
 * rechazaban con `PayloadTooLargeError: entity.too.large` (413).
 */
const BODY_LIMIT = '15mb';

async function bootstrap() {
  // `bodyParser: false` desinstala los parsers por defecto (100 KB) para que
  // podamos registrar los mismos con el límite ampliado. Si no, Express los
  // instala antes que nosotros y el primer parser se queda con el stream.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Variables TODOPAGO_*/PUBLIC_URL del .env — DESPUÉS de crear la app para no
  // alterar el secreto JWT (JwtModule/JwtStrategy ya capturaron el suyo).
  cargarEnvTodoPago();

  app.use(cookieParser());
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
  app.use(express.raw({ limit: BODY_LIMIT }));
  app.use(express.text({ limit: BODY_LIMIT }));

  // Render (y la mayoría de PaaS) terminan TLS en un proxy delante del
  // proceso Node. Sin trust proxy, req.secure es false aunque la petición
  // llegue por HTTPS — y eso rompe la cookie SameSite=None (exige Secure).
  (app as any).set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        'http://localhost:4200',
        'http://localhost:3000',
        'https://hn.arcas-io.workers.dev',
      ];
      if (
        allowed.includes(origin) ||
        origin.endsWith('.arcas-io.workers.dev') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Arcas ERP API')
    .setDescription('API del sistema ERP Arcas — Honduras')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y login')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag('Módulos', 'Módulos del sistema')
    .addTag('Empresas', 'Gestión de empresas')
    .addTag('Sucursales', 'Gestión de sucursales')
    .addTag('Parámetros', 'Catálogos del sistema')
    .addTag('Inventario', 'Productos, bodegas, kardex')
    .addTag('Facturación', 'Facturas, cotizaciones, pedidos')
    .addTag('CxC', 'Cuentas por cobrar — clientes, caja, movimientos')
    .addTag('CxP', 'Cuentas por pagar — proveedores, compras')
    .addTag('Bancos', 'Cuentas y movimientos bancarios')
    .addTag('Contabilidad', 'Plan de cuentas, comprobantes, saldos')
    .addTag('Planilla', 'Empleados, deducciones, planillas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Arcas Backend corriendo en http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();

