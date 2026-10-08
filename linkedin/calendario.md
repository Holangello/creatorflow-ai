# Calendario editorial

**Fase actual: estructura y planning.** Aquí vive el plan. Las piezas no se redactan hasta que
Angello las pide. **Al 08-10 hay diecinueve piezas escritas en `cola/` y ninguna publicada todavía**, así
que la frase original de esta línea —«nada en `cola/` todavía»— llevaba semanas siendo falsa.

**Cómo se cuentan, porque se contó mal.** En `cola/` hay veintiún archivos `.md`. Uno es el README y otro
es `2026-10-01-carrusel-tres-cosas-cada-mes.md`, que es un **brief visual y no una pieza**. Piezas reales:
**diecinueve**. Durante semanas este documento y `05-metricas.md` dijeron «dieciocho fichas» cuando eran
diecisiete, por contar el brief visual como pieza. Es exactamente la clase de número que luego se cita como
línea base, y por eso se corrige aquí y no en una nota al pie.

**Estados:** `planificada` (título y descripción listos, sin redactar) · `creada` (pieza escrita
en `cola/`) · `publicada` (ya en LinkedIn; métricas a `05-metricas.md`).

**Cómo se pide una pieza:**
```
Maverick, escribe la pieza del 15 de septiembre.
Maverick, redacta la pieza de actualidad de hoy sobre [noticia].
```

## Estructura de la semana

| Día | Hora (Madrid) | Pilar | Función |
| --- | --- | --- | --- |
| Lunes | 09:30 | Autoridad | Tesis fuerte. La pieza más confrontativa de la semana |
| Martes | 12:30 | Prueba | Caso, resultado o proceso con cifra |
| Miércoles | 09:30 | **Actualidad** | Noticia de IA o audiovisual con opinión propia. Se sustituye si salta algo mayor |
| Jueves | 12:30 | Oferta | Cómo trabajamos, para quién, objeciones, disponibilidad |
| Viernes | 09:30 | **Humano / Autoridad, alternando** | Historia personal con lección de negocio, o tesis |

**Regla de alternancia del viernes, escrita el 08-10-2026 porque su ausencia costó tres viernes Humanos
seguidos.** La barra de «Humano / Autoridad» no es una opción libre: **viernes impares de ciclo = Humano,
viernes pares = Autoridad.** Y la cláusula que impide la recaída: **una pieza Humana desplazada no se
recupera en el viernes siguiente, se va al siguiente viernes Humano.** El fallo del 02 → 09 → 16 de octubre
fue exactamente eso — ir metiendo Humanas en el primer viernes libre.

**Cuándo se puede reasignar el pilar de una franja.** Lo que el algoritmo premia es consistencia de temática
y de formato, no que el jueves sea siempre a las 12:30; la hora es disciplina operativa de Angello y el
reparto de pilares es lo que evita que la cuenta se clasifique mal. Así que una franja se puede reasignar de
pilar cuando **(a)** el desvío acumulado del pilar supera una pieza completa, **(b)** el pilar que entra
tiene candidato sin dependencias de dato, y **(c)** queda escrito en la fila por qué. **Lo que no se toca
nunca es el miércoles de actualidad** —no es una preferencia de pilar, es el único hueco acoplado a un
proceso externo que no se puede precargar— **ni la hora.**

**Dos franjas, las dos pasadas las nueve.** La mañana se publica a las 09:30 y el mediodía a las
12:30. Antes la mañana estaba a las 08:15 y el viernes a las 09:00; se movió el 14 de septiembre a
petición de Angello. El cambio no es cosmético: una franja a la que no se llega despierto no es una
franja, es una excusa para no publicar.

**Recordatorios automáticos.** Tres avisos al móvil, de lunes a viernes:

| Hora | Qué hace |
| --- | --- |
| 09:20 | Diez minutos antes de la franja de la mañana. Pieza del día, versión elegida y dónde está el texto |
| 12:20 | Lo mismo para la franja de mediodía |
| 19:30 | Cierra el día: ¿salió la pieza? Y pide las cifras de las que cumplen 48 horas o 7 días |

Ninguno escribe contenido ni toca el radar. Si la pieza está bloqueada por un [DATO] sin confirmar,
el aviso lo dice en vez de mandar a publicar algo incompleto. Y los días en que no hay nada que
avisar, no suena nada: el silencio es el resultado correcto tres días de cada cinco.

El de las 19:30 es el que cierra el circuito que llevaba vacío desde el principio. Escribe en la
tabla de `05-metricas.md` solo lo que Angello conteste. Si no contesta, la casilla se queda vacía:
una casilla vacía es un dato correcto y un cero inventado destruye la línea base. A las tres piezas
medidas entra `linkedin-analyst` con el primer diagnóstico.

Las horas van en UTC, así que al cambiar la hora a finales de octubre hay que correr las tres.

Reparto resultante al mes: 30% autoridad, 20% prueba, 20% actualidad, 20% oferta, 10% humano.
Máximo una pieza de confrontación pura por semana.

---

## Semana 1 · 8 al 11 de septiembre

> El sistema quedó listo la noche del lunes 7, pasada ya la franja de la mañana, así que la
> semana arranca el martes. El caso de estudio (B1) sale de esta semana: está bloqueado por
> datos de cliente y no conviene tenerlo en el camino crítico. Vuelve en la semana 2 en cuanto
> Angello confirme las cifras.

