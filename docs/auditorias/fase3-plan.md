# Fase 3 · Plan conciliado (esencialista + organización)

Fuentes:

- [fase3-esencialista.md](fase3-esencialista.md), identificadores N·, PA·, E·, A·, X·.
- [fase3-organizacion.md](fase3-organizacion.md), identificadores N-·, P-·, S-·, G-·.

Este documento manda cuando ambos informes difieren.

## 1. Decisiones de conciliación

| Tema | Decisión | Por qué |
|---|---|---|
| Plano en el Estudio | **Paso 2, opcional y con «Saltar».** No va dentro de «Más herramientas» | Sin plano no hay radar ni medidas, que son requisitos del cliente, y la Guía ya lo prepara en la obra |
| Modo juego | **Opción D+E del informe de organización.** Se entra con W A S D (las flechas nunca capturan) o con el botón 🎮. En el paseo libre se entra con un clic en «Haz clic para caminar». Hay un ajuste «Capturar el ratón con un clic», desactivado por defecto. **No** se entra con doble clic | El doble clic no se descubre y choca con el clic de avanzar |
| Ayuda | **Visible en la barra de vista** | Es la red de seguridad de quien no juega |
| Radar | **Arriba a la izquierda en todos los tamaños**, bajo el título. Oculto por defecto sin plano (activable) y oculto en la maqueta | Así lo hace Counter-Strike, y además se elimina la geometría inventada |
| Mapa | **Dos controles:** el radar (R muestra u oculta) y «Estancias y plano» (M, «Ampliar» o el título «Salón ▾»). Fuera «radar ⇄ plano» | Hoy hay tres botones para lo mismo |
| Momentos | Solo los que tienen foto real. El Estudio puede activar «noche simulada» | Hecho en el núcleo (commit 49857c0) |
| Personalizar | Pasa a llamarse **«Estilo y luz»** y depende de `estado_obra`: estilos IA solo en proyectos, colores en construidos, Luz y «Antes y después» | Requisito «estilos IA solo en proyectos», que hoy no se cumple |
| Apariencia (claro u oscuro de la interfaz) | **Solo en Ajustes**, con un icono que no sea un sol ni una luna | Para no confundirla con la luz de la vivienda |
| Modo Rápido o Completo (Estudio) | **Desaparece.** Una sola barra: Fotos · Plano (opcional) · Datos · Publicar, más «Más herramientas» plegable | Hoy el modo cambia lo que se publica (E3) |
| Diseño | **Todo lo nuevo o rehecho se construye ya con `tema.css`** (clases `c8-*` y tokens). Lo viejo se migra en la fase 4 | No tocar cada interfaz dos veces |
| Tema durante la fase 3 | El visor y el Estudio fijan **oscuro** por defecto (`cre8Tema.porDefecto({ tema: "oscuro" })`) hasta que la fase 4 migre todo a tokens | Evita mezclar piezas claras y oscuras a medio migrar |

## 2. Ronda 2 de decisiones del cliente

Se implementan las opciones recomendadas, y cada alternativa queda a un solo cambio de distancia. Las elecciones se leen de la página de decisiones (`elecciones/actual`, claves E a I).

| Clave | Decisión | Recomendada (por defecto) | Alternativas y cómo se cambian |
|---|---|---|---|
| E | Modo juego | D+E: W A S D o 🎮, y clic en el paseo libre | A (un clic captura, como antes): `capturaConClic` por defecto a `true`. C (solo el botón): `modoJuegoWASD` por defecto a `false` |
| F | Estancias en el móvil | «Salón ▾» abre «Estancias y plano» | Tira de miniaturas fija: mostrar `#galeria` en el móvil (una regla CSS) |
| G | Entrada al recorrido | Portada con «Empezar visita» | Entrada directa: `tour.portada === false` por defecto |
| H | Radar | Arriba a la izquierda en todos los tamaños | Abajo a la izquierda en escritorio: una regla CSS |
| I | Plano en el Estudio | Paso 2 opcional | Dentro de «Más herramientas»: el orden de la barra lateral (`ORDEN`) |

## 3. Contrato entre el núcleo y los paneles (lo deben respetar los dos)

### 3.1 DOM del núcleo (`index.html`)

