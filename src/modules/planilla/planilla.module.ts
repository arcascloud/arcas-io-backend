import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlEmpleados } from './entities/plempleados.entity';
import { PlEtits } from './entities/pletitulaciones.entity';
import { PlAsistencia } from './entities/pleasistencia.entity';
import { PlCertificaciones } from './entities/plecertificaciones.entity';
import { PlIngresos } from './entities/pleingresos.entity';
import { PlAuthoraExMae } from './entities/pleauthoraexmae.entity';
import { PlAuthoraExDet } from './entities/pleauthoraexdet.entity';
import { PlDeducciones } from './entities/plededucciones.entity';
import { PlPlaMae } from './entities/pleplamae.entity';
import { PlPlaDet } from './entities/plepladet.entity';
import { TplPuestos } from './entities/tplpuestos.entity';
import { TplProfesiones } from './entities/tplprofesiones.entity';
import { TplTipoMov } from './entities/tpltipomov.entity';
import { PlTipoMov } from './entities/pletipomov.entity';
import { TplIngresos } from './entities/tplingresos.entity';
import { TplTipoEmpleado } from './entities/tpltipoempleado.entity';
import { TplHorasExtra } from './entities/tplhorasextras.entity';
import { TplComision } from './entities/tplcomision.entity';
import { TplDepto } from './entities/pldeptos.entity';
import { TMes } from './entities/tmeses.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { Tcoisr } from '../contabilidad/entities/tcoisr.entity';
import { Tcoimpuestovecinal } from '../contabilidad/entities/tcoimpuestovecinal.entity';
import { Coperiodoctable } from '../contabilidad/entities/coperiodoctable.entity';
import { TbcoMovimiento } from '../bancos/entities/bco-movimiento.entity';
// Partida contable del pago de planilla (PDA 21): `crearPartidaPlanilla`
import { ContabilidadModule } from '../contabilidad/contabilidad.module';
import { PlanillaService } from './planilla.service';
import { PlanillaController } from './planilla.controller';

@Module({
  imports: [
    ContabilidadModule,
    TypeOrmModule.forFeature([
      PlEmpleados,
      PlEtits,
      PlAsistencia,
      PlCertificaciones,
      PlIngresos,
      PlAuthoraExMae,
      PlAuthoraExDet,
      PlDeducciones,
      PlPlaMae,
      PlPlaDet,
      TplPuestos,
      TplProfesiones,
      TplTipoMov,
      PlTipoMov,
      TplIngresos,
      TplTipoEmpleado,
      TplHorasExtra,
      TplComision,
      TplDepto,
      TMes,
      TipoParametro,
      Tcoisr,
      Tcoimpuestovecinal,
      Coperiodoctable,
      TbcoMovimiento,
    ]),
  ],
  controllers: [PlanillaController],
  providers: [PlanillaService],
  exports: [PlanillaService],
})
export class PlanillaModule {}
