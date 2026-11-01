import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodopagoController } from './todopago.controller';
import { TodopagoService } from './todopago.service';
import { TransaccionPago } from './entities/transaccion-pago.entity';
import { TPosFacMae } from '../facturacion/entities/posfacmae.entity';
import { TPosFacCaja } from '../facturacion/entities/posfaccaja.entity';
import { TPosPedMae } from '../facturacion/entities/pospedmae.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransaccionPago, TPosFacMae, TPosFacCaja, TPosPedMae])],
  controllers: [TodopagoController],
  providers: [TodopagoService],
  exports: [TodopagoService],
})
export class TodopagoModule {}
