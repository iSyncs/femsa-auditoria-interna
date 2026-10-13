import { Injectable } from '@nestjs/common';
import { BaseDeDatosMemoria } from './base-de-datos-memoria';
import { BitacoraRepository, NuevaOperacion, NuevoAcceso } from '../repositorios/bitacora.repository';

@Injectable()
export class BitacoraMemoriaRepository extends BitacoraRepository {
  constructor(private readonly db: BaseDeDatosMemoria) { super(); }

  private nombre(usuarioId: number | null) {
    return this.db.usuarios.find((u) => u.id === usuarioId)?.nombre ?? null;
  }

  async agregarOperacion(datos: NuevaOperacion) {
    // la fecha se guarda en utc, como el default de la tabla en sql
    const registro = { id: this.db.siguienteId('bitacora'), ...datos, fecha: new Date() };
    this.db.bitacora.push(registro);
    return structuredClone(registro);
  }

  async agregarAcceso(datos: NuevoAcceso) {
    const registro = { id: this.db.siguienteId('accesos'), ...datos, fecha: new Date() };
    this.db.accesos.push(registro);
    return structuredClone(registro);
  }

  async listarOperaciones() {
    return this.db.bitacora
      .map((b) => ({ ...structuredClone(b), usuario: this.nombre(b.usuario_id) }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  async listarAccesos() {
    return this.db.accesos
      .map((h) => ({ ...structuredClone(h), usuario: this.nombre(h.usuario_id) }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }
}
