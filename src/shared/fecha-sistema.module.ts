import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tempresas } from '../modules/companies/entities/empresa.entity';
import { FechaSistemaService } from './fecha-sistema.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Tempresas])],
  providers: [FechaSistemaService],
  exports: [FechaSistemaService],
})
export class FechaSistemaModule {}
