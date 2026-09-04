import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tcoctacontables } from './entities/tcoctacontables.entity';
import { Tcogrupocontable } from './entities/tcogrupocontable.entity';
import { Tcoplantillapdamae } from './entities/tcoplantillapdamae.entity';
import { Tcoplantillapdadet } from './entities/tcoplantillapdadet.entity';
import { Cosaldoscta } from './entities/cosaldoscta.entity';
import { Cocierrectable } from './entities/cocierrectable.entity';
import { Tcorepliquidez } from './entities/tcorepliquidez.entity';
import { Cofactordecambios } from './entities/cofactordecambios.entity';
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
import { ContabilidadService } from './contabilidad.service';
import { ContabilidadController } from './contabilidad.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tcoctacontables,
      Tcogrupocontable,
      Tcoplantillapdamae,
      Tcoplantillapdadet,
      Cosaldoscta,
      Cocierrectable,
      Tcorepliquidez,
      Cofactordecambios,
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
    ]),
  ],
  controllers: [ContabilidadController],
  providers: [ContabilidadService],
  exports: [ContabilidadService],
})
export class ContabilidadModule {}
