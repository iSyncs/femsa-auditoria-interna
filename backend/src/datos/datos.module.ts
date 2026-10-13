import { Global, Injectable, Module } from '@nestjs/common';
import { BaseDeDatosMemoria } from './memoria/base-de-datos-memoria';
import {
  AuditoriasMemoriaRepository, CatalogosMemoriaRepository, CierreMemoriaRepository,
  HallazgosMemoriaRepository, PlanesMemoriaRepository, UsuariosMemoriaRepository,
} from './memoria/repositorios.memoria';
import { BitacoraMemoriaRepository } from './memoria/bitacora.memoria';
import {
  AuditoriasSqlRepository, BitacoraSqlRepository, CatalogosSqlRepository, CierreSqlRepository, EstadoDatosSql,
  HallazgosSqlRepository, PlanesSqlRepository, UsuariosSqlRepository,
} from './sql/repositorios.sql';
import { ConexionSql } from './sql/conexion-sql';
import { CatalogosRepository, UsuariosRepository } from './repositorios/usuarios.repository';
import { AuditoriasRepository } from './repositorios/auditorias.repository';
import { HallazgosRepository } from './repositorios/hallazgos.repository';
import { PlanesRepository } from './repositorios/planes.repository';
import { CierreRepository } from './repositorios/cierre.repository';
import { BitacoraRepository } from './repositorios/bitacora.repository';
import { EstadoDatos } from './repositorios/estado-datos';

@Injectable()
class EstadoDatosMemoria extends EstadoDatos {
  constructor(private readonly db: BaseDeDatosMemoria) { super(); }
  async estado() {
    return { motor: 'Datos en memoria', base: 'demo', edicion: 'sin BD conectada', tablas: this.db.colecciones };
  }
}

/** DATA_SOURCE=sql usa Azure SQL / SQL Server (backend/.env); cualquier otro valor, los datos de demostración en memoria. */
export const usaSql = process.env.DATA_SOURCE === 'sql';

const IMPLEMENTACIONES = [
  [UsuariosRepository, UsuariosMemoriaRepository, UsuariosSqlRepository],
  [CatalogosRepository, CatalogosMemoriaRepository, CatalogosSqlRepository],
  [AuditoriasRepository, AuditoriasMemoriaRepository, AuditoriasSqlRepository],
  [HallazgosRepository, HallazgosMemoriaRepository, HallazgosSqlRepository],
  [PlanesRepository, PlanesMemoriaRepository, PlanesSqlRepository],
  [CierreRepository, CierreMemoriaRepository, CierreSqlRepository],
  [BitacoraRepository, BitacoraMemoriaRepository, BitacoraSqlRepository],
  [EstadoDatos, EstadoDatosMemoria, EstadoDatosSql],
] as const;

@Global()
@Module({
  providers: [
    BaseDeDatosMemoria,
    ConexionSql,
    ...IMPLEMENTACIONES.map(([contrato, memoria, sql]) => ({ provide: contrato, useClass: usaSql ? sql : memoria })),
  ],
  exports: [BaseDeDatosMemoria, ConexionSql, ...IMPLEMENTACIONES.map(([contrato]) => contrato)],
})
export class DatosModule {}