| Fecha | Día | Pilar | Tipo | Título de trabajo | Descripción y ángulo | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 08-09 | Mar | Autoridad | A1 | El 90% del contenido corporativo no lo vería nadie si no lo pagaran · **elegida versión B** | Acusación al sector desde dentro, con autocrítica. Escena de reunión: "necesitamos un vídeo", "¿para qué?", silencio. Los tres síntomas de una marca sin sistema. Enemigo: el modelo de facturar piezas sueltas | Texto | Pura | tres versiones listas |
| 09-09 | Mié | Actualidad | N | Sora caduca en quince días · **elegida versión B+ (anclada)** | Radar del 8-09: OpenAI apaga la API de Sora el 24 de septiembre. La B se ancla a esa fecha y suma el riesgo de proveedor. Nivel 2 del protocolo. `cola/2026-09-09-actualidad-sora.md` | Texto | Método | creada |
| 10-09 | Jue | Oferta | C1 | A las agencias no les interesa venderte un sistema · **elegida versión B** | Carrusel con las 6 fases del SISTEMA MAKERS, regalado completo. Ataca el modelo de negocio del propio sector, Makers incluida. Cierra con "para quién no es" y CTA de palabra clave por DM | Carrusel | Método | tres versiones listas |
| 11-09 | Vie | Humano | D1 | Rechacé un proyecto y me llamaron arrogante | Historia de rechazar dinero por no encajar con el sistema. El insulto va en el gancho para desactivar al crítico. Refuerza la regla de no competir por precio. Desbloqueada con una cuarta versión que no necesita cifra · **elegida versión D** | Texto + foto | Pura | cuatro versiones listas |

## Semana 2 · 14 al 18 de septiembre

| Fecha | Día | Pilar | Tipo | Título de trabajo | Descripción y ángulo | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 14-09 | Lun | Autoridad | A3 | El briefing de 40 páginas no es rigor, es miedo a decidir | Ataque al proceso de aprobación por comité. Cuánto cuesta en semanas y en dilución del mensaje. Las 5 preguntas que sustituyen a un briefing entero. `cola/2026-09-14-briefing-40-paginas.md` | Texto | Pura | creada · tres versiones |
| 15-09 | Mar | Prueba | B1 | Tu agencia no te engaña: te da exactamente lo que pediste | Caso real de Makers en carrusel, desplazado desde la semana 1. Contexto, problema, qué cambiamos, resultado con cifra, qué puede replicar. **Requiere cliente y cifras autorizadas**. Tres versiones ya escritas | Carrusel | Método | tres versiones listas |
| 16-09 | Mié | Actualidad | N | El montador ya no busca el plano que falta: lo fabrica | Hueco fijo, **anclado tras el barrido del 13-09**. Adobe mete la generación de vídeo (y de música y ambientes) dentro de la línea de tiempo de Premiere y After Effects, con Veo, Kling, Runway y Luma elegibles desde la propia herramienta. Ángulo: traducción a negocio, no reseña de herramienta — qué partidas del presupuesto de producción dejan de sostenerse y qué pasa con lo ya firmado a precio de rodaje. IBC (11–14 sep) entra solo como frase de contraste: la feria enseñaba cámaras mientras el montaje empezaba a fabricar los planos; sus anuncios no mueven ninguna partida del ICP. **Refuerzo encontrado el 14-09:** el spot de Movistar con la Selección, 120 segundos al 95% con IA en prime time en España, necesitó entre 55 y 65 rondas de iteración, más de 5.130 recursos y más de 140 profesionales. Esa es la cifra que cierra la pieza: la herramienta se mete en la línea de tiempo, y aun así el trabajo real sigue siendo la iteración y la consistencia. Cifras de la propia productora, se citan como suyas. Redactada el 15 · `cola/2026-09-16-actualidad-plano-en-el-montaje.md` | Texto | Método | creada · tres versiones |
| 17-09 | Jue | Oferta | C3 | "El contenido lo hacemos dentro". Vale. ¿Cuánto os cuesta cada pieza? · **elegida versión A** | Objeción respondida con aritmética: 25 €/h × 9 h, ÷ 0,7, 430 € por pieza publicada. Sin atacar al equipo interno. Imagen 4:5 con la cuenta. `cola/2026-09-17-contenido-lo-hacemos-dentro.md` | Texto + imagen | Método | creada · tres versiones |
| 18-09 | Vie | Prueba | — | Qué mido en un proyecto y qué ignoro a propósito · **elegida versión B** | **Sustituye a B2**, que sigue bloqueada por cifras de cliente desde la semana 1. Sale del banco de reserva, que existe justo para esto. Eje de tiempo en vez de lista: qué se lee en el minuto 0, en la primera hora, a las 48 h y a los 7 días, y qué no se lee nunca. Enemigo: el informe mensual que justifica el gasto en vez de decidir el mes siguiente. Cero cifras. `cola/2026-09-18-que-mido-y-que-ignoro.md` | Texto | Método | creada · tres versiones |

> **Aparcada:** B2 «Mismo presupuesto, otro sistema» (antes y después con cifra). Salió del 18-09 porque
> lleva desde la semana 1 esperando cifras autorizadas de cliente. No está descartada: vuelve al primer hueco
> de Prueba en cuanto Angello confirme presupuesto, plazo y resultado. Mientras tanto no ocupa fecha, para que
> no vuelva a bloquear un viernes.

## Semana 3 · 21 al 25 de septiembre

