import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'root.8',
      database: 'arcasdb',
      autoLoadEntities: true,
      synchronize: false,
    }),
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
  ],
})
export class AppModule {}
