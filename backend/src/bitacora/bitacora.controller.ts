import { Controller, Get, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decoradores';
import { BitacoraService } from './bitacora.service';
import { ConsultarBitacoraDto } from './bitacora.dto';

@ApiTags('HU_15 · Bitácora')
@ApiHeader({ name: 'X-Usuario-Id', required: true })
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacora: BitacoraService) {}

  @Get()
  @Roles('director', 'gerente', 'admin')
  @ApiOperation({ summary: 'Operaciones (90 días) y accesos (30 días), con filtros y paginación' })
  consultar(@Query() filtros: ConsultarBitacoraDto) {
    return this.bitacora.consultar(filtros);
  }
}