| Fecha | Día | Pilar | Tipo | Título de trabajo | Descripción y ángulo | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21-09 | Lun | Autoridad | A1 | La IA no va a sustituir a tu equipo creativo. Tu falta de sistema sí | Contra el miedo. La IA amplifica lo que ya existe: si no hay criterio, produce más ruido más rápido. Tesis central del pilar de automatización | Texto | Pura | creada · reserva del 8-09 · `cola/2026-09-21-ia-no-sustituye-tu-equipo.md` |
| 22-09 | Mar | Prueba | B1 | Caso 2: [pendiente de elegir cliente] | Segundo caso de estudio. Angello elige el cliente y aporta cifras. Estructura obligatoria de caso | Carrusel | Método | planificada |
| 23-09 | Mié | Actualidad | N | Quién encarga un estudio forma parte del estudio · **elegida versión A** | Estudio de Public First encargado por Google, presentado con San Sebastián en marcha. **La A no lleva ni una cifra:** se eligió así porque la verificación en blog.google no llegó y ese dominio está bloqueado desde la sesión. La tesis no necesitaba números — quién encarga un estudio forma parte del estudio, y un informe que mide el ahorro no mide qué pasa con lo ahorrado. La B y la C quedan bloqueadas con sus cifras marcadas. `cola/2026-09-23-quien-paga-el-estudio.md` | Texto | Método | creada · tres versiones |
| 24-09 | Jue | Oferta | C2 | Plazas de retainer para Q4: para quién no es · **elegida versión A** | **Sin cifra de plazas, y a propósito.** El dato no llegó, así que la A se construyó para no necesitarlo: la restricción de Q4 deja de ser de agenda y pasa a ser de criterio — no se entra porque quede hueco, se entra porque encaja. Así no suena a escasez fabricada, que es lo que el pilar prohíbe. Usa la apertura por expulsión que quedó reservada el 10-09. La B y la C llevan el número marcado y quedan disponibles. `cola/2026-09-24-para-quien-no-es.md` | Texto | Método | creada · tres versiones |
| 25-09 | Vie | Autoridad | D2 | Encuesta: ¿qué frena de verdad vuestro contenido? | Encuesta con 4 opciones que dividen al ICP (presupuesto, tiempo, criterio, aprobaciones). En el primer comentario, el voto de Angello y por qué | Encuesta | Método | planificada |

## Semana 4 · 28 de septiembre al 2 de octubre

| Fecha | Día | Pilar | Tipo | Título de trabajo | Descripción y ángulo | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
**Tres días sin redactar: 25, 28 y 29.** No fue una decisión editorial. Las rutinas de esos días se
dispararon y sus avisos llegaron todos juntos, ya caducados, la tarde del 29. Cuando hubo sesión para
trabajarlos, los tres huecos ya habían pasado. **No se recuperan y no se rellenan a posteriori:** un post
fechado hacia atrás no es una pieza publicada, es papel. Las tres ideas vuelven al banco de reserva y
entran cuando toque su pilar — la encuesta del 25 y el dron del 28 no caducan, y el error de rodaje del 29
tampoco. Queda escrito para que la fila vacía se lea como lo que es: un fallo de canal, no una semana sin
nada que decir.

| 28-09 | Lun | Autoridad | A1 | Si tu vídeo empieza con un dron sobre el edificio, ya has perdido | Ataque a un tópico visual que casi todos han pagado. Matemática de atención en los 3 primeros segundos. La decisión que se toma antes de encender la cámara | Vídeo | Pura | planificada |
| 29-09 | Mar | Prueba | B3 | El error que costó un día entero de rodaje | Historia de un fallo propio y el sistema que se montó para que no se repita. Vulnerabilidad usada como prueba de proceso | Texto | Método | planificada |
| 30-09 | Mié | Actualidad | N | Pagaste por un vídeo y lo que generaste fue un dataset · **elegida versión A** | Hueco fijo, anclado en el barrido del 29-09. ALÍA reunió en las actividades de Industria del Festival de San Sebastián una mesa sobre IA en el pipeline audiovisual y la palabra que la atravesó fue *trazabilidad*. Ángulo: traducción a negocio, no crónica de mesa redonda — el sector lo discute como ingeniería y para el ICP es una cláusula del contrato de producción que firma sin leer. Enemigo: el modelo de contrato que solo habla del entregable final; nunca una productora. **Cero cifras en las tres versiones, y no por bloqueo: la noticia no tiene ninguna.** Maverick corrigió las tres antes de guardar: situaban la mesa «el lunes», que es la fecha de la crónica y no la del debate. `cola/2026-09-30-la-clausula-que-falta.md` | Texto | Método | creada · tres versiones |
| 01-10 | Jue | Oferta | C1 | Qué recibe un cliente cada mes · **elegida versión A** | **El encargo pedía un desglose literal del entregable mensual, y ese entregable no está documentado en el repositorio:** no consta el número de piezas, ni el formato del informe, ni los días de antelación del calendario. Inventárselo habría sido la misma falta que inventarse una cifra de cliente. La salida fue cambiar el eje — **describir la forma del entregable y no su cantidad**: qué llega, en qué orden y para qué sirve cada cosa. La A no lleva ninguna cifra, ningún precio ni ningún plazo. Ritmo de pares: entregable, error, entregable, error. Enemigo doble: el informe que defiende la factura y la opacidad como modelo. No repite las seis fases del 10-09 ni la apertura por expulsión del 24-09. `cola/2026-10-01-que-recibe-cada-mes.md` | Carrusel · 10 slides | Método | creada · tres versiones |
| 02-10 | Vie | Humano | D1 | El sistema estaba montado. Lo que faltaba era publicar | **Sustituye a la pieza biográfica**, que queda aparcada: su fila pedía desde el principio que Angello confirmara los datos que quería contar y no han llegado. Una biografía no se inventa, y tampoco se escribe con marcas de [DATO] — un relato personal con huecos no es una pieza, es un formulario. Lo que sí hay es material verdadero y comprobable: el sistema lleva semanas funcionando con calendario, radar, banco y panel, y hay piezas escritas sin publicar. Eje: el sistema no falla donde todos miran, falla en el último metro. Enemigo: confundir estar preparado con estar publicando. Cero cifras y cero psicología inventada. Las tres versiones son **tres grados de exposición personal**, no tres estilos, porque cuánto contar es decisión suya. **Pasa a solo texto:** una confesión no necesita retrato, y la foto se queda con la pieza biográfica para cuando vuelva | Texto | Pura o método según versión | creada · tres versiones |
| — | — | Humano | D1 | **Aparcada:** «Por qué me fui de Perú a Madrid a montar esto» | Vuelve al primer hueco Humano **en cuanto Angello dé tres cosas:** qué parte de la historia quiere contar en público, qué detalle concreto hace de bisagra (la decisión, no el trayecto) y qué lección de negocio quiere que se lleve el lector. Sin esas tres, no se escribe. Mantiene el formato texto + foto propia | Texto + foto | Método | bloqueada |

---


## Semana 5 · 5 al 9 de octubre

