import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FechaSistemaModule } from './shared/fecha-sistema.module';
import { CorrelativosModule } from './shared/correlativos.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { ModulosModule } from './modules/modules/modulos.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ParametrosModule } from './modules/parametros/parametros.module';
import { BancosModule } from './modules/bancos/bancos.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';
import { PlanillaModule } from './modules/planilla/planilla.module';
import { CxcModule } from './modules/cxc/cxc.module';
import { CxpModule } from './modules/cxp/cxp.module';
import { FacturacionModule } from './modules/facturacion/facturacion.module';
import { TodopagoModule } from './modules/todopago/todopago.module';
import { CxcMovimientoSubscriber } from './modules/cxc/entities/cxcmovimiento.subscriber';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || process.env.DB_HOST || '127.0.0.1',
        port: Number(configService.get<string>('DB_PORT') || process.env.DB_PORT || 3306),
        username: configService.get<string>('DB_USER') || process.env.DB_USER || 'root',
        password: configService.get<string>('DB_PASSWORD') || process.env.DB_PASSWORD || 'root.8',
        database: configService.get<string>('DB_NAME') || process.env.DB_NAME || 'arcasdb',
        autoLoadEntities: true,
        synchronize: false,
        subscribers: [CxcMovimientoSubscriber],
      }),
    }),
    FechaSistemaModule,
    CorrelativosModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    SucursalesModule,
    ModulosModule,
    InventarioModule,
    ParametrosModule,
    BancosModule,
    ContabilidadModule,
    PlanillaModule,
    CxcModule,
    CxpModule,
    FacturacionModule,
    TodopagoModule,
  ],
})
export class AppModule {}
