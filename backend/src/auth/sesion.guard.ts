import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuariosRepository } from '../datos/repositorios/usuarios.repository';
import { ES_PUBLICO, PeticionAutenticada, ROLES } from './decoradores';
import { prohibido } from '../common/errores';
import { BitacoraService } from '../bitacora/bitacora.service';
import type { ClaveRol } from '../datos/modelos';

/**
 * HU_01. Sesión simulada para desarrollo: el frontend envía el usuario elegido en X-Usuario-Id.
 * Al integrar Microsoft Entra ID sólo cambia `identificar()`: validar el JWT y mapear el correo al usuario.
 */
@Injectable()
export class SesionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly usuarios: UsuariosRepository, private readonly bitacora: BitacoraService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const objetivo = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, objetivo)) return true;

    const req = ctx.switchToHttp().getRequest<PeticionAutenticada>();
    const usuario = await this.identificar(req);
    req.usuario = usuario;
    req.zonaHoraria = req.get('X-Zona-Horaria') || usuario.zona_horaria;

    const roles = this.reflector.getAllAndOverride<ClaveRol[] | undefined>(ROLES, objetivo);
    if (roles?.length && !roles.includes(usuario.rol)) {
      // hu_15: el intento de entrar a una ruta sin el rol se registra como acceso denegado
      await this.bitacora.registrarAcceso({ usuario_id: usuario.id, correo: usuario.correo, resultado: 'denegado', ip: req.ip ?? null, agente: req.get('user-agent') ?? null, zona_horaria: req.zonaHoraria });
      throw prohibido();
    }
    return true;
  }

  private async identificar(req: PeticionAutenticada) {
    const id = Number(req.get('X-Usuario-Id'));
    if (!Number.isInteger(id) || id <= 0) throw new UnauthorizedException('Sesión no iniciada.');
    const usuario = await this.usuarios.buscarActivo(id);
    if (!usuario) throw new UnauthorizedException('Usuario no válido o inactivo.');
    return usuario;
  }
}
