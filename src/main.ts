import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });
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
