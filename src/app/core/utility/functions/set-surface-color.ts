import {updateSurfacePalette} from "@primeng/themes";

/**
 * Establece el color de superficie de la aplicación.
 * @param color El color a establecer como color de superficie.
 */
export function setSurfaceColor(color: string) {
  updateSurfacePalette({
    0: '#ffffff',
    50: '{' + color + '.50}',
    100: '{' + color + '.100}',
    200: '{' + color + '.200}',
    300: '{' + color + '.300}',
    400: '{' + color + '.400}',
    500: '{' + color + '.500}',
    600: '{' + color + '.600}',
    700: '{' + color + '.700}',
    800: '{' + color + '.800}',
    900: '{' + color + '.900}',
    950: '{' + color + '.900}'
  });

  const body = document.body;
  const html = document.documentElement;
  const appRoot = document.querySelector('app-root');
  
  if (body && html) {
    // Remover clases de superficie anteriores
    const surfaceClasses = ['surface-slate', 'surface-gray', 'surface-zinc', 'surface-neutral', 
                           'surface-stone', 'surface-soho', 'surface-viva', 'surface-ocean', 'surface-beach'];
    
    body.classList.remove(...surfaceClasses);
    html.classList.remove(...surfaceClasses);
    if (appRoot) {
      appRoot.classList.remove(...surfaceClasses);
    }
    
    // Agregar la nueva clase de superficie
    body.classList.add(`surface-${color}`);
    html.classList.add(`surface-${color}`);
    if (appRoot) {
      appRoot.classList.add(`surface-${color}`);
    }
  }
}