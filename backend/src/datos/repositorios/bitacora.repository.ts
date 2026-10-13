import type { Acceso, RegistroBitacora } from '../modelos';

export type NuevaOperacion = Omit<RegistroBitacora, 'id' | 'fecha'>;
export type NuevoAcceso = Omit<Acceso, 'id' | 'fecha'>;

export interface OperacionVista extends RegistroBitacora { usuario: string | null }
export interface AccesoVista extends Acceso { usuario: string | null }

// solo se agregan registros, nunca se editan ni se borran
export abstract class BitacoraRepository {
  abstract agregarOperacion(datos: NuevaOperacion): Promise<RegistroBitacora>;
  abstract agregarAcceso(datos: NuevoAcceso): Promise<Acceso>;
  abstract listarOperaciones(): Promise<OperacionVista[]>;
  abstract listarAccesos(): Promise<AccesoVista[]>;
}
