import { Injectable } from '@nestjs/common';
import { BitacoraRepository, NuevoAcceso } from '../datos/repositorios/bitacora.repository';
import type { Contexto } from '../auth/decoradores';
import { AccionBitacora, ConsultarBitacoraDto } from './bitacora.dto';
import { dentroDeRetencion, RETENCION_ACCESOS_DIAS, RETENCION_OPERACIONES_DIAS } from './retencion';

export interface Operacion {
  entidad: string; entidadId: number; folio: string; accion: AccionBitacora; anterior?: unknown; nuevo?: unknown;
}

// hu_15: bitacora de solo agregar, aqui solo hay metodos para registrar y consultar
@Injectable()
export class BitacoraService {
  constructor(private readonly repo: BitacoraRepository) {}

  registrarAcceso(datos: NuevoAcceso) {
    return this.repo.agregarAcceso(datos);
  }

  registrarOperacion(ctx: Contexto, op: Operacion) {
    return this.repo.agregarOperacion({
      entidad: op.entidad, entidad_id: op.entidadId, folio: op.folio, accion: op.accion, usuario_id: ctx.usuario.id,
      // el valor anterior y el nuevo se guardan juntos como json, igual que la columna detalle en sql
      detalle: JSON.stringify({ anterior: op.anterior ?? null, nuevo: op.nuevo ?? null }),
      ip: ctx.ip, zona_horaria: ctx.zonaHoraria,
    });
  }

  async consultar(f: ConsultarBitacoraDto, ahora: Date = new Date()) {
    const desde = f.desde ? new Date(`${f.desde}T00:00:00.000Z`) : null;
    const hasta = f.hasta ? new Date(`${f.hasta}T23:59:59.999Z`) : null;
    const coincide = (r: { usuario_id: number | null; fecha: Date }) =>
      (!f.usuarioId || r.usuario_id === f.usuarioId) && (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta);

    // los registros fuera de retencion ya no se muestran en linea
    const operaciones = (await this.repo.listarOperaciones()).filter((b) =>
      dentroDeRetencion(b.fecha, RETENCION_OPERACIONES_DIAS, ahora) && coincide(b)
      && (!f.accion || b.accion === f.accion)
      && (!f.folio || (b.folio ?? '').toUpperCase().includes(f.folio.trim().toUpperCase())));
    const accesos = (await this.repo.listarAccesos()).filter((h) =>
      dentroDeRetencion(h.fecha, RETENCION_ACCESOS_DIAS, ahora) && coincide(h));

    const pagina = f.pagina ?? 1;
    const limite = f.limite ?? 100;
    const inicio = (pagina - 1) * limite;
    return {
      operaciones: operaciones.slice(inicio, inicio + limite),
      accesos: accesos.slice(inicio, inicio + limite),
      pagina, limite,
      totales: { operaciones: operaciones.length, accesos: accesos.length },
    };
  }
}
