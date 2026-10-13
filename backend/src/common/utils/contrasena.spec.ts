import { hashContrasena, verificarContrasena } from './contrasena';

describe('contraseñas', () => {
  it('verifica la contraseña correcta y rechaza las demás', () => {
    const h = hashContrasena('Secreta-123');
    expect(h).not.toContain('Secreta-123');
    expect(verificarContrasena('Secreta-123', h)).toBe(true);
    expect(verificarContrasena('secreta-123', h)).toBe(false);
  });

  it('rechaza usuarios sin contraseña o con formato desconocido', () => {
    expect(verificarContrasena('x', null)).toBe(false);
    expect(verificarContrasena('x', 'md5$abc$def')).toBe(false);
  });
});
