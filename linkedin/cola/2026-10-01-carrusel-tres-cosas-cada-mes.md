# Brief visual · carrusel del 01-10-2026 · «Qué recibe un cliente cada mes»

Acompaña a `2026-10-01-que-recibe-cada-mes.md`, versión A. **El copy está cerrado y no se toca.**

## Decisión de Maverick sobre la única duda del brief

El director de arte propuso promover «El error:» a la ranura de etiqueta, lo que obligaba a una
mayúscula inicial en la palabra siguiente de los slides 4, 6 y 8. **Se descarta: va la variante
B, sin ningún cambio de copy.** La ranura lleva solo el número (`01`, `02`, `03`) y «El error:»
se queda literal como primera línea del cuerpo, a 40 px en mayúsculas con tracking +8 %, con la
frase completa debajo. Pierde algo de elegancia y no pierde nada de fidelidad, y el copy cerrado
es cerrado también para el diseño. El sistema visual no se altera.

## Objetivo visual

Que al deslizar rápido, antes de leer, se vea un latido: claro-oscuro, claro-oscuro,
claro-oscuro. Tres bloques, dos caras cada uno. El entregable arriba y en claro; el error abajo
y en negro. Debe parecer un inventario honesto, no un folleto.

## Continuidad de marca sin repetir el carrusel del 10-09

Se hereda: familia única, escala tipográfica cerrada, márgenes de 80 px, retícula de 12 columnas,
alineación izquierda siempre, cero fotografía, un solo acento, negro + blanco roto.

| Elemento | 10-09 | 01-10 |
| --- | --- | --- |
| Ritmo de fondos | N N B B B B B B B N | N N / B N / B N / B N / B N |
| Anclaje del texto | mismo eje Y en los seis de desarrollo | alterna arriba / abajo en cada par |
| Dispositivo gráfico | barra de progreso de 6 segmentos | ninguno: dos reglas de 4 px, una horizontal y una vertical |
| Paginación | inferior derecha | superior derecha |
| Portada | mitad inferior llena con el índice | mitad inferior vacía |
| Acento | en seis sitios | en dos, y solo sobre negro |
| Cierre | flecha «desliza y guarda» + firma | sin ornamento, márgenes ensanchados, espejo de la portada |

**La regla que lo resume: la continuidad va en la tipografía y el color; la novedad, en la
composición y el ritmo.**

## Formato y retícula

- 1080 × 1350 px (4:5), 10 páginas, PDF único, menos de 10 MB.
- Márgenes de seguridad 80 px en los slides 1 a 9 → área viva 920 × 1190. **Slide 10: 160 px.**
- 12 columnas, gutter 24 px. Ningún bloque de texto pasa de 920 px de ancho (760 en el slide 10).
- **Dos bandas de anclaje, que son el corazón del sistema.** Banda ALTA: el titular empieza en
  y = 220 y crece hacia abajo, con aire debajo. Banda BAJA: el bloque termina en y = 1190 y crece
  hacia arriba, con aire encima.
- Ranura de etiqueta: x = 80, y = 80, alto 60 px, presente en los slides 1 a 8.
- El visor de documentos de LinkedIn redondea la página: nada de texto ni reglas a menos de 80 px
  del borde.

## Tipografía

Familia única, la grotesca pesada del Brand Book. **Sustituta gratuita si no está a mano:
Archivo** (Google Fonts, OFL), pesos 400/700/900. Segunda opción, Inter Tight. Una vez elegida,
no se mezcla con nada.

**Escala cerrada, la misma del 10-09:** 120 / 88 / 76 / 72 / 52 / 48 / 44 / 40 / 36 / 32 px.
Ningún tamaño fuera de esa lista.

| Nivel | Tamaño | Peso | Uso |
| --- | --- | --- | --- |
| H0 · gancho de portada | 120 | 900 | solo «Tres cosas.» |
| H1 · titular de entregable | 88 | 900 | slides 3, 5, 7 y frase dura del 2 |
| H2 · titular de error / sentencia | 76 | 700 | slides 4, 6, 8, 9 |
| H3 · CTA | 88 | 900 | slide 10, línea 1 |
| B1 · bajada | 52 | 400 | segundas frases |
| L · etiqueta | 40 | 700 | ranura, mayúsculas, tracking +8 % |
| F · firma | 36 | 400 | slide 10 |
| P · paginación | 32 | 400 | superior derecha |

