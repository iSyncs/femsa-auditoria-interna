import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const ACCIONES = ['CREAR', 'ACTUALIZAR', 'APROBAR', 'RECHAZAR', 'CERRAR', 'EXPORTAR', 'SOLICITAR_CIERRE', 'VALIDACION', 'EVALUAR'] as const;
export type AccionBitacora = (typeof ACCIONES)[number];

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// hu_15: filtros opcionales, sin filtros regresa todo lo que sigue en retencion
export class ConsultarBitacoraDto {
  @ApiProperty({ required: false, example: 10 }) @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  usuarioId?: number;

  @ApiProperty({ required: false, example: '2026-09-01', description: 'Fecha inicial en UTC (YYYY-MM-DD)' })
  @IsOptional() @Matches(FECHA, { message: 'Usa el formato AAAA-MM-DD.' })
  desde?: string;

  @ApiProperty({ required: false, example: '2026-09-30', description: 'Fecha final en UTC (YYYY-MM-DD), incluida' })
  @IsOptional() @Matches(FECHA, { message: 'Usa el formato AAAA-MM-DD.' })
  hasta?: string;

  @ApiProperty({ required: false, enum: ACCIONES }) @IsOptional() @IsIn(ACCIONES, { message: 'Acción no válida.' })
  accion?: AccionBitacora;

  @ApiProperty({ required: false, example: 'FND-000001' }) @IsOptional() @IsString() @MaxLength(40)
  folio?: string;

  @ApiProperty({ required: false, example: 1, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina?: number;

  @ApiProperty({ required: false, example: 100, default: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limite?: number;
}
