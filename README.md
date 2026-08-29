# Nuvol Solutions — landing

Página única publicada en GitHub Pages: https://jimmyordinola.github.io/nuvol-solutions/

- `index.html`: toda la página (CSS inline, sin build). Único recurso externo: Google Fonts (DM Sans).
- `tools/check.mjs`: verificación (copy prohibida, metadatos, anclas, contacto, sin scroll horizontal) + capturas.
  Requiere Playwright del repo `knet/e2e`: `node tools/check.mjs index.html capturas`.

## Cambiar el contacto
Buscar en `index.html` los `href` que empiezan por `https://wa.me/` y `mailto:` (hay dos de cada uno: hero y sección Contacto).

## Dominio propio
Crear un archivo `CNAME` con el dominio y configurarlo en Settings → Pages. La página no tiene URLs absolutas propias salvo `og:url`.