**Planificada el 02-10.** Cuatro de las cinco piezas no necesitan ni un dato sin confirmar, y eso es
deliberado: después de un mes en el que cuatro piezas se quedaron esperando cifras que no llegaron, la
semana se construye con material que ya existe o que es criterio propio de Angello. Las tres que salen
del banco de reserva se eligen por eso.

| Fecha | Día | Pilar | Tipo | Titular de trabajo | Notas | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 05-10 | Lun | Autoridad | A1 | El volumen dejó de ser el cuello de botella · **elegida versión B** | **Anclada en material de apoyo, no en noticia.** Runway anuncia Runway Ads, un motor que genera creatividades de vídeo e imagen desde las guías de marca, las publica en Meta, Google y TikTok, lee el rendimiento de vuelta y produce la siguiente ronda con lo que se ha llevado la inversión. La frase que lo convierte en pieza de autoridad la dice el propio fabricante: las empresas están limitadas por su capacidad de producir creatividades, no por su analítica ni por su intuición. La tesis de Angello es la vuelta de esa frase — cuando el volumen sale gratis, lo único escaso que queda es saber qué decir, y eso no lo da ningún agente. Cifras del propio Runway sobre su propio programa, citadas como suyas. Maverick cortó una frase inventada de la versión elegida: afirmaba que Runway multiplicó su volumen «con el mismo equipo», y la página no dice nada del tamaño de su equipo. `cola/2026-10-05-volumen-gratis-criterio-escaso.md` | Texto | Pura | creada · tres versiones |
| 06-10 | Mar | Prueba | B1 | El código a la vista · **elegida versión A** | **Corrección de Maverick del 05-10, y es un error mío.** El viernes planifiqué esta fila diciendo que «el sistema existe en este repositorio, en `tools/rename_clips.py`, así que la prueba es el propio script». **Lo escribí sin abrir el archivo.** Al abrirlo: son catorce líneas que renombran todos los ficheros de una carpeta a `clip_0001`, `clip_0002`… Eso no es un sistema de nombres. Es un renumerador que **borra** la información que un sistema de nombres existe para conservar: fecha, proyecto, cámara, escena, toma. Y además recorre `os.listdir` sin ordenar, así que el número que te asigna no corresponde a ningún orden real. No se puede escribir «el sistema que nos ahorra horas» sobre esto sin inventarse el sistema. **El eje nuevo es el único honesto y además es mejor:** el script es la prueba, pero la prueba de otra cosa — de automatizar antes de haber decidido qué problema se resuelve. Catorce líneas que ejecutan perfectamente una decisión que nunca se tomó. Enlaza con la pieza del lunes sin repetirla: allí el mismo error a escala de 900 anuncios por semana, aquí a escala de una carpeta. El script es público en el repositorio, así que cualquiera puede comprobar las catorce líneas. `cola/2026-10-06-script-problema-no-definido.md` | Texto | Método | creada · tres versiones |
| 07-10 | Mié | Actualidad | N | Las primeras cifras del sitio nuevo las firman los socios de quien lo abrió | **Reverificada y corregida el 06-10.** Ayer anclé esta fila sobre la página equivocada de OpenAI: la que cité está fechada el 5 de **mayo** y de ahí salían el Ads Manager y la puja por CPC. El anuncio del 5 de octubre es otro, «Building advertising for the way people use AI», y lleva la fecha visible en la propia página. **El anuncio real es más pequeño y mejor para la pieza:** formato de anuncio visual en ChatGPT, probado solo durante la generación de imágenes, **este mes, en EE. UU. y con un grupo inicial de anunciantes.** Doble eje: las tres cifras que avalan el canal las firma cada una un socio de medición que es socio del propio lanzamiento, sobre una sola marca y sin método a la vista —el «quién encarga un estudio» del 23-09 con sello de independencia encima—; y el dato accionable que nadie le va a dar a un director de marketing en España es que **este mes no hay nada que comprar**. Cierra la trilogía de la semana. `cola/2026-10-07-cifras-de-los-socios.md` | Texto | Método | creada · tres versiones |
| 08-10 | Jue | Oferta | C3 | Las tres opciones de propuesta y por qué nunca doy una sola cifra | Sale del banco de reserva. Objeción respondida desde el método de presupuestar, no desde el precio. **Escrita el 07-10 y es la primera pieza de la semana que no espera a nadie:** cero cifras, cero `[DATO]`, las tres versiones publicables tal cual. El eje es que una cifra única sobre un briefing sin cerrar no es un precio, es una apuesta, y que las tres opciones existen para que el cliente elija **alcance** y no precio — la propuesta como último sitio donde el briefing se cierra por escrito. Elegida A, la única sin ninguna frase que necesite un sí de Angello. `cola/2026-10-08-tres-opciones-de-propuesta.md` | Texto | Método | creada · tres versiones |
| 09-10 | Vie | Humano | D1 | Cómo decido si un cliente va a ser un problema en la primera llamada | Sale del banco de reserva. **Escrita el 08-10, y el enemigo quedó girado 180 grados respecto a lo planificado.** La forma fácil de esta pieza era quejarse de clientes, y eso rompe dos reglas a la vez: el enemigo tiene que ser una práctica, y el ICP *es* el cliente. Las señales no son defectos de nadie, son formas de decidir; y el que sale señalado es el proveedor —Angello— que las ve y firma igual porque hay que cerrar el mes. Segunda pieza seguida sin cifras y sin `[DATO]`. Elegida C, la única en la que el conflicto está dentro de él. **Las tres versiones las escribí yo: los subagentes no estaban disponibles en la sesión.** **Auditada el 08-10 a petición de Angello, por ser la única pieza del sistema que no pasó por el redactor, y con una corrección:** la versión elegida decía «lo que aprendí no fue que *aquel proyecto* fuera difícil… y después *lo conté* como mala suerte». Eso no es admisión en patrón, es un **episodio** — afirma un proyecto singular y afirma algo que Angello habría dicho en público sobre él. Corregido a patrón («los he firmado sabiendo cómo iban a acabar») y partida la frase de 22 palabras del pivote. Lo demás aguanta: ganchos remedidos (A 149, B 120, C 137), enemigo girado al proveedor, cero cifras, cero `[DATO]`, un solo CTA. **La longitud de frase no era un defecto de esta pieza:** 20 frases de más de 15 palabras sobre 105, y el 7-10 va en 24 sobre 101 — es una deriva de toda la casa. **La auditoría también la hice yo: el tool de agentes tampoco existe hoy.** `cola/2026-10-09-la-senal-y-la-factura.md` | Texto | Método | creada · tres versiones |