Interlineado 1,15 en titulares y 1,3 en cuerpo. **Alineación izquierda en toda la pieza, sin
excepción.** Máximo 3 líneas por titular y 2 por bajada. Sin partición de palabras ni justificado.

## Paleta y contraste

| Token | Valor | Uso |
| --- | --- | --- |
| `Makers/Black` | **#0B0B0B** | fondo de 1, 2, 4, 6, 8, 10 · texto sobre claro |
| `Makers/Off-White` | **#F2EFE9** | fondo de 3, 5, 7, 9 · texto sobre negro |
| `Makers/Accent` | acento del Brand Book | **dos apariciones: «Tres cosas.» y «sistema»** |

- Texto principal sobre su fondo: ≈ 18:1, muy por encima del mínimo 7:1 de la guía.
- Opacidades mínimas: **70 % sobre negro, 55 % sobre claro.** Por debajo desaparece en móvil.
- **El acento vive solo sobre #0B0B0B**, así solo hay un contraste que validar. Si no llega a
  7:1 contra el negro, se aclara mezclando con `Off-White` en pasos del 10 % hasta pasar, y el
  tono resultante se documenta como `Makers/Accent-Dark-BG` para los siguientes carruseles.
- **Fallback sin acento** si el Brand Book no está accesible el día de producción: las dos
  palabras en `Off-White` 100 %, peso 900, con subrayado de 4 px. **Mejor publicar sin color que
  con un color inventado.**
- Ni negro puro ni blanco puro, por el modo oscuro del feed: #0B0B0B no se fusiona con la tarjeta
  y #F2EFE9 no produce halo. Exportar **sin transparencia**, con relleno sólido en los 10 frames.
- **Cero cifras de resultado.** No hay ninguna en el copy y no se añade ninguna en el diseño: ni
  gráficos, ni barras, ni porcentajes decorativos. La paginación es el único número ajeno al copy.

## Cómo se marca el par entregable / error

Tres señales que giran juntas. Redundancia deliberada: funciona en miniatura, en blanco y negro
y para alguien que no lee.

| Señal | Cara A · entregable (3, 5, 7) | Cara B · error (4, 6, 8) |
| --- | --- | --- |
| Fondo | `Off-White`, texto negro | `Black`, texto blanco roto |
| Anclaje | banda ALTA: texto arriba, aire abajo | banda BAJA: texto abajo, aire arriba |
| Regla de 4 px | **horizontal**, 920 × 4, bajo la etiqueta en y = 148 | **vertical**, 4 px de ancho en x = 80, pegada al texto, que se indenta a x = 128 |

**Lo que ata el par es el número en la misma ranura:** `01` en el slide 3 y `01` en el slide 4,
mismo sitio y mismo tamaño. Nadie tiene que explicar que son la misma cosa vista de dos lados.

**Nada de iconos, flechas, check verde ni cruz roja.** El giro claro/oscuro ya es el sí/no. Y el
error nunca se codifica en rojo: gastaría en un slide intermedio la única señal de color que debe
llevar al mensaje privado.

**Por qué el error va en negro y abajo:** el slide 2, que es el problema del sector, ya está en
negro y anclado abajo. Así el negro-abajo queda tipificado como «esto es lo que va mal» sin
tener que escribirlo nunca.

## Slide a slide

Paginación `NN/10` a 32 px al 40 % de opacidad, esquina superior derecha (x derecha = 1000,
y = 80), en los slides 2 a 9. **Slides 1 y 10 sin paginación.**

**1 · Portada · #0B0B0B.** Etiqueta `QUÉ RECIBE UN CLIENTE CADA MES` en la ranura, 40 px, 700,
`Off-White` al 70 %, sin regla debajo. `Tres cosas.` con la línea base en y = 420, **120 px, 900,
en `Accent`**, una sola línea. `Ninguna vale por existir.` desde y = 560, 52 px, 400, al 75 %.
**De y = 640 al final: vacío absoluto.** Ni índice, ni logo, ni flecha. Esa es la diferencia de
composición más visible respecto al carrusel anterior.