| Elemento | Qué es |
|---|---|
| `#lugar` | Botón con el logo, el título y «Estancia · Planta ▾». Abre «Estancias y plano» (`aria-haspopup="dialog"`) |
| `#radar` | Arriba a la izquierda, bajo `#lugar`. Contiene `canvas#mapa` y el botón «Ampliar» (abre «Estancias y plano») |
| `#modos` | «Recorrido · Paseo libre · Maqueta», solo con 2 modos o más. Arriba en el centro; abajo en el móvil vertical |
| `#barra-vista` | Arriba a la derecha: Radar · Modo juego\* · Música\* · Ayuda · Pantalla completa\* · Más. Fila en escritorio y horizontal; columna en el móvil vertical |
| `#btn-mas` | Botón de la barra de vista. Abre el menú `#menu-mas` del núcleo |
| `#galeria` | Tira de estancias. En escritorio y tablet: abajo en el centro, agrupada por zonas o plantas. En el móvil: oculta |
| `#estancias-plano` | `<dialog>`: hoja en el móvil, ventana en escritorio. Contiene el plano grande (norte arriba, pestañas de planta), «▶ Visita guiada» y la lista de estancias con miniatura, agrupada por `tour.secciones` (zonas) o por planta |
| `#portada` | Logo y nombre de la agencia, título, precio y 3 datos, progreso, «Empezar visita», «▶ Visita guiada» (con 3 estancias o más), idiomas (con 2 o más) y «Creado con cre8eight». Sin portada con `?embed` |
| `#aviso-juego` | Fijo arriba en el centro mientras dura el modo juego: «Modo juego · Esc para salir» |
| `#paneles` | Donde montan los paneles |

### 3.2 API nueva del núcleo (`window.visor`)

```js
visor.mas.agregar({ id, texto, icono, accion, orden = 50, donde = "siempre" })  // donde: "siempre" | "movil" | "escritorio"
visor.mas.quitar(id)
visor.estanciasPlano(abrir?)        // abre o cierra «Estancias y plano»; sin argumento alterna
visor.modoJuego(si?)                // entra o sale; emite "modojuego" { activo }
visor.giroscopio(si?)               // para el menú «Más» en el móvil; emite "giroscopio" { activo }
visor.ajustes({ modoJuegoWASD, capturaConClic, atajos, sensibilidad, ... })   // claves nuevas además de las de hoy
visor.portada                       // { visible } (solo lectura); evento "empezar" cuando el visitante pulsa «Empezar visita»
```

- `icono` es una cadena SVG o el nombre de un icono que el núcleo conoce.
- El menú «Más» lo pinta y gestiona el núcleo: teclado (flechas, Esc) y foco. Los paneles solo aportan los elementos.

### 3.3 Lo que hacen los paneles (`paneles.js`)

- **Tarjeta del inmueble.** Sustituye a la pestaña de la ficha, a la hoja de vista previa y al dock.
  - **Contenido:** precio y «2 hab · 1 baño · 92 m² · C» (abre la ficha), «Contactar» (principal), «Foto de la vista» y, en el móvil, «Estilo y luz».
  - **Escritorio:** columna derecha bajo `#barra-vista`, con las acciones con texto debajo (Estilo y luz · Visita guiada · Medir).
  - **Móvil:** una sola fila abajo.
  - **Al ocultarse la interfaz** queda en «349.000 € · Contactar». Nunca desaparece.
  - **Espacio que ocupa:** lo publica en `--reserva-inferior` (alto en el móvil) y `--ancho-dock` (ancho en escritorio), como hoy.
- **Elementos de «Más»** (con `visor.mas.agregar`):
  - Escritorio: Compartir · Idioma · Ajustes.
  - Móvil, además: Visita guiada · Medir · Pantalla completa\* · Mirar moviendo el móvil\*.
- **Ajustes:** Idioma · Música y volumen · Controles (Velocidad de giro, Entrar en modo juego con W A S D, Capturar el ratón con un clic, Atajos de teclado; solo en escritorio) · Accesibilidad (Reducir movimiento). Los controles de Apariencia y Tamaño llegan en la fase 4.
- **Durante el modo juego** (`body.raton-capturado`): ningún botón pulsable a la vista. El precio puede quedarse como texto.

### 3.4 Eventos que ya existen y se mantienen

`listo`, `tour`, `nodo`, `modo`, `estilo`, `momento`, `pintura`, `medida`, `contacto`, `guion:*`, `idioma`, `sonido`. Se añaden `modojuego`, `giroscopio` y `empezar`.

## 4. Paquetes de trabajo

En todos: P1 y P2. P3 si da tiempo. Pruebas con `pruebas/` (humo y e2e) y Playwright en 390×844, 844×390, 820×1180, 1280×800 y 1920×1080. Lo nuevo se hace con `tema.css`. Los informes los dicen en detalle.

### 4.1 Núcleo (`index.html`, `visor.js`, `visor.css`, `plano.js`, `maqueta.js`)