## Semana 6 · 12 al 16 de octubre

**Planificada el 08-10, y es la primera semana entera en la que ninguna de las cinco filas depende de un
dato que Angello no haya dado.** Cero cifras de cliente, cero precios, cero plazos, ningún `[DATO]`. No es
un adorno: en septiembre cuatro piezas se quedaron esperando cifras que no llegaron, y en la semana 5 las
dos únicas que no esperaban a nadie fueron las dos últimas. Aquí esa condición es el criterio de selección,
no el resultado.

**Tres decisiones tomadas a propósito y escritas para que no se relean como descuido:**

1. **Confrontación pura: solo el lunes 12.** De martes a viernes, confrontación con método. El techo de la
   casa es uno por semana y esta semana se gasta el primer día.
2. **El miércoles 14 queda abierto al radar y sin tema fijo.** Es un hueco, no una fila a medio escribir.
   Lo que lleva la fila es el protocolo y la escalera de respaldo, no un titular.
3. **El jueves 15 es carrusel, y la razón es de formato, no de contenido.** La semana 5 fueron cinco piezas
   de solo texto seguidas y la última pieza visual es del 01-10. Un mes sin un carrusel es un hueco de
   formato, no una decisión. El pilar que mejor lo aguanta es Oferta: un carrusel se guarda, y lo que se
   guarda vuelve.

Las cinco filas quedan en `planificada`. **No se redacta nada**: la redacción ocurre pieza a pieza cuando
Angello la pide. Y hoy, además, no podría hacerla el redactor — el tool de agentes no existe en esta sesión
(`Agent` y `Task` devuelven «no such tool available»), por segundo día seguido.

