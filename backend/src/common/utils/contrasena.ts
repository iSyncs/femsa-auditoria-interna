import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const LONGITUD = 64;

export function hashContrasena(contrasena: string): string {
  const sal = randomBytes(16).toString('hex');
  return `scrypt$${sal}$${scryptSync(contrasena, sal, LONGITUD).toString('hex')}`;
}

export function verificarContrasena(contrasena: string, guardado: string | null): boolean {
  const [algoritmo, sal, hash] = guardado?.split('$') ?? [];
  if (algoritmo !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  return timingSafeEqual(scryptSync(contrasena, sal, esperado.length), esperado);
}
