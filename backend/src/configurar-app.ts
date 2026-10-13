import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { pipeDeValidacion } from './common/validacion/pipe';
import { FiltroDeErrores } from './common/filtros/errores.filter';

/** Configuración compartida por el servidor y las pruebas e2e. */
export function configurarApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',') });
  app.useGlobalPipes(pipeDeValidacion);
  app.useGlobalFilters(new FiltroDeErrores());

  const doc = new DocumentBuilder()
    .setTitle('API · Sistema de Auditoría Interna FEMSA')
    .setDescription('Equipo 2 · Ejecución, Cierre y Seguimiento. Sesión simulada con el encabezado X-Usuario-Id (Entra ID en producción).')
    .setVersion('3.0.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  return app;
}