| Fecha | Día | Pilar | Tipo | Titular de trabajo | Notas | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12-10 | Lun | Autoridad | A1 | Cambiar de proveedor cada año no es optimizar el gasto. Es volver a pagar la curva | Sale del banco de Autoridad («el coste real de cambiar de proveedor audiovisual cada año»). **Es la confrontación pura de la semana y la única.** Enemigo: la práctica de volver a concurso cada año y decidir por precio; jamás un proveedor, un sector ni una empresa identificable. Dolor no dicho: «cada enero vuelvo a explicar mi marca desde cero y lo presento en comité como un ahorro». **Cero cifras, y esta vez cuesta:** la tentación de esta pieza es un rango de euros de coste de arranque, y Angello no ha dado ninguno — así que el coste se cuenta en lo que se vuelve a pagar (el aprendizaje de la marca, el criterio que se fue con el anterior, los dos primeros meses en los que nadie acierta el tono), nunca en dinero. **Riesgo declarado, y se desactiva dentro del post, no en esta ficha:** es un argumento que beneficia a quien lo firma, un proveedor defendiendo la continuidad. Si no concede en voz alta cuándo cambiar **sí** es lo correcto —cuando el proveedor dejó de decidir y se convirtió en un par de manos— la pieza suena a defensa de su propio retainer y no sale. No solapa con 24-09 ni con 08-10: allí se hablaba de entrar y de presupuestar, aquí de salir y de lo que se queda por el camino. CTA de atracción sin estrenar en la cuenta: guardarla para la conversación de renovación. No repite dilema A/B (5-10), inventario (6-10), DM (8-10) ni señal propia (9-10). **Escrita el 08-10 por `linkedin-copywriter`, que hoy sí estaba disponible.** Elegida la B, «La mitad que nadie firma»: es la única que no culpa a nadie —absuelve por escrito al responsable de compras, al que le miden por ahorro conseguido— y ataca el sistema de incentivos en lugar de la decisión, así que el lector no tiene que defenderse antes de poder estar de acuerdo. La concesión está en el cuerpo de las tres, como exigía el brief. Cero cifras y ningún `[DATO]`. Ganchos medidos: 142, 156 y 156. `cola/2026-10-12-volver-a-pagar-la-curva.md` | Texto | Pura | creada · tres versiones |
| 13-10 | Mar | Prueba | B3 | Un mes de contenido no se graba pieza a pieza | Sale del banco de Prueba, **y entra sin su cifra.** La entrada decía «cómo montamos un mes entero de contenido en dos días de rodaje» y **los dos días se caen**: es un dato sobre la operación de Makers que Angello no ha confirmado. La pieza se escribe sin él y no se nota; si lo confirma, entra como refuerzo. **Por qué no un caso:** B1 y B2 llevan bloqueadas por cifras de cliente desde la semana 1 y no se vuelve a poner una Prueba en el camino crítico. **Por qué no el repositorio otra vez:** el 02-10 y el 06-10 ya usaron este repo como prueba — una tercera vez seguida deja de ser transparencia y se convierte en un tic. La prueba aquí es el método propio, que Angello puede validar de un vistazo porque es su oficio: el orden de decisiones que permite agrupar un mes (bloque de mensaje, localización, luz, vestuario) frente a producir bajo pedido. Enemigo: el encargo suelto, la pieza pedida de una en una, que multiplica arranques, traslados y rondas de aprobación. Dolor no dicho: «las pido de una en una y luego discuto el coste por pieza». **Sin escena:** presente de método, no el relato de un rodaje concreto. **Texto y no vídeo, a propósito:** un B3 en vídeo depende de material de rodaje de Angello, que es exactamente la dependencia que mantiene bloqueadas dos piezas desde el 10-09. CTA de conversación, binario y contestable en tres segundos | Texto | Método | planificada |
| 14-10 | Mié | Actualidad | N | **[Hueco abierto al radar · sin tema fijo]** | **Esta fila se queda abierta a propósito.** Ancla en el barrido del 13-10 y quedan tres barridos antes (9, 12 y 13). Condición de entrada, sin excepción: **fuente primaria abierta y leída**, nunca prensa secundaria ni agregador. Es la regla que impidió publicar las cifras del estudio de Google el 23-09 y la que falló el 5-10 al dar por buena una fecha de prensa. **Lo que hay hoy y por qué no sirve:** las dos pendientes del 1-10 (los tres modelos de voz de Microsoft AI y el vídeo a vídeo de Tavus) tienen seis dominios inalcanzables desde esta sesión y ninguna de sus cifras leída en primaria; ya hay contradicciones entre secundarias («10+ idiomas» frente a 23) y la cifra de Tavus es del fabricante, sobre 54 participantes y sobre un modelo que no es el que vende. **Escalera de respaldo para la noche del 13, por orden:** (1) noticia nueva verificada en primaria en cualquiera de los tres barridos; (2) si los dominios se abren, la de voz **como categoría y no como anuncio de producto** — dos fabricantes distintos diciendo que una voz se reproduce desde una muestra mínima, con los 10 segundos de ElevenLabs al lado y cada cifra con su autor delante; Tavus solo con sus dos advertencias delante del número; (3) derechos de imagen y voz **por el lado de la autorización de quien sale en cámara**, nunca por la propiedad de los brutos, que es el 30-09 — a 14 de octubre hay dos semanas de distancia, que es lo que el radar pedía, y solo con material de apoyo ya verificado; (4) si no hay nada de eso, **el hueco no se rellena con una reseña de producto ni con un resumen sin tesis**: pasa a la Autoridad del banco («por qué la coherencia vende más que la creatividad») y esa semana el miércoles deja de ser actualidad. **Lo que no se hace en ningún caso es publicar una cifra no leída en primaria para no dejar el miércoles vacío.** La ley española de protección civil del honor sigue **no citable**: no se ha localizado la referencia del Consejo de Ministros ni el texto en el Boletín de las Cortes | Texto | Método | planificada · hueco abierto |
| 15-10 | Jue | Oferta | C3 | Lo que tiene que estar de tu lado para que esto salga | **Carrusel por decisión de formato** (ver punto 3 arriba). **Ángulo nuevo para un pilar saturado:** Oferta lleva cinco ángulos seguidos de precio o de propuesta (10-09, 17-09, 24-09, 01-10, 08-10), así que este **no toca el dinero por ningún lado.** Va de la mitad del trabajo que no se factura y que casi nadie pide por escrito: material, accesos, una persona que conteste en plazo, quién decide. **Enemigo doble, las dos prácticas:** vender producción como llave en mano, y la costumbre del propio proveedor de no pedir nada por escrito para no parecer complicado en la llamada de cierre. Dolor no dicho, y es el que evita que esto sea un reproche al cliente: «el proyecto se retrasó por mi lado y dentro de casa lo conté como retraso del proveedor». **El giro que mantiene al ICP a salvo:** la lista no es una exigencia, es una prueba del algodón que el lector aplica a su proveedor actual — si no te ha pedido esto, no ha planificado. Semilla ya sembrada el 09-10 («nadie pregunta qué hace falta de su lado») y sin solape: allí era una señal en una llamada, aquí es el contenido de un documento. **Cero cifras y ningún `[DATO]`:** no dice cuántas piezas, ni plazos, ni precios. La lección del 01-10 —el entregable mensual no estaba documentado en el repositorio— es que se describe la forma y no la cantidad. CTA de captación por DM con palabra distinta de «alcance», gastada el 08-10: la palabra es **«mitad»**. **Escrita el 08-10: copy de `linkedin-copywriter`, brief visual de `linkedin-designer`. Es la primera pieza del sistema que ha pasado por la cadena completa como está diseñada.** Elegida la A, la que mejor protege al ICP porque asume la culpa del proveedor antes de mirar al lector. **Retipada: no es un C3.** No hay objeción literal, ni coste de la alternativa, ni CTA de precio; con la etiqueta C3 habría sido el cuarto C3 consecutivo y el recuento de tipos habría mentido. Abre el **eje 4 de Oferta, «Responsabilidad compartida»**, que se ha escrito en `02-tipos-de-contenido.md` a partir de esta pieza. **La versión 3 queda declarada no elegible por un defecto de premisa**, no de redacción: pone en boca de Angello el dolor del cliente («se retrasó por mi lado y lo conté como retraso del proveedor») cuando él es el proveedor de esa misma historia. Ganchos medidos: 111, 133 y 115. `cola/2026-10-15-lo-que-tiene-que-estar-de-tu-lado.md` | Carrusel · 8 slides | Método | creada · tres versiones |
| 16-10 | Vie | **Autoridad** | A2 | Por qué un logo no es una marca y qué es lo que sí | **Esta fila cambió de pilar el 08-10, y el motivo está en la nota de reparto de abajo.** Era Humano con «Lo que hago los días en que no tengo ninguna idea», lo que habría dejado **tres viernes Humanos seguidos** (02-10, 09-10, 16-10) y Autoridad en 24,1 % frente al 30 % objetivo. **No rompe ninguna franja:** el viernes es «Humano / Autoridad» en `01-estrategia.md` §6, y la nota anterior afirmaba lo contrario sin comprobarlo. La pieza Humana desplazada **no se pierde: se va al siguiente viernes Humano, el 30-10**, por la cláusula de desplazamiento que acaba de escribirse — no caduca y no depende de ningún dato. Candidato de Autoridad elegido por ser el único del banco **sin una sola dependencia**: criterio propio en presente, cero cifras, cero `[DATO]`, y preserva intacta la propiedad que define esta semana. Intensidad método, porque la confrontación pura ya se gastó el lunes 12 | Texto | Método | planificada |

