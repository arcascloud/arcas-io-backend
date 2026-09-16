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

import { TCoTipoDocumentoFiscal } from '../contabilidad/entities/tcotipodocumentofiscal.entity';
import { PlPlEmpleados } from '../planilla/entities/plplempleados.entity';
import { TPosPrecioVtas } from '../facturacion/entities/tpospreciovtas.entity';
import { TipoParametro } from './entities/tipo-parametro.entity';
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
      TCoTipoDocumentoFiscal,
      PlPlEmpleados,
      TPosPrecioVtas,
      TipoParametro,
    ]),
  ],
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class ParametrosModule {}
