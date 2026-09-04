import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TtipoMoneda } from './entities/moneda.entity';
import { TtipoPais } from './entities/pais.entity';
import { TtipoDeptoPais } from './entities/depto-pais.entity';
import { TtipoDeptoEmpresa } from './entities/depto-empresa.entity';
import { TtipoDireccion } from './entities/direccion.entity';
import { TtipoEstado } from './entities/estado.entity';
import { TtipoFormaPago } from './entities/forma-pago.entity';
import { TtipoTelefono } from './entities/telefono.entity';
import { TtipoTarjetaCredito } from './entities/tarjeta-credito.entity';
import { TtipoPasatiempo } from './entities/pasatiempo.entity';
import { TtipoZona } from './entities/zona.entity';
import { TtipoGestor } from './entities/gestor.entity';
import { TtipoImpuesto } from './entities/impuesto.entity';
import { TtipoProforma } from './entities/proforma.entity';
import { TtipoZonaVtaCob } from './entities/zona-vta-cob.entity';
import { TtipoParamBco } from './entities/param-bco.entity';
import { TtipoParamCon } from './entities/param-con.entity';
import { TtipoParamCxc } from './entities/param-cxc.entity';
import { TtipoParamCxp } from './entities/param-cxp.entity';
import { TtipoParamFac } from './entities/param-fac.entity';
import { TtipoParamInv } from './entities/param-inv.entity';
import { TtipoParamPap } from './entities/param-pap.entity';
import { TtipoParamPla } from './entities/param-pla.entity';
import { TtipoParamPres } from './entities/param-pres.entity';
import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlPlEmpleados } from '../planilla/entities/plplempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { ParametrosService } from './parametros.service';
import { ParametrosController } from './parametros.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TtipoMoneda,
      TtipoPais,
      TtipoDeptoPais,
      TtipoDeptoEmpresa,
      TtipoDireccion,
      TtipoEstado,
      TtipoFormaPago,
      TtipoTelefono,
      TtipoTarjetaCredito,
      TtipoPasatiempo,
      TtipoZona,
      TtipoGestor,
      TtipoImpuesto,
      TtipoProforma,
      TtipoZonaVtaCob,
      TtipoParamBco,
      TtipoParamCon,
      TtipoParamCxc,
      TtipoParamCxp,
      TtipoParamFac,
      TtipoParamInv,
      TtipoParamPap,
      TtipoParamPla,
      TtipoParamPres,
      TCoTipoDocumentoFiscal,
      PlPlEmpleados,
      TPosPrecioVtas,
    ]),
  ],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule {}