### Brief visual · jueves 15 · carrusel «Lo que tiene que estar de tu lado»

**Sustituido el 08-10 por el brief real de `linkedin-designer`, que vive en la ficha de la pieza:**
`cola/2026-10-15-lo-que-tiene-que-estar-de-tu-lado.md`. El borrador que había aquí lo escribió Maverick
porque ese día el tool de agentes no existía, y él mismo lo marcó como orientativo. El diseñador lo
contradice en cuatro puntos con razones mejores: el orden de la lista, el número de slides dedicados al
problema, y sobre todo **qué palabra exacta lleva el acento en cada slide** — dejarlo a criterio del
maquetador es lo que produce carruseles con acento en cinco sitios.

Lo que queda aquí es solo el encabezado operativo: **PDF de 8 páginas, 1080 × 1350 px, por debajo de 2 MB,
tipografía pura sobre negro, un solo acento por slide y el 07 sin nada de color.** Todo lo demás —escala
tipográfica de nueve niveles, coordenadas slide a slide, contrastes medidos y los once pasos de
producción— está en la ficha.

**Lo que esta semana desequilibraba, y la corrección. Esta nota se reescribió entera el 08-10 porque la
versión anterior se equivocaba en sus tres afirmaciones**, y las tres se verificaron contra los archivos:

1. **No eran dos viernes seguidos de Humano. Eran tres:** 02-10, 09-10 y 16-10. La nota anterior se olvidaba
   del 02-10, que es `D1 Humano`.
2. **El «20 % humano» no sale en ninguna ventana defendible.** Sobre las seis semanas es 13,8 %; sobre el mes
   rodante, 15 %; sobre octubre al día 16, 25 %. El 20 % era el único número que no aparecía en ninguna
   cuenta.
3. **«No se arregla moviendo el viernes 16, que es franja Humano» era falso.** La franja del viernes es
   literalmente **«Humano / Autoridad»**, en `01-estrategia.md` §6 y en la tabla de estructura de este mismo
   documento. Poner Autoridad el 16 **no rompe ninguna franja: no había nada que romper.** Toda la
   justificación para aplazar la corrección a la semana 7 se apoyaba en una franja que no existe.

**Recuento real, semanas 1 a 6, 29 piezas:**

| Pilar | Piezas | Real | Objetivo | Desvío |
| --- | --- | --- | --- | --- |
| Autoridad | 7 | 24,1 % | 30 % | **−1,7 piezas** |
| Prueba | 6 | 20,7 % | 20 % | +0,2 |
| Actualidad | 6 | 20,7 % | 20 % | +0,2 |
| Oferta | 6 | 20,7 % | 20 % | +0,2 |
| Humano | 4 | 13,8 % | 10 % | **+1,1 piezas** |

El desvío es **pequeño en magnitud y grande en concentración**: todo el exceso de Humano estaba en tres
viernes consecutivos.

**La causa no era una pieza mal colocada: era una regla que no estaba escrita.** La parrilla de cinco franjas
produce el 30/20/20/20/10 exacto, pero solo si el viernes **alterna estrictamente** Humano / Autoridad. Sin
esa regla, nada impide que el viernes se llene con lo que haya disponible, y es exactamente lo que pasó: el
18-09 el viernes tapó una Prueba bloqueada, y desde el 02-10 el viernes era Humano por defecto, no por
alternancia. **La barra de «Humano / Autoridad» sin regla detrás era la grieta.** Ya está escrita, arriba en
la tabla de estructura y en `01-estrategia.md` §6.

**Y la corrección que se había propuesto no corregía nada, por un error de clasificación.**
`02-tipos-de-contenido.md` coloca **D2 «Encuesta con criterio» dentro de «D. Humano»**, junto a D1. La fila
del 25-09 la etiquetó «Autoridad» y esta nota heredó el error. D2 tiene **fase** de atracción, y la fase no
es el pilar. Consecuencia: poner la encuesta el viernes 23 habría sido un **cuarto viernes Humano
consecutivo** presentado como corrección del exceso de Humano. Eso es contabilidad creativa, no corrección.

**Lo que se hace en su lugar, y se hace dentro de la semana 6:** el **viernes 16 pasa a Autoridad** y «Lo que
hago los días en que no tengo ninguna idea» **se mueve al siguiente viernes Humano, el 30-10**, según la
cláusula de desplazamiento que acaba de escribirse. No caduca y no pierde nada esperando dos semanas.
Resultado: **Autoridad 27,6 %, Humano 10,3 %** — Humano clavado en objetivo, Autoridad a media pieza del
suyo. Y octubre al día 16 pasa de 16,7/25 a 25/16,7 en Autoridad/Humano.

**El 23-10 no se puede dar por corregido** hasta que se decida qué es D2: o vuelve a Humano, que es donde la
pone el catálogo, o se reescribe como pieza de Autoridad con tipo propio y se dice. Con la etiqueta actual no
vale.

---

## Temas en reserva (banco de ideas)

Para rellenar huecos, sustituir una pieza bloqueada por falta de datos, o alimentar octubre.

**Revisado el 08-10 al planificar la semana 6.** Hasta hoy el banco era una lista de títulos y había que
reabrir la discusión cada vez que se usaba uno. Ahora cada entrada gastada queda marcada con la fecha en
que se gastó, y cada entrada bloqueada lleva escrito **qué le falta**, para que nadie la elija un viernes
sin darse cuenta de que depende de un dato que no existe. Marcas: `gastada` · `bloqueada` · sin marca =
disponible.

**Y se recuperan aquí tres ideas que la semana 4 declaró devueltas al banco y nunca llegaron a entrar.** La
nota del 29-09 decía que la encuesta del 25, el dron del 28 y el error de rodaje del 29 volvían a reserva,
pero el banco se quedó sin ellas. Sus filas siguen en estado `planificada` en las semanas 3 y 4; **no se
les cambia el estado** —esas tablas alimentan mapas paralelos que no toco— pero las ideas viven desde hoy
aquí, que es donde se pueden elegir.

