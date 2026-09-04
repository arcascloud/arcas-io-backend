import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Tproducto } from './entities/producto.entity';
import { TinvCategoria } from './entities/categoria.entity';
import { TinvMarca } from './entities/marca.entity';
import { TinvModelo } from './entities/modelo.entity';
import { TinvColor } from './entities/color.entity';
import { TinvUnidadMedida } from './entities/unidad-medida.entity';
import { TinvEmbalaje } from './entities/embalaje.entity';
import { TinvBodega } from './entities/bodega.entity';
import { TinvUbicacion } from './entities/ubicacion.entity';
import { TinvPasillo } from './entities/pasillo.entity';
import { TinvCasa } from './entities/casa.entity';
import { TinvTestante } from './entities/testante.entity';
import { TinvTag } from './entities/tag.entity';
import { Tproveedor } from './entities/proveedor.entity';
import { TinvExistencia } from './entities/existencia.entity';
import { TinvKardex } from './entities/kardex.entity';
import { TproductoCodBarra } from './entities/producto-codbarra.entity';
import { TproductoDet } from './entities/producto-det.entity';
import { TproductoImg } from './entities/producto-img.entity';
import { TInvFisMae } from './entities/invfismae.entity';
import { TInvFisDet } from './entities/invfisdet.entity';
import { TInvMovMae } from './entities/invmovmae.entity';
import { TInvMovDet } from './entities/invmovdet.entity';
import { TInvReqMae } from './entities/invreqmae.entity';
import { TInvReqDet } from './entities/invreqdet.entity';
import { TInvTrasladoMae } from './entities/invtrasladomae.entity';
import { TInvTrasladoDet } from './entities/invtrasladodet.entity';
import { InventarioService } from './inventario.service';
import { KardexService } from './kardex.service';
import { TomaInventarioService } from './toma-inventario.service';
import { AjusteInventarioService } from './ajuste-inventario.service';
import { RequisicionInventarioService } from './requisicion-inventario.service';
import { TrasladoInventarioService } from './traslado-inventario.service';
import { InventarioController } from './inventario.controller';
import { TomaInventarioController } from './toma-inventario.controller';
import { AjusteInventarioController } from './ajuste-inventario.controller';
import { RequisicionInventarioController } from './requisicion-inventario.controller';
import { TrasladoInventarioController } from './traslado-inventario.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([
      Tproducto,
      TinvCategoria,
      TinvMarca,
      TinvModelo,
      TinvColor,
      TinvUnidadMedida,
      TinvEmbalaje,
      TinvBodega,
      TinvUbicacion,
      TinvPasillo,
      TinvCasa,
      TinvTestante,
      TinvTag,
      Tproveedor,
      TinvExistencia,
      TinvKardex,
      TproductoCodBarra,
      TproductoDet,
      TproductoImg,
      TInvFisMae,
      TInvFisDet,
      TInvMovMae,
      TInvMovDet,
      TInvReqMae,
      TInvReqDet,
      TInvTrasladoMae,
      TInvTrasladoDet,
    ]),
  ],
  controllers: [InventarioController, TomaInventarioController, AjusteInventarioController, RequisicionInventarioController, TrasladoInventarioController],
  providers: [InventarioService, KardexService, TomaInventarioService, AjusteInventarioService, RequisicionInventarioService, TrasladoInventarioService],
  exports: [InventarioService, KardexService, TomaInventarioService, AjusteInventarioService, RequisicionInventarioService, TrasladoInventarioService],
})
export class InventarioModule {}
