import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlPlEmpleados } from './entities/plplempleados.entity';
import { PlEtits } from './entities/pletitulaciones.entity';
import { PlAsistencia } from './entities/pleasistencia.entity';
import { PlCertificaciones } from './entities/plecertificaciones.entity';
import { PlComisiones } from './entities/plecomisiones.entity';
import { PlDeducciones } from './entities/plededucciones.entity';
import { PlPlaMae } from './entities/pleplamae.entity';
import { PlPlaDet } from './entities/plepladet.entity';
import { TplPuestos } from './entities/tplpuestos.entity';
import { TplProfesiones } from './entities/tplprofesiones.entity';
import { TplDeducciones } from './entities/tpldeducciones.entity';
import { TplIngresos } from './entities/tplingresos.entity';
import { TipoParametro } from '../parametros/entities/tipo-parametro.entity';
import { PlanillaService } from './planilla.service';
import { PlanillaController } from './planilla.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlPlEmpleados,
      PlEtits,
      PlAsistencia,
      PlCertificaciones,
      PlComisiones,
      PlDeducciones,
      PlPlaMae,
      PlPlaDet,
      TplPuestos,
      TplProfesiones,
      TplDeducciones,
      TplIngresos,
      TipoParametro,
    ]),
  ],
  controllers: [PlanillaController],
  providers: [PlanillaService],
  exports: [PlanillaService],
})
export class PlanillaModule {}