**Autoridad**
- Carrusel A4 «Las 5 preguntas que sustituyen a un briefing de 40 páginas» (reservado de la versión A del 14-09; octubre).
- Encuesta D2 «¿Qué frena de verdad vuestro contenido?» — 4 opciones que dividen al ICP: presupuesto, tiempo, criterio, aprobaciones. En el primer comentario, el voto de Angello y por qué. **Recuperada del 25-09**, que se perdió por un fallo de canal, no por decisión editorial. Una encuesta no caduca. **Candidata asignada al viernes 23-10**, para corregir la deriva de reparto que deja la semana 6 (ver nota al final de la semana 6).
- «Si tu vídeo empieza con un dron sobre el edificio, ya has perdido» — vídeo, A1, confrontación pura. **Recuperada del 28-09.** `bloqueada` por formato: en vídeo depende de material de rodaje de Angello. Escribible hoy solo si se pasa a texto, y entonces hay que revisar que no choque con el lunes 12, que también es A1 de confrontación pura.
- Por qué la coherencia vende más que la creatividad. **Es el respaldo nivel 4 del hueco de actualidad del 14-10.**
- "Cobrar barato no te hace competitivo, te hace prescindible." — `bloqueada` por público: tal cual está, le habla al proveedor, y aquí no se escribe para colegas. Entra solo girada al que compra: lo que acaba pagando quien elige por precio.
- Las 5 preguntas que hago antes de aceptar un proyecto. — Revisar solape con el 09-10, que ya usó tres señales de cualificación de la primera llamada.
- Por qué un logo no es una marca y qué es lo que sí.
- El coste real de cambiar de proveedor audiovisual cada año. — `gastada` el 12-10.
- Lo que un director creativo hace de verdad todo el día.

**Prueba**
- Cómo montamos un mes entero de contenido en dos días de rodaje. — `gastada` el 13-10, **y sin la cifra**: los «dos días» son un dato de la operación de Makers que Angello no ha confirmado y la pieza se planifica sin él.
- El error que costó un día entero de rodaje (B3). **Recuperada del 29-09.** `bloqueada`: es un episodio, y la regla de no-episodio no se relaja. Necesita que Angello diga qué pasó y qué parte se puede contar en público.
- Caso de estudio B1 con cliente y cifras autorizadas. `bloqueada` desde la semana 1. **Recuperada del 22-09**, que quedó como «caso 2: pendiente de elegir cliente». Necesita tres cosas: cliente, autorización escrita y cifras.
- B2 «Mismo presupuesto, otro sistema» (antes y después con cifra). `bloqueada` desde la semana 1: necesita presupuesto, plazo y resultado autorizados.
- El sistema de nombres de archivo que nos ahorra horas. — **muerta, y queda escrito por qué.** El 06-10 se abrió `tools/rename_clips.py`: son catorce líneas que renumeran y borran la información que un sistema de nombres existe para conservar. No hay sistema que contar. El script ya se usó como prueba de lo contrario y ese tema está cerrado.
- Antes y después de una identidad audiovisual. — `bloqueada`: necesita cliente y autorización de imagen.
- Qué mide Makers en un proyecto y qué ignora deliberadamente. — `gastada` el 18-09.

**Actualidad (ángulos recurrentes)**
- Cada anuncio de modelo generativo de vídeo: qué cambia y qué no en un rodaje real.
- **Lo que automatizo con IA y lo que no pienso automatizar nunca** (vuelve a reserva el 22-09, sin gastar: la desplazó el estudio de Google en el hueco del 23. El tema no caduca y el texto existe como versión C del 9-09).
- AI Act: plazos y qué debe tener firmado una empresa que usa IA en campañas.
- Derechos de imagen y voz sintética en publicidad en España. — **Entra por la autorización de quien sale en cámara, nunca por la propiedad de los brutos**, que ya es el 30-09. Es el respaldo nivel 3 del hueco del 14-10. La ley española de protección civil del honor sigue **no citable** hasta localizar la primaria.
- Cada actualización de formatos o especificaciones de vídeo en LinkedIn.
- Campañas de marcas grandes hechas con IA y la reacción del público.

**Oferta**
- Las tres opciones de propuesta y por qué nunca doy una sola cifra. — `gastada` el 08-10.
- Lo que tiene que estar del lado del cliente para que un proyecto salga. — `gastada` el 15-10.
- Por qué no trabajamos por horas. — Disponible, pero **aplazada a noviembre por saturación**: Oferta lleva cinco ángulos seguidos de precio o de propuesta (10-09, 17-09, 24-09, 01-10, 08-10) y este es un sexto. No está bloqueada por datos; está bloqueada por repetición.
- Qué pasa en los primeros 30 días de un retainer. — `bloqueada` por el mismo fallo que casi tumbó el 01-10: **el onboarding de un retainer no está documentado en este repositorio.** No consta qué ocurre, en qué orden ni con qué hitos. Se desbloquea cuando Angello lo describa, o se reescribe por la forma y no por el calendario, como se hizo el 01-10.

**Humano**
- Lo que hago los días en que no tengo ninguna idea. — `gastada` el 16-10.
- Cómo decido si un cliente va a ser un problema en la primera llamada. — `gastada` el 09-10.
- El proyecto del que más aprendí y menos cobré. — `bloqueada`: es un episodio. Necesita que Angello diga qué proyecto, qué cifra se puede decir (o ninguna) y qué lección quiere que se lleve el lector.
- Qué le diría al Angello que empezaba. — `bloqueada` por público: tal cual está es consejo a creadores, y aquí no se escribe nunca para colegas ni para «la comunidad». Entra solo si cada lección se traduce a una decisión que un director de marketing reconozca como suya.
- «Por qué me fui de Perú a Madrid a montar esto». — `bloqueada` desde la semana 4. Necesita las tres cosas de siempre: qué parte quiere contar en público, qué detalle hace de bisagra y qué lección de negocio cierra. Se queda la foto propia reservada para ella.
