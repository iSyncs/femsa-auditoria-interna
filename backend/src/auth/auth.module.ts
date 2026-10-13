import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SesionGuard } from './sesion.guard';
import { AccesoService } from './acceso.service';

@Global()
@Module({
  providers: [AccesoService, { provide: APP_GUARD, useClass: SesionGuard }],
  exports: [AccesoService],
})
export class AuthModule {}
