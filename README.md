# Nuvol Solutions — landing

Página única publicada en GitHub Pages: https://jimmyordinola.github.io/nuvol-solutions/

- `index.html`: toda la página (CSS inline, sin build). Único recurso externo: Google Fonts (DM Sans).
- `tools/check.mjs`: verificación (copy prohibida, metadatos, anclas, contacto, sin scroll horizontal) + capturas.
  Requiere Playwright: por defecto se toma de `../knet/e2e`; para usar otra carpeta, `PW_ROOT=<carpeta con node_modules de playwright>`.
  `node tools/check.mjs index.html capturas`.

## Cambiar el contacto
Hay 4 lugares por cada contacto (WhatsApp y correo), dos veces en el hero y dos en la sección Contacto:
- el `href` (`https://wa.me/…` y `mailto:…`) de los botones.
- el texto visible en `<p class="note">` con el mismo número/correo.

## Dominio propio
Crear un archivo `CNAME` con el dominio y configurarlo en Settings → Pages. La página no tiene URLs absolutas propias salvo `og:url`.
