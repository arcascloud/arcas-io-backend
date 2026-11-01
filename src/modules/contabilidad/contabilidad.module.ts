import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Coctacontables } from './entities/coctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Coctasaldos } from './entities/coctasaldos.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Cocierredet } from './entities/cocierredet.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Ttipofactordecambios } from './entities/ttipofactordecambios.entity';
import { Tcoplantillabalancesmae } from './entities/tcoplantillabalancesmae.entity';
import { Tcoplantillabalancesdet } from './entities/tcoplantillabalancesdet.entity';
import { Tcorepdiarios } from './entities/tcorepdiarios.entity';
import { Tcorepbalances } from './entities/tcorepbalances.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Coctamov } from './entities/coctamov.entity';
import { Tconivelcta } from './entities/tconivelcta.entity';
import { Tconaturalezacta } from './entities/tconaturalezacta.entity';
import { Tcoimpuestovecinal } from './entities/tcoimpuestovecinal.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
import { Tcocarteras } from './entities/tcocarteras.entity';
import { Tcoisr } from './entities/tcoisr.entity';
// Roles de usuario para autorizaciones de cuentas contables (sn_operable / historial)
import { UsersModule } from '../users/users.module';
// Repos de otros módulos necesarios para integración automática
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { TPosFacDet } from '../facturacion/entities/posfacdet.entity';
import { TPosFacCaja } from '../facturacion/entities/posfaccaja.entity';
import { Posfacmov } from '../facturacion/entities/posfacmov.entity';
import { TinvExistencia } from '../inventario/entities/existencia.entity';
import { CxcMovimiento } from '../cxc/entities/cxcmovimiento.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { TCxpCompraMae } from '../cxp/entities/compra-mae.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TbcoMovimiento } from '../bancos/entities/bco-movimiento.entity';
import { Tempresas } from '../companies/entities/empresa.entity';
// Trazabilidad (central de transacciones) + catálogos referenciados por sus FK
import { Trasaviblidad } from './entities/trasaviblidad.entity';
import { Tmodulos } from '../modules/entities/modulo.entity';
import { Tsucursal } from '../sucursales/entities/sucursal.entity';
import { Tusuarios } from '../users/entities/usuario.entity';
import { ContabilidadService } from './contabilidad.service';
import { ContabilidadLogicaService } from './contabilidad-logica.service';
import { DashboardService } from './dashboard.service';
import { ContabilidadController } from './contabilidad.controller';
import { TrasaviblidadService } from './trasaviblidad.service';
import { TrasaviblidadController } from './trasaviblidad.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    UsersModule,
    TypeOrmModule.forFeature([
      Coctacontables,
      Tcogrupocontable,
      Tcoplantillapdamae,
      Tcoplantillapdadet,
      Coctasaldos,
      Cocierrectable,
      Cocierredet,
      Tcorepliquidez,
      Ttipofactordecambios,
      Tcoplantillabalancesmae,
      Tcoplantillabalancesdet,
      Tcorepdiarios,
      Tcorepbalances,
      Coperiodoctable,
      Copdamae,
      Copdadet,
      Coctamov,
      Tconivelcta,
      Tconaturalezacta,
      Tcoimpuestovecinal,
      TCoTipoDocumentoFiscal,
      Tcocarteras,
      Tcoisr,
      // Repos para integración automática de facturación
      TipoParametro,
      TPosFacMae,
      TPosFacDet,
      TPosFacCaja,
      Posfacmov,
      TinvExistencia,
      CxcMovimiento,
      TCxpMovimiento,
      TCxpCompraMae,
      Tproducto,
      TbcoMovimiento,
      Tempresas,
      // Trazabilidad
      Trasaviblidad,
      Tmodulos,
      Tsucursal,
      Tusuarios,
    ]),
  ],
  controllers: [ContabilidadController, TrasaviblidadController],
  providers: [ContabilidadService, ContabilidadLogicaService, DashboardService, TrasaviblidadService],
  exports: [ContabilidadService, ContabilidadLogicaService, DashboardService, TrasaviblidadService],
})
export class ContabilidadModule {}
