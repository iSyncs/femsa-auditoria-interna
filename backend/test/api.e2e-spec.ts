import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar-app';
import { BaseDeDatosMemoria } from '../src/datos/memoria/base-de-datos-memoria';
import { CUENTA_DEMO } from '../src/datos/memoria/datos-demo';

const LIDER_RS = '1', GERENTE_RS = '8', DIRECTOR = '10', AUDITADO = '12';

describe('API de Auditoría (e2e, datos en memoria)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configurarApp(modulo.createNestApplication());
    await app.listen(0);
  });
  afterAll(() => app.close());

  it('health responde sin sesión', async () => {
    const r = await api().get('/api/health').expect(200);
    expect(r.body).toMatchObject({ ok: true, motor: 'Datos en memoria' });
  });

  it('HU_01: sin sesión responde 401', () => api().get('/api/auditorias').expect(401));

  it('HU_01: la lista de usuarios ya no es pública', () => api().get('/api/usuarios').expect(401));

  it('HU_01: la sesión automática entra con la cuenta de demostración', async () => {
    const r = await api().post('/api/sesion/demo').expect(201);
    expect(r.body).toMatchObject({ nombre: 'José Martínez', rol: 'lider', correo: CUENTA_DEMO.correo });
    expect(r.body).not.toHaveProperty('contrasena_hash');
  });

  it('HU_01: inicio de sesión valida el formato del correo', () =>
    api().post('/api/sesion').send({ correo: 'no-es-correo', contrasena: 'x' }).expect(422));

  it('HU_01: el auditado sólo ve las auditorías donde participa', async () => {
    const r = await api().get('/api/auditorias').set('X-Usuario-Id', AUDITADO).expect(200);
    expect(r.body.map((a: { tracking_id: string }) => a.tracking_id).sort()).toEqual(['AUD-000002', 'AUD-000004', 'AUD-000009']);
  });

  it('HU_01: un líder de Retail & Spin no ve auditorías de Bebidas', async () => {
    const r = await api().get('/api/auditorias').set('X-Usuario-Id', LIDER_RS).expect(200);
    expect(r.body.every((a: { direccion: string }) => a.direccion === 'Retail & Spin')).toBe(true);
  });

  it('HU_04: rechaza hallazgos con texto de relleno, campo por campo', async () => {
    const r = await api().post('/api/hallazgos').set('X-Usuario-Id', LIDER_RS)
      .send({ auditoriaId: 2, titulo: '  ', condicion: 'n/a', criterio: 'x', causa: 'asdf', efecto: '....', recomendacion: ' ', severidad: 'Alta', tipo: 'Debilidad menor' })
      .expect(422);
    expect(Object.keys(r.body.detalles).sort()).toEqual(['causa', 'condicion', 'criterio', 'efecto', 'recomendacion', 'titulo']);
  });

  it('HU_04: registra un hallazgo válido con folio FND', async () => {
    const r = await api().post('/api/hallazgos').set('X-Usuario-Id', LIDER_RS).send({
      auditoriaId: 2, procedimientoId: 4, titulo: 'Pagos liberados sin segunda firma',
      condicion: 'En la muestra de 40 pagos, 6 fueron liberados por el mismo usuario.', criterio: 'Política de tesorería de firma dual',
      causa: 'El ERP permite omitir la segunda firma', efecto: 'Riesgo de pagos no autorizados', recomendacion: 'Bloquear la omisión de firma dual',
      severidad: 'Alta', tipo: 'Debilidad de control',
    }).expect(201);
    expect(r.body.tracking_id).toMatch(/^FND-\d{6}$/);
  });

  it('CP-003: guarda la evaluación, calcula 70% y registra trazabilidad', async () => {
    const r = await api().post('/api/auditorias/1/procedimientos/3/evaluacion')
      .set('X-Usuario-Id', '2').set('X-Zona-Horaria', 'America/Mexico_City')
      .send({ diseno: 'Definido', efectividad: 'Optimizado', vulnerabilidad: 'Bajo' }).expect(201);
    expect(r.body).toMatchObject({ estado: 'evaluado', calif_diseno: 'Definido', calif_efectividad: 'Optimizado', vulnerabilidad: 'Bajo', avance: 70 });

    const bitacora = await api().get('/api/bitacora').set('X-Usuario-Id', GERENTE_RS).expect(200);
    expect(bitacora.body.operaciones[0]).toMatchObject({ folio: 'AP-000003', accion: 'EVALUAR', usuario_id: 2, zona_horaria: 'America/Mexico_City' });
    expect(new Date(bitacora.body.operaciones[0].fecha).toISOString()).toBeTruthy();
  });

  it('CP-004: exige justificación real para efectividad Inicial o Funcional', async () => {
    await api().post('/api/auditorias/1/procedimientos/3/evaluacion').set('X-Usuario-Id', '2')
      .send({ diseno: 'Funcional', efectividad: 'Inicial', vulnerabilidad: 'Alto', comentarios: 'n/a' }).expect(422);
    await api().post('/api/auditorias/1/procedimientos/3/evaluacion').set('X-Usuario-Id', '2')
      .send({ diseno: 'Funcional', efectividad: 'Funcional', vulnerabilidad: 'Alto', comentarios: 'Causa técnica documentada y pendiente de remediación.' }).expect(201);
  });

  it('HU_06: no permite solicitar el cierre con pendientes', async () => {
    const r = await api().post('/api/auditorias/2/solicitar-cierre').set('X-Usuario-Id', LIDER_RS).expect(409);
    expect(r.body.detalles.length).toBeGreaterThan(0);
  });

  it('HU_07: respeta el turno y exige motivo al rechazar', async () => {
    await api().post('/api/auditorias/5/decision').set('X-Usuario-Id', DIRECTOR).send({ decision: 'aprobado' }).expect(403);
    await api().post('/api/auditorias/5/decision').set('X-Usuario-Id', GERENTE_RS).send({ decision: 'rechazado', comentario: 'no' }).expect(422);
  });

  it('HU_08: la firma del Director sella el expediente y la integridad se verifica', async () => {
    await api().post('/api/auditorias/5/decision').set('X-Usuario-Id', GERENTE_RS).send({ decision: 'aprobado' }).expect(200);
    const sello = await api().post('/api/auditorias/5/decision').set('X-Usuario-Id', DIRECTOR).send({ decision: 'aprobado' }).expect(200);
    expect(sello.body).toMatchObject({ estado: 'cerrada', hash: expect.stringMatching(/^[0-9a-f]{64}$/) });
    const integridad = await api().get('/api/auditorias/5/integridad').set('X-Usuario-Id', DIRECTOR).expect(200);
    expect(integridad.body).toMatchObject({ datosIntactos: true, manifiestoIntacto: true, hashGuardado: sello.body.hash });
  });

  describe('HU_09: alta de planes de remediación', () => {
    const db = () => app.get(BaseDeDatosMemoria);
  
    beforeEach(() => db().reiniciar());
  
    it('crea un plan con folio RP y estado abierto', async () => {
      const r = await api() .post('/api/planes') .set('X-Usuario-Id', LIDER_RS) .send({ hallazgoId: 3, descripcion:'Implementar doble validación para pagos.', responsableId: Number(AUDITADO), fechaCompromiso: '2026-10-30', montoMxn: 150000,}).expect(201);
      expect(r.body).toMatchObject({estado: 'abierto', avance_pct: 0, hallazgo_id: 3, responsable_id: Number(AUDITADO), monto_mxn: 150000,});
      expect(r.body.tracking_id).toMatch(/^RP-\d{6}$/);
    });
  
    it('rechaza descripción vacía', async () => {
      const r = await api()
        .post('/api/planes')
        .set('X-Usuario-Id', LIDER_RS)
        .send({
          hallazgoId: 3,
          descripcion: '   ',
          responsableId: Number(AUDITADO),
          fechaCompromiso: '2026-10-30',
          montoMxn: 150000,
        })
        .expect(422);
  
      expect(
        r.body.detalles.descripcion,
      ).toBeDefined();
    });
  
    it('rechaza responsable inexistente', async () => {
      await api()
        .post('/api/planes')
        .set('X-Usuario-Id', LIDER_RS)
        .send({
          hallazgoId: 3,
          descripcion:
            'Implementar doble validación.',
          responsableId: 999999,
          fechaCompromiso: '2026-10-30',
          montoMxn: 150000,
        })
        .expect(404);
    });
  
    it('rechaza monto negativo', async () => {
      await api()
        .post('/api/planes')
        .set('X-Usuario-Id', LIDER_RS)
        .send({
          hallazgoId: 3,
          descripcion:
            'Implementar doble validación.',
          responsableId: Number(AUDITADO),
          fechaCompromiso: '2026-10-30',
          montoMxn: -1,
        })
        .expect(422);
    });
  
    it('rechaza una fecha inválida', async () => {
      await api()
        .post('/api/planes')
        .set('X-Usuario-Id', LIDER_RS)
        .send({
          hallazgoId: 3,
          descripcion:
            'Implementar doble validación.',
          responsableId: Number(AUDITADO),
          fechaCompromiso: 'fecha-invalida',
          montoMxn: 150000,
        })
        .expect(422);
    });
  
    it('rechaza un hallazgo que el usuario no puede ver', async () => {
      await api()
        .post('/api/planes')
        .set('X-Usuario-Id', AUDITADO)
        .send({
          hallazgoId: 1,
          descripcion:
            'Implementar doble validación.',
          responsableId: Number(AUDITADO),
          fechaCompromiso: '2026-10-30',
          montoMxn: 150000,
        })
        .expect(404);
    });
  
    it('notifica automáticamente al responsable', async () => {
      const r = await api()
        .post('/api/planes')
        .set('X-Usuario-Id', LIDER_RS)
        .send({
          hallazgoId: 3,
          descripcion:
            'Implementar doble validación para pagos.',
          responsableId: Number(AUDITADO),
          fechaCompromiso: '2026-10-30',
          montoMxn: 150000,
        })
        .expect(201);
  
      const notificacion =
        db().notificaciones.find(
          (n) => n.plan_id === r.body.id,
        );
  
      expect(notificacion).toMatchObject({
        usuario_id: Number(AUDITADO),
        plan_id: r.body.id,
        tipo: 'PLAN_ASIGNADO',
        canal: 'plataforma',
        leida: false,
      });
  
      expect(notificacion?.fecha_envio)
        .toBeInstanceOf(Date);
    });
  
    it('la fecha compromiso corresponde a las 23:59:59 en la zona de la unidad', async () => {
      const r = await api()
        .post('/api/planes')
        .set('X-Usuario-Id', LIDER_RS)
        .send({
          hallazgoId: 3,
          descripcion:
            'Implementar doble validación para pagos.',
          responsableId: Number(AUDITADO),
          fechaCompromiso: '2026-10-30',
          montoMxn: 150000,
        })
        .expect(201);
  
      const hallazgo =
        db().hallazgos.find(
          (h) => h.id === 3,
        )!;
  
      const auditoria =
        db().auditorias.find(
          (a) => a.id === hallazgo.auditoria_id,
        )!;
  
      const unidad =
        db().unidades.find(
          (u) => u.id === auditoria.unidad_negocio_id,
        )!;
  
      const fecha = new Date(
        r.body.fecha_compromiso,
      );
  
      const partes =
        new Intl.DateTimeFormat('sv-SE', {
          timeZone: unidad.zona_horaria,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(fecha);
  
      const valores = Object.fromEntries(
        partes
          .filter((p) => p.type !== 'literal')
          .map((p) => [p.type, p.value]),
      );
  
      expect(
        `${valores.year}-${valores.month}-${valores.day}`,
      ).toBe('2026-10-30');
  
      expect(
        `${valores.hour}:${valores.minute}:${valores.second}`,
      ).toBe('23:59:59');
    });
  });

  it('HU_10: el avance al 100 % pasa a revisión GRC y no puede retroceder', async () => {
    const r = await api().post('/api/planes/1/avances').set('X-Usuario-Id', AUDITADO).send({ avance: 100, comentario: 'Se removió el último conflicto de tesorería.' }).expect(200);
    expect(r.body).toMatchObject({ estado: 'revision_grc', avance_pct: 100 });
    await api().post('/api/planes/2/avances').set('X-Usuario-Id', AUDITADO).send({ avance: 10, comentario: 'Intento de bajar el avance.' }).expect(409);
  });

  describe('CP-014 · Validación GRC → Jefatura y solventación', () => {
    const db = () => app.get(BaseDeDatosMemoria);
    const grc = '11', jefe = '6', auditado = '12', lider = '1';
    const validar = (id: number, usuario: string, decision = 'aprobado', comentario?: string) => {
      const req = api().post(`/api/planes/${id}/validacion`).set('X-Usuario-Id', usuario).send({ decision, ...(comentario === undefined ? {} : { comentario }) });
      return req;
    };

    beforeEach(() => db().reiniciar());

    it('camino feliz: 100 %, GRC, Jefatura y solventación al cerrar el último plan; conserva historial', async () => {
      const planes = db().planes.filter((p) => p.hallazgo_id === 3);
      for (const p of planes) Object.assign(p, { avance_pct: 100, estado: 'revision_grc' });
      await validar(1, grc).expect(200).expect(({ body }) => expect(body.estado).toBe('revision_jefe'));
      await validar(1, jefe).expect(200).expect(({ body }) => expect(body.estado).toBe('cerrado'));
      expect(db().hallazgos.find((h) => h.id === 3)?.estado).not.toBe('solventado');
      await validar(2, grc).expect(200);
      await validar(2, jefe).expect(200);
      expect(db().hallazgos.find((h) => h.id === 3)?.estado).toBe('solventado');
      expect(db().bitacora.filter((b) => b.accion === 'VALIDACION')).toHaveLength(4);
      expect(JSON.parse(db().bitacora.at(-1)!.detalle!)).toMatchObject({ etapa: 'jefatura', decision: 'aprobado' });
    });

    it('bloquea saltar GRC, avance menor a 100 % y rol incorrecto en ambas etapas', async () => {
      await validar(1, jefe).expect(409);
      await api().post('/api/planes/1/validacion').set('X-Usuario-Id', grc).send({ decision: 'aprobado' }).expect(409);
      db().planes[0].avance_pct = 100;
      db().planes[0].estado = 'revision_grc';
      await validar(1, jefe).expect(403);
      await validar(1, grc).expect(200);
      await validar(1, grc).expect(403);
      await validar(1, jefe).expect(200);
    });

    it('exige retroalimentación al rechazar y reinicia el ciclo desde GRC', async () => {
      Object.assign(db().planes[0], { avance_pct: 100, estado: 'revision_grc' });
      await validar(1, grc, 'rechazado').expect(422);
      await validar(1, grc, 'rechazado', 'La evidencia no demuestra operación efectiva.').expect(200)
        .expect(({ body }) => expect(body.estado).toBe('en_progreso'));
      expect(JSON.parse(db().bitacora.at(-1)!.detalle!)).toMatchObject({ etapa: 'grc', decision: 'rechazado', comentario: 'La evidencia no demuestra operación efectiva.' });
      await api().get('/api/planes/1').set('X-Usuario-Id', auditado).expect(200)
        .expect(({ body }) => expect(body.avances[0].comentario).toBe('La evidencia no demuestra operación efectiva.'));
      Object.assign(db().planes[0], { estado: 'revision_grc', avance_pct: 100 });
      await validar(1, grc).expect(200).expect(({ body }) => expect(body.estado).toBe('revision_jefe'));
    });

    it('solventa hallazgo de un solo plan al cerrarlo', async () => {
      const p = db().planes.find((x) => x.hallazgo_id === 3)!;
      const hallazgoId = p.hallazgo_id;
      db().planes.find((x) => x.id !== p.id && x.hallazgo_id === 3)!.hallazgo_id = 4;
      p.estado = 'revision_grc'; p.avance_pct = 100;
      await validar(p.id, grc).expect(200);
      await validar(p.id, jefe).expect(200);
      expect(db().hallazgos.find((h) => h.id === hallazgoId)?.estado).toBe('solventado');
    });

    it('evita doble aprobación concurrente del mismo estado', async () => {
      Object.assign(db().planes[0], { avance_pct: 100, estado: 'revision_jefe' });
      const [a, b] = await Promise.all([
        validar(1, jefe).then((r) => r), validar(1, jefe).then((r) => r),
      ]);
      expect([a.status, b.status].sort()).toEqual([200, 409]);
      expect(db().bitacora.filter((x) => x.accion === 'VALIDACION' && x.entidad_id === 1)).toHaveLength(1);
    });
  });
  describe('HU_14: tablero', () => {
    const dashboard = (id: string) => api().get('/api/dashboard').set('X-Usuario-Id', id).expect(200).then((r) => r.body);
    const suma = (xs: { total: number }[]) => xs.reduce((s, x) => s + x.total, 0);

    it('sin sesión responde 401', () => api().get('/api/dashboard').expect(401));

    it('los totales cuadran y responde en menos de 2 s', async () => {
      const inicio = Date.now();
      const d = await dashboard(DIRECTOR);
      expect(Date.now() - inicio).toBeLessThan(2000);
      expect(suma(d.hallazgos.porSeveridad)).toBe(d.hallazgos.total);
      expect(suma(d.hallazgos.porTipo)).toBe(d.hallazgos.total);
      expect(suma(d.planes.porSemaforo)).toBe(d.planes.total);
      expect(d.planes.porSemaforo.map((s: { semaforo: string }) => s.semaforo)).toEqual(['en_tiempo', 'por_vencer', 'demorado', 'cerrado']);
      expect(d.hallazgos.porSemana).toHaveLength(8);
    });

    describe('cuellos de botella', () => {
      const cuellos = (id: string) => api().get('/api/dashboard/cuellos-de-botella').set('X-Usuario-Id', id).expect(200).then((r) => r.body);

      it('sin sesión responde 401', () => api().get('/api/dashboard/cuellos-de-botella').expect(401));

      it('el Director ve el resumen consistente y responde en menos de 2 s', async () => {
        const inicio = Date.now();
        const d = await cuellos(DIRECTOR);
        expect(Date.now() - inicio).toBeLessThan(2000);
        expect(d.resumen.auditoriasEnAprobacion).toBe(d.aprobaciones.length);
        expect(d.hallazgosSinPlan.length).toBeLessThanOrEqual(Math.min(10, d.resumen.hallazgosSinPlan));
        expect(d.procedimientos.length).toBeLessThanOrEqual(Math.min(10, d.resumen.procedimientosEstancados));
      });

      it('el auditado no ve procedimientos ni aprobaciones y sus hallazgos son un subconjunto', async () => {
        const [dir, auditado] = await Promise.all([cuellos(DIRECTOR), cuellos(AUDITADO)]);
        expect(auditado.procedimientos).toEqual([]);
        expect(auditado.aprobaciones).toEqual([]);
        expect(auditado.resumen.hallazgosSinPlan).toBeLessThanOrEqual(dir.resumen.hallazgosSinPlan);
      });

      it('el líder de Retail & Spin no ve más que el Director', async () => {
        const [dir, lider] = await Promise.all([cuellos(DIRECTOR), cuellos(LIDER_RS)]);
        expect(lider.resumen.procedimientosEstancados).toBeLessThanOrEqual(dir.resumen.procedimientosEstancados);
        expect(lider.resumen.auditoriasEnAprobacion).toBeLessThanOrEqual(dir.resumen.auditoriasEnAprobacion);
      });
    });

    it('respeta la seguridad por fila: Dirección y auditado ven menos que el Director', async () => {
      const [dir, lider, auditado] = await Promise.all([dashboard(DIRECTOR), dashboard(LIDER_RS), dashboard(AUDITADO)]);
      expect(lider.hallazgos.total).toBeLessThanOrEqual(dir.hallazgos.total);
      expect(auditado.hallazgos.total).toBeLessThanOrEqual(dir.hallazgos.total);
      expect(auditado.planes.total).toBeLessThanOrEqual(dir.planes.total);
      const procs = (x: { procedimientos: Record<string, number> }) => Object.values(x.procedimientos).reduce((s, n) => s + n, 0);
      expect(procs(lider)).toBeLessThanOrEqual(procs(dir));
    });
  });

  describe('HU_15 · Bitácora', () => {
    const AUDITOR = '3';

    it('el Director consulta operaciones y accesos', async () => {
      const r = await api().get('/api/bitacora').set('X-Usuario-Id', DIRECTOR).expect(200);
      expect(Array.isArray(r.body.operaciones)).toBe(true);
      expect(Array.isArray(r.body.accesos)).toBe(true);
    });

    it('auditor y auditado reciben 403 y queda como acceso denegado', async () => {
      await api().get('/api/bitacora').set('X-Usuario-Id', AUDITOR).expect(403);
      await api().get('/api/bitacora').set('X-Usuario-Id', AUDITADO).expect(403);
      const r = await api().get('/api/bitacora').query({ usuarioId: AUDITADO }).set('X-Usuario-Id', DIRECTOR).expect(200);
      expect(r.body.accesos[0]).toMatchObject({ resultado: 'denegado', usuario: 'E. Ramos' });
    });

    it('registra el inicio de sesión exitoso y el fallido', async () => {
      const ok = await api().post('/api/sesion').set('User-Agent', 'Prueba e2e').send({ ...CUENTA_DEMO, zonaHoraria: 'America/Monterrey' }).expect(201);
      expect(ok.body).toMatchObject({ nombre: 'José Martínez', rol: 'lider' });
      expect(ok.body).not.toHaveProperty('contrasena_hash');
      await api().post('/api/sesion').send({ correo: CUENTA_DEMO.correo, contrasena: 'incorrecta' }).expect(401);
      await api().post('/api/sesion').send({ correo: 'd.herrera@demo.femsa.test', contrasena: 'cualquiera' }).expect(401);
      const r = await api().get('/api/bitacora').set('X-Usuario-Id', DIRECTOR).expect(200);
      const resultados = r.body.accesos.map((a: { resultado: string }) => a.resultado);
      expect(resultados).toEqual(expect.arrayContaining(['exito', 'fallo']));
      expect(r.body.accesos.find((a: { agente: string }) => a.agente === 'Prueba e2e')).toMatchObject({ resultado: 'exito', zona_horaria: 'America/Monterrey' });
    });

    it('rechaza filtros inválidos con 422', () =>
      api().get('/api/bitacora').query({ desde: 'ayer', accion: 'BORRAR' }).set('X-Usuario-Id', DIRECTOR).expect(422));
  });
});
