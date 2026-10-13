import { Children, cloneElement, isValidElement } from 'react';

/**
 * Tabla de datos. En pantallas chicas cada fila se apila como tarjeta y cada celda
 * muestra su encabezado como etiqueta, para no obligar a deslizar de lado.
 */
export function Table({ columnas, children }) {
  // Pasa a cada Td el nombre de su columna (se usa como etiqueta en celular).
  const filas = Children.map(children, (fila) => {
    if (!isValidElement(fila)) return fila;
    let i = 0;
    const celdas = Children.map(fila.props.children, (celda) =>
      isValidElement(celda) ? cloneElement(celda, { etiqueta: columnas[i++] }) : celda);
    return cloneElement(fila, {}, celdas);
  });

  return (
    <div className="sm:overflow-x-auto">
      <table className="w-full border-collapse max-sm:block">
        <thead className="max-sm:hidden">
          <tr>
            {columnas.map((c, i) => (
              <th key={`${c}-${i}`} className="border-b border-line px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:transition-colors sm:[&>tr:last-child>td]:border-b-0
          max-sm:block max-sm:[&>tr]:block max-sm:[&>tr]:border-b max-sm:[&>tr]:border-line-subtle max-sm:[&>tr]:px-1.5 max-sm:[&>tr]:py-2.5 max-sm:[&>tr:last-child]:border-b-0">
          {filas}
        </tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '', etiqueta }) {
  return (
    <td className={`border-b border-line-subtle px-4 py-[13px] align-middle text-[13px] text-ink
      max-sm:flex max-sm:items-start max-sm:justify-between max-sm:gap-4 max-sm:border-0 max-sm:px-0 max-sm:py-1.5 max-sm:text-left ${className}`}>
      {etiqueta && <span className="shrink-0 pt-px text-[11px] font-bold uppercase tracking-wider text-faint sm:hidden">{etiqueta}</span>}
      <div className="min-w-0 max-sm:text-right">{children}</div>
    </td>
  );
}
