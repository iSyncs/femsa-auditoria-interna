import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Publico } from '../auth/decoradores';
import { BitacoraService } from '../bitacora/bitacora.service';
import { verificarContrasena } from '../common/utils/contrasena';
import { CUENTA_DEMO } from '../datos/memoria/datos-demo';
import { EstadoDatos } from '../datos/repositorios/estado-datos';
import { CatalogosRepository, UsuariosRepository } from '../datos/repositorios/usuarios.repository';
import { IniciarSesionDto } from './sistema.dto';

@ApiTags('Sistema y sesión (HU_01)')
@Controller()
export class SistemaController {
  constructor(
    private readonly estadoDatos: EstadoDatos,
    private readonly usuarios: UsuariosRepository,
    private readonly catalogos: CatalogosRepository,
    private readonly bitacora: BitacoraService,
  ) {}

  @Publico()
  @Get('health')
  @ApiOperation({ summary: 'Estado de la API y de la fuente de datos' })
  async health() {
    const inicio = performance.now();
    try {
      const info = await this.estadoDatos.estado();
      return {
        ok: true, motor: info.motor, servidor: 'NestJS', base: info.base, edicion: info.edicion,
        version: process.env.npm_package_version ?? '3.0.0', tablas_aud: info.tablas, hora_utc: new Date().toISOString(),
        latenciaMs: Math.round(performance.now() - inicio),
      };
    } catch (e) {
      return { ok: false, error: `Sin conexión con la base de datos: ${(e as Error).message}` };
    }
  }

  @Get('usuarios')
  @ApiOperation({ summary: 'Usuarios activos (requiere sesión)' })
  listarUsuarios() {
    return this.usuarios.listarActivos();
  }

  @Publico()
  @Post('sesion')
  @ApiOperation({ summary: 'Inicio de sesión con correo y contraseña (hasta integrar Entra ID)' })
  async iniciar(@Body() dto: IniciarSesionDto, @Req() req: Request) {
    const cred = await this.usuarios.credencial(dto.correo);
    const valido = !!cred && verificarContrasena(dto.contrasena, cred.contrasena_hash);
    const u = valido ? await this.usuarios.buscarActivo(cred.id) : null;
    // hu_15: cada intento de inicio de sesion queda en la bitacora, exitoso o no
    await this.bitacora.registrarAcceso({ usuario_id: u?.id ?? null, correo: dto.correo.trim().toLowerCase(), resultado: u ? 'exito' : 'fallo', ip: req.ip ?? null, agente: req.get('user-agent') ?? null, zona_horaria: dto.zonaHoraria ?? u?.zona_horaria ?? null });
    if (!u) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    return u;
  }

  @Publico()
  @Post('sesion/demo')
  @ApiOperation({ summary: 'Sesión automática con la cuenta de demostración (mientras no haya inicio de sesión)' })
  async sesionDemo(@Req() req: Request) {
    const cred = await this.usuarios.credencial(CUENTA_DEMO.correo);
    const u = cred ? await this.usuarios.buscarActivo(cred.id) : null;
    if (!u) throw new UnauthorizedException('La cuenta de demostración no está disponible.');
    await this.bitacora.registrarAcceso({ usuario_id: u.id, correo: u.correo, resultado: 'exito', ip: req.ip ?? null, agente: req.get('user-agent') ?? null, zona_horaria: req.get('X-Zona-Horaria') ?? u.zona_horaria });
    return u;
  }

  @Get('catalogos')
  @ApiOperation({ summary: 'Unidades de negocio y controles con su riesgo' })
  async catalogosGenerales() {
    const [unidades, controles] = await Promise.all([this.catalogos.unidades(), this.catalogos.controles()]);
    return { unidades, controles };
  }
}