| Prioridad | Tarea |
|---|---|
| P1 | N-2 modo juego (D+E) |
| P1 | N-3 barra de vista y menú «Más» (API 3.2) |
| P1 | N-4 «Estancias y plano» (sustituye a `#btn-vista-mapa` y al plano grande) |
| P1 | N-5 el plano por encima de todo en horizontal |
| P1 | N-6 y N4: el radar arriba a la izquierda, oculto sin plano y en la maqueta |
| P1 | N-7 portada mínima |
| P2 | N-8 portada completa: miniatura de fondo, visita guiada, idiomas y música, con el toque de «Empezar» como gesto de audio |
| P2 | N-9 nombres: teclas R (radar) y M (Estancias y plano) |
| P2 | N-10 música: el icono solo silencia y el volumen pasa a Ajustes (paneles) |
| P2 | N-11 ayuda contextual «Ayuda y controles» |
| P2 | N-12 visita guiada con un solo control |
| P2 | N-13 tira agrupada por zonas o plantas |
| P2 | N7 y N8 del esencialista (ya incluidos arriba) |
| P2 | `ESQUEMA.md` §2: controles y API nueva |

Hecho ya: N1, N2, N3, N6, N10, N11, N12 (textos), N13, X1, X2 y X3.

### 4.2 Paneles (`paneles.js`, `paneles.css`, `i18n.js`)

| Prioridad | Tarea |
|---|---|
| P1 | P-1 tarjeta del inmueble |
| P1 | P-2 y PA1/PA2: «Foto de la vista» en primer nivel y contacto en 4 toques; WhatsApp directo dentro del diálogo; mensaje con un solo enlace |
| P1 | P-3 herramientas fuera de la ficha y elementos de «Más» |
| P1 | P-4 Ajustes |
| P2 | P-5 y PA3: «Estilo y luz» según `estado_obra`, en una hoja compacta que no tape el centro |
| P2 | P-6 ficha en el orden de §5.4 de organización, con 6 datos clave, gastos en Datos clave y sin duplicar los avisos legales |
| P2 | P-7 y PA6: i18n con el vocabulario de §7, sin claves huérfanas y sin it, pt, ca ni nl |
| P2 | PA7 RGPD plegable |
| P2 | `urlSegura` común en `util.js`, con las reglas de los paneles (admite relativas, `blob:` del mismo origen y `data:` de PDF o imagen solo en descargas), que use también el núcleo |
| P3 | PA8 a PA11 |

### 4.3 Estudio (`estudio.html`, `estudio*.js`, `estudio.css`)

| Prioridad | Tarea |
|---|---|
| P1 | S-1 y E3: barra lateral única y sin modos. Revisar pasa a ser la cabecera «Antes de publicar» de Publicar. `#publicar` funciona y `#exportar` y `#revisar` quedan como alias |
| P1 | S-2, E6 y E7: Venta/Alquiler; título y referencia automáticos y editables; «Ver» lleva al campo exacto |
| P1 | S-3 y E13: un solo botón principal en la primera visita |
| P1 | S-4 y E1: «Mi inmobiliaria», el perfil |
| P1 | E2: solo es, en, fr y de |
| P1 | E4: sin plano no hay «Plano con medidas»; sin web no hay QR de ejemplo; con web se escribe `url_publica` |
| P1 | E5: la vista previa ya arranca vacía; quitar «Recargar» |
| P2 | S-5 y E10: cada apartado en un solo sitio (Extras, Estilo y luz, Plano → Avanzado) |
| P2 | S-6: nombres |
| P2 | S-7: Publicar por destino (Tu web · Portales y redes · Para tus clientes); la copia de seguridad, en «Proyecto ▾» |
| P2 | S-8 y E9: Estilo y luz según la obra |
| P2 | E8: noche simulada solo si se activa |
| P2 | S-9: aviso en el móvil |
| P2 | S-10 y E12: la lista de la Guía por enlace |
| P2 | E11: traducción en un solo sitio |
| P2 | E14: quitar altura de techo, latitud y longitud, y la tarjeta tour.json (queda en Avanzado si cuesta poco) |
| P3 | E15 a E18, S-11 a S-13 |

### 4.4 Guía (`asistente-osmo.html`). La hace el orquestador.

| Prioridad | Tarea |
|---|---|
| P1 | G-P2: «Enviar mi lista al ordenador», con un enlace `estudio.html#fotos&estancias=…&tomas=…` que lee el Estudio (S-10) |
| P1 | En el móvil: «Ábrelo en tu ordenador» |
| P2 | G-P3: 6 pasos en 3 fases y «Paso n de 6 ▾» |
| P2 | G-P4: cabecera «Guía Osmo 360» y anclas |

Hecho ya: A1, A3, A4 y A6.

## 5. Al terminar (regla del cliente)

1. **Compactar.** Código muerto, i18n huérfano, CSS sin uso y utilidades duplicadas.
2. **Medir.** Controles en la primera pantalla, pantalla tapada (objetivo ≤ 15 %), toques para contactar (objetivo 4), JS inicial y tiempo hasta `listo`.
3. **Probar.** `npm run prueba:todo` en verde, y actualizar las pruebas que cambian por diseño.
4. **Contingencias** en `docs/calidad.md`. Por ejemplo, si el navegador rechaza el modo juego, se mira arrastrando.
5. **Enseñar al cliente** las decisiones de la ronda 2 y el resultado.
