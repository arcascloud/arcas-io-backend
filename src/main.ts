import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { cargarEnvTodoPago } from './modules/todopago/todopago.env';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Límite del cuerpo de la petición (JSON / urlencoded / raw / text).
 */
const BODY_LIMIT = '15mb';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (!corsOrigin || corsOrigin === '*') {
      throw new Error('CORS_ORIGIN is mandatory in production and cannot be *');
    }
  }

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  cargarEnvTodoPago();

  app.use(helmet());
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.use(cookieParser());
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
  app.use(express.raw({ limit: BODY_LIMIT }));
  app.use(express.text({ limit: BODY_LIMIT }));

  (app as any).set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const prodOrigin = process.env.CORS_ORIGIN;
      if (process.env.NODE_ENV === 'production' && prodOrigin) {
        if (origin === prodOrigin || prodOrigin.split(',').map(o => o.trim()).includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      }
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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

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