**2 · Problema · #0B0B0B · banda BAJA, sin reglas.** `Casi ningún proveedor te dice qué entrega
exactamente.` a 52 px, 400, al 70 %. Debajo, 64 px más abajo, `Así nadie puede comparar.` a
**88 px, 900, al 100 %**, con la última línea base en y = 1190. Mitad superior vacía. Sin acento:
la frase dura pesa por tamaño, no por color.

**3 · Entregable 01 · #F2EFE9 · banda ALTA.** Etiqueta `01 · UN CALENDARIO` (separador punto
medio, no guion). Regla horizontal 920 × 4 en y = 148. Titular `Cerrado antes de que empiece el
mes.` con el top del bloque en **y = 220**, 88 px, 900. Resto vacío: el eje Y de arranque es
intocable en 3, 5 y 7.

**4 · Error 01 · #0B0B0B · banda BAJA.** Etiqueta `01`. Regla vertical de 4 px en x = 80, texto
indentado a x = 128. `El error: rellenarlo sobre la marcha.` a 76 px, 700 — «EL ERROR:» en
mayúsculas a 40 px con tracking +8 % como primera línea, literal. Debajo, 32 px más abajo,
`Eso no es un calendario. Es una lista de urgencias.` a 52 px, 400, al 70 %, con la última línea
base en y = 1190.

**5 · Entregable 02 · #F2EFE9 · banda ALTA.** Instancia idéntica al 3. Etiqueta `02 · LAS PIEZAS`,
titular `Producidas y listas para publicar.`

**6 · Error 02 · #0B0B0B · banda BAJA.** Instancia idéntica al 4. `El error: entregar «a falta de
un detalle».` y `Ese detalle bloquea la publicación una semana.` **Comillas latinas «», no
rectas ni inglesas.**

**7 · Entregable 03 · #F2EFE9 · banda ALTA.** Etiqueta `03 · UN INFORME`, titular `Para decidir el
mes siguiente.`

**8 · Error 03 · #0B0B0B · banda BAJA.** `El error: justificar el mes pasado.` y `Un informe que
defiende la factura no decide nada.`

**9 · Sentencia · #F2EFE9 · sin etiqueta, sin regla, sin número.** Bloque ópticamente centrado
(centro en y = 640), x = 80. `Un sistema no se mide por lo que te entrega.` a 76 px **peso 400**
al 55 %; debajo, 24 px más abajo, `Se mide por lo que ya no tienes que decidir tú.` a 76 px
**peso 900** al 100 %. **Mismo tamaño, distinto peso:** la frase se parte por gravedad
tipográfica, no por color. Sin acento — este es el slide que la gente captura y tiene que
funcionar en gris. La ausencia de etiqueta y reglas señala que el sistema de pares ha terminado.

**10 · Cierre · #0B0B0B · rompe el patrón.** Márgenes de **160 px**, únicos en la pieza: al
deslizar se nota como un frenazo. Sin etiqueta, sin paginación, sin número, sin regla de par y
sin banda de anclaje: se abandonan los tres dispositivos a la vez. **Espejo de la portada** —
allí el texto arriba y el vacío abajo; aquí el vacío arriba y el texto abajo. De y = 0 a y = 700,
vacío. Regla de 760 × 4 al 25 % en y = 740. `Escribe sistema por privado.` con el top en y = 820,
88 px, 900, **con `sistema` en `Accent`**. Debajo, 40 px más abajo, `Te digo qué llegaría tu
primer mes.` a 52 px, 400, al 70 %. Firma `Angello Benavides · Makers` en la esquina inferior
izquierda, 36 px, al 60 %.

## Producción

1. Página `LI-2026-10-01` con 10 frames de 1080 × 1350. Dos layout grids compartidos (columnas y
   márgenes 80) más un tercero de márgenes 160 solo para el frame 10.
2. Estilos: reutilizar los del 10-09 si existen. **Medir el acento contra #0B0B0B antes de
   seguir.** Nunca aplicar color ni tamaño a mano.
3. Dos componentes, `Slide-Entregable` y `Slide-Error`, con propiedades de texto `numero`,
   `etiqueta`, `titular`, `bajada`, `pagina`. **Los slides 3 a 8 son instancias, nunca copias.**
4. Volcar el texto literal desde la ficha del copy. Comillas latinas, punto medio en las
   etiquetas, tildes.
5. Maquetar 1, 2, 9 y 10 fuera de componente. Aplicar el acento solo dos veces.
6. **Prueba del latido:** miniaturas al 12 %, los 10 frames en fila. Debe leerse N N | B N | B N |
   B N | B N. Si el latido no se ve sin leer texto, el problema es de fondos, no de tipografía.
7. **Prueba de miniatura de portada:** slide 1 a PNG reducido al 20 %, a un brazo de distancia.
   Solo debe leerse «Tres cosas.». Si no, bajar la etiqueta al 55 %; no tocar el titular.
8. **Prueba de modo oscuro:** ver el PDF en la app de LinkedIn con tema oscuro en un móvil real.
9. Checklist completo.
10. Exportar los 10 frames **en orden 1→10** como PDF único, sin sangrado ni marcas de corte, sin
    transparencia, con fuentes incrustadas. Verificar el orden de páginas antes de cerrar.
11. Subir con **«Añadir un documento»**, no como imagen: solo así LinkedIn lo hace deslizable.
    Título del documento: `Qué recibe un cliente cada mes`.

Tiempo estimado: 125 minutos, o unos 55 reutilizando estilos y componentes del 10-09.

Nombres de archivo: `linkedin_2026-10-01_tres-cosas-cada-mes.pdf` y
`linkedin_2026-10-01_tres-cosas-cada-mes_portada.png`.

## Checklist antes de exportar

- [ ] 10 páginas, todas 1080 × 1350, ninguna rotada.
- [ ] El latido claro/oscuro se ve en miniaturas sin leer texto.
- [ ] Titulares de 3, 5 y 7 arrancando exactamente en y = 220. Última línea base de 4, 6 y 8 en y = 1190.
- [ ] Regla horizontal solo en 3, 5, 7. Regla vertical solo en 4, 6, 8. Ninguna en 1, 2, 9, 10.
- [ ] Cada par comparte número en la misma ranura: 01/01, 02/02, 03/03.
- [ ] **El acento aparece exactamente dos veces** y siempre sobre negro. Ni en etiquetas, ni en reglas, ni en paginación, ni en la firma.
- [ ] Contraste ≥ 7:1; opacidades nunca por debajo del 70 % sobre negro ni del 55 % sobre claro.
- [ ] Paginación de `02/10` a `09/10` arriba a la derecha; ausente en 1 y 10.
- [ ] Slide 10 con márgenes 160, sin paginación, sin etiqueta, sin regla de par, con firma.
- [ ] Ningún tamaño fuera de la escala cerrada.
- [ ] Todo alineado a la izquierda. Cero bloques centrados.
- [ ] Cero fotografías, iconos, ilustraciones, emoji y flechas decorativas.
- [ ] **Cero cifras de resultado.** El único número ajeno al copy es la paginación.
- [ ] Texto **idéntico** al copy aprobado: va la variante sin cambios, «El error:» literal.
- [ ] Fondos sólidos, sin transparencia. Menos de 10 MB.

## Los tres errores a evitar

1. **Llenar el aire.** Los slides 3, 5 y 7 tienen la mitad inferior vacía y los 4, 6 y 8 la
   superior. Si se rellena con un icono o una comilla grande, el latido desaparece y la pieza
   vuelve a ser la plantilla del 10-09 con otro texto.
2. **Codificar el error en rojo.** Rompe la regla de un solo acento y gasta en un slide
   intermedio la señal de color que debe llevar al mensaje privado. El error ya está codificado
   tres veces: negro, abajo, regla vertical.
3. **Desplazar el eje Y del titular cuando el texto es más corto.** Si el titular se centra en
   vez de anclarse arriba, al deslizar el texto salta y el argumento de la pieza —que esto es un
   sistema— se desmonta solo.
