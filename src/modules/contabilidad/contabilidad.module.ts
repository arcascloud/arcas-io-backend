import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Tcoctacontables } from './entities/tcoctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Cosaldoscta } from './entities/cosaldoscta.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Ttipofactordecambios } from './entities/ttipofactordecambios.entity';
import { Tcoplantillabalancesmae } from './entities/tcoplantillabalancesmae.entity';
import { Tcoplantillabalancesdet } from './entities/tcoplantillabalancesdet.entity';
import { Tcorepdiarios } from './entities/tcorepdiarios.entity';
import { Tcorepbalances } from './entities/tcorepbalances.entity';
import { Coperiodoctable } from './entities/coperiodoctable.entity';
import { Copdamae } from './entities/copdamae.entity';
import { Copdadet } from './entities/copdadet.entity';
import { Comovcta } from './entities/comovcta.entity';
import { Tconivelcta } from './entities/tconivelcta.entity';
import { Tconaturalezacta } from './entities/tconaturalezacta.entity';
import { Tcoimpuestovecinal } from './entities/tcoimpuestovecinal.entity';
import { TCoTipoDocumentoFiscal } from './entities/tcotipodocumentofiscal.entity';
// Repos de otros módulos necesarios para integración automática
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { TPosFacDet } from '../facturacion/entities/posfacdet.entity';
import { TPosFacCaja } from '../facturacion/entities/posfaccaja.entity';
import { Posfacmov } from '../facturacion/entities/posfacmov.entity';
import { TinvExistencia } from '../inventario/entities/existencia.entity';
import { CxcMovimiento } from '../cxc/entities/cxcmovimiento.entity';
import { TCxpMovimiento } from '../cxp/entities/movimiento.entity';
import { Tproducto } from '../inventario/entities/producto.entity';
import { TbcoMovimiento } from '../bancos/entities/bco-movimiento.entity';
import { ContabilidadService } from './contabilidad.service';
import { ContabilidadLogicaService } from './contabilidad-logica.service';
import { ContabilidadController } from './contabilidad.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      Tcoctacontables,
      Tcogrupocontable,
      Tcoplantillapdamae,
      Tcoplantillapdadet,
      Cosaldoscta,
      Cocierrectable,
      Tcorepliquidez,
      Ttipofactordecambios,
      Tcoplantillabalancesmae,
      Tcoplantillabalancesdet,
      Tcorepdiarios,
      Tcorepbalances,
      Coperiodoctable,
      Copdamae,
      Copdadet,
      Comovcta,
      Tconivelcta,
      Tconaturalezacta,
      Tcoimpuestovecinal,
      TCoTipoDocumentoFiscal,
      // Repos para integración automática de facturación
      TipoParametro,
      TPosFacMae,
      TPosFacDet,
      TPosFacCaja,
      Posfacmov,
      TinvExistencia,
      CxcMovimiento,
      TCxpMovimiento,
      Tproducto,
      TbcoMovimiento,
    ]),
  ],
  controllers: [ContabilidadController],
  providers: [ContabilidadService, ContabilidadLogicaService],
  exports: [ContabilidadService, ContabilidadLogicaService],
})
export class ContabilidadModule {}
