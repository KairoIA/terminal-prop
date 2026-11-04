# Terminal Prop

Dos páginas para operar cuentas de fondeo cubiertas en un bróker:

- **Cálculo** (`index.html`): regla de 3, buscador que iguala el riesgo entre micros MNQ y lotes de NAS100, y rentabilidad de un challenge con cobertura (plan de días, coste acumulado y probabilidad).
- **Registro** (`registro.html`): las cuentas compradas (varias de golpe), las operaciones con su resultado en la firma y en el bróker, retiros y gastos extra. Panel con resultado neto, % de fondeo, % de retiro, % de fallos, lo que el bróker aún tiene que recuperar en cada cuenta y la comparativa con y sin coberturas.

Los datos del registro son compartidos: quien abre el enlace ve lo mismo, desde el móvil o el ordenador. Se guardan en un Cloudflare Worker con D1 (`servidor/worker.js`): un único documento con número de revisión. Si dos aparatos guardan a la vez, el servidor responde 409 y la web junta los cambios por identificador de cuenta y movimiento antes de volver a guardar. Guarda además las 500 últimas versiones. Cada aparato tiene una copia local para funcionar sin conexión, y se sincroniza al volver (y cada 15 s con la pestaña abierta). Los datos de ejemplo se quedan solo en el aparato.

Desde «Datos y copias» se descarga una copia, se carga una copia o se exporta a Excel.

HTML sueltos, sin dependencias. Publicado con GitHub Pages.
