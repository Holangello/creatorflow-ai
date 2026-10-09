# Calendario editorial

**Fase actual: inventario. Se abre la tienda antes de construir el almacén número dos.** Aquí vive el
plan. **Al 08-10 hay veintidós piezas escritas y ninguna publicada.** A partir de hoy, **ninguna franja se
rellena con una pieza nueva si hay inventario escrito que la cubra**, y no se redacta una pieza nueva hasta
que haya una publicada. La regla entera está al principio de la semana 6.

**Cómo se cuentan, porque se ha contado mal tres veces y hoy se cuenta bien.** En `cola/` hay
**veintiún archivos `.md`**. Uno es el README y **dos son briefs, no piezas**:
`2026-10-01-carrusel-tres-cosas-cada-mes.md` (brief visual) y `2026-09-10-carrusel-sistema-makers.md`
(brief de producción; su copy vive en el banco). **Fichas de pieza en `cola/`: dieciocho.**

**Y `cola/` no es todo el inventario.** Cuatro piezas escritas no tienen ficha en `cola/` porque su copy
vive solo en el banco: 08-09, 10-09, 11-09 y 15-09. **Piezas escritas en total: veintidós**, y el banco
tiene exactamente veintidós entradas, que es la comprobación independiente. La versión anterior de esta
nota decía «piezas reales: diecinueve» contando un solo brief de los dos y olvidando las cuatro del banco;
`cola/README.md` decía veinte archivos y dieciocho piezas; `05-metricas.md` decía dieciocho fichas en un
párrafo y diecinueve dos párrafos después. **Los tres quedan corregidos hoy con este mismo recuento.**

De las veintidós: **una archivada** (09-09, Sora), **una bloqueada** por cifras de cliente (15-09), **tres
con una dependencia menor pendiente** (10-09 y 17-09 con un `[DATO]` de días o piezas por rodaje, 06-10 con
una línea de motivo por confirmar). **Publicables hoy sin ninguna dependencia: diecisiete.**

**La dependencia que este recuento no contaba, encontrada el 09-10.** Arriba se cuentan las piezas
bloqueadas por un dato y las piezas archivadas. **No se contaba ninguna pieza bloqueada por un archivo
que no existe**, y en este repositorio no había **ni un solo activo visual producido**: ningún PDF,
ninguna imagen, ningún vídeo. Varias piezas con fecha pedían uno.

**El recuento, al contarlo pieza a pieza, sale mucho mejor de lo que parecía, y por una razón de
redacción:** de todas las piezas que piden un activo, **todas menos una tienen un cuerpo que es un post
completo** — la tesis, la lista y el CTA viven en el texto y el visual solo añade. Así que se pueden
publicar en texto **sin tocar una palabra**. La única excepción es el carrusel del 10-09, cuyo cuerpo
*nombra* el carrusel («seis fases, en el carrusel»): esa no se puede degradar, y **queda declarada
inventario no utilizable** hasta que exista el PDF. El déficit visual bloquea **una** pieza, no todas
las que piden archivo.

De ahí sale la **regla de activo visual**, escrita hoy en `04-guia-diseno.md`: el cuerpo se sostiene
solo siempre; **el formato por defecto de toda franja es texto**; el carrusel y el vídeo solo se
escriben en una fila cuando hay producción reservada; la víspera, a las 19:30, se mira
`linkedin/activos/` y si el archivo no está, **la pieza sale en texto**; y un hueco de formato no
retiene nunca una franja. El registro de los activos pendientes, con la decisión de cada uno, está en
`linkedin/activos/README.md`.

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

**Precedencia, escrita el 08-10 al aplicar la regla de inventario.** La cláusula de desplazamiento ordena
**el turno** entre piezas Humanas. La regla de inventario decide **si la pieza de ese turno se escribe o se
saca del almacén**. Manda el inventario: si el viernes Humano que toca tiene una pieza Humana ya escrita y
sin publicar, entra esa, y la desplazada corre un turno más. Una idea del banco no adelanta a una pieza
escrita por el hecho de haber sido desplazada antes.

**Y la aritmética del reparto mide el almacén, no la tienda.** El 30/20/20/20/10 de este documento se
calcula sobre piezas *planificadas*. Mientras haya cero publicadas, el reparto real es 0/0/0/0/0 y no hay
nada que corregir ahí fuera. Se sigue cuadrando el plan porque es lo que evita que la cuenta se clasifique
mal el día que empiece a publicar, pero **ningún desvío de reparto justifica escribir una pieza nueva
mientras haya inventario sin fecha.**

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
| 19:30 | Cierra el día: ¿salió la pieza? Y pide las cifras de las que cumplen 48 horas o 7 días. **Y desde el 09-10, la puerta de producción:** si la pieza de mañana pide un activo visual, mira `linkedin/activos/`. Si el archivo no está exportado y nombrado, el aviso dice **«sale en texto»** y no pregunta nada más |

Ninguno escribe contenido ni toca el radar. Si la pieza está bloqueada por un [DATO] sin confirmar,
el aviso lo dice en vez de mandar a publicar algo incompleto. **Un activo visual que falta no es un
bloqueo y el aviso no lo trata como tal:** resuelve solo, degradando el formato a texto, porque el
cuerpo siempre se sostiene solo. La única pieza en que eso no vale es el carrusel del 10-09, y está
fuera de todas las franjas por eso mismo. Y los días en que no hay nada que
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
| 10-09 | Jue | Oferta | C1 | A las agencias no les interesa venderte un sistema · **elegida versión B** | Carrusel con las 6 fases del SISTEMA MAKERS, regalado completo. Ataca el modelo de negocio del propio sector, Makers incluida. Cierra con "para quién no es" y CTA de palabra clave por DM. **DECISIÓN DEL 09-10: INVENTARIO NO UTILIZABLE, Y NO ES POR EL `[DATO]`.** Se ha propuesto dos veces para cubrir un jueves de Oferta y las dos veces se discutió el `[DATO: nº de días de rodaje]`. El bloqueo real es otro y es mayor: **su cuerpo nombra el carrusel** —«Seis fases, en el carrusel», «si buscas un vídeo, el carrusel te sobra»— así que es la **única pieza del sistema que no se puede publicar en texto** si el PDF no existe. Y el PDF son diez páginas que nadie ha producido. **Consecuencia operativa: no se ofrece para ninguna franja** mientras el archivo no esté en `linkedin/activos/`. **Y por eso su `[DATO]` no va al redactor hoy:** quitarle la cifra no la acerca a publicarse ni un día, y la regla de inventario autoriza recuperar piezas, no maquillar piezas que siguen bloqueadas por otra cosa. Cuando haya producción reservada, entra el encargo completo —cifra fuera y PDF— en el mismo movimiento | Carrusel | Método | tres versiones listas · **bloqueada por producción** |
| 11-09 | Vie | Humano | D1 | Rechacé un proyecto y me llamaron arrogante | Historia de rechazar dinero por no encajar con el sistema. El insulto va en el gancho para desactivar al crítico. Refuerza la regla de no competir por precio. Desbloqueada con una cuarta versión que no necesita cifra · **elegida versión D** | Texto + foto | Pura | cuatro versiones listas |

## Semana 2 · 14 al 18 de septiembre

| Fecha | Día | Pilar | Tipo | Título de trabajo | Descripción y ángulo | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 14-09 | Lun | Autoridad | A3 | El briefing de 40 páginas no es rigor, es miedo a decidir | Ataque al proceso de aprobación por comité. Cuánto cuesta en semanas y en dilución del mensaje. Las 5 preguntas que sustituyen a un briefing entero. `cola/2026-09-14-briefing-40-paginas.md` | Texto | Pura | creada · tres versiones |
| 15-09 | Mar | Prueba | B1 | Tu agencia no te engaña: te da exactamente lo que pediste | Caso real de Makers en carrusel, desplazado desde la semana 1. Contexto, problema, qué cambiamos, resultado con cifra, qué puede replicar. **Requiere cliente y cifras autorizadas**. Tres versiones ya escritas | Carrusel | Método | tres versiones listas |
| 16-09 | Mié | Actualidad | N | El montador ya no busca el plano que falta: lo fabrica | Hueco fijo, **anclado tras el barrido del 13-09**. Adobe mete la generación de vídeo (y de música y ambientes) dentro de la línea de tiempo de Premiere y After Effects, con Veo, Kling, Runway y Luma elegibles desde la propia herramienta. Ángulo: traducción a negocio, no reseña de herramienta — qué partidas del presupuesto de producción dejan de sostenerse y qué pasa con lo ya firmado a precio de rodaje. IBC (11–14 sep) entra solo como frase de contraste: la feria enseñaba cámaras mientras el montaje empezaba a fabricar los planos; sus anuncios no mueven ninguna partida del ICP. **Refuerzo encontrado el 14-09:** el spot de Movistar con la Selección, 120 segundos al 95% con IA en prime time en España, necesitó entre 55 y 65 rondas de iteración, más de 5.130 recursos y más de 140 profesionales. Esa es la cifra que cierra la pieza: la herramienta se mete en la línea de tiempo, y aun así el trabajo real sigue siendo la iteración y la consistencia. Cifras de la propia productora, se citan como suyas. Redactada el 15 · `cola/2026-09-16-actualidad-plano-en-el-montaje.md` **· DECISIÓN DEL 08-10: SE ARCHIVA.** Veintidós días de caducidad sobre un techo de setenta y dos horas, y el motivo que se escribe es el verdadero, no el cómodo. **Tres razones y la tercera es la que decide:** (1) el cuerpo depende de una ventana temporal —«la semana pasada», y el aviso de la propia ficha de que si se publica más tarde del 16 hay que ajustarlo— así que no cabe en la salida 2 del protocolo, la de reasignar a criterio sin tocar el texto; (2) la herramienta ya no es noticia sino categoría, lo confirma Avid el 11-09 en el material de apoyo, y una categoría confirmada no sostiene un gancho de novedad; (3) **no hay franja de Autoridad libre antes de noviembre y hay una reescritura por delante en la cola.** Encolar una tercera reescritura con cero piezas publicadas es exactamente el error que esta jornada corrige. **El tema no muere:** las cifras del spot de Movistar y la confirmación de Avid siguen en `radar.md` como material de apoyo citable dentro de cualquier pieza futura. Lo que se archiva es la pieza, no el argumento | Texto | Método | **archivada el 08-10 · caducidad** |
| 17-09 | Jue | Oferta | C3 | "El contenido lo hacemos dentro". Vale. ¿Cuánto os cuesta cada pieza? · **elegida versión A** | Objeción respondida con aritmética: 25 €/h × 9 h, ÷ 0,7, 430 € por pieza publicada. Sin atacar al equipo interno. Imagen 4:5 con la cuenta. `cola/2026-09-17-contenido-lo-hacemos-dentro.md` **· DECISIÓN DEL 09-10: SE DESBLOQUEA, Y SE PUEDE.** Es el caso idéntico al del 11-09 y al del 14-09: **el `[DATO]` está en una sola frase** —«un rodaje al mes son [DATO: piezas por rodaje] piezas con calendario y coste fijo»— y la pieza no lo necesita para sostenerse. Las cifras de la cuenta (25 €/h, 225 €, 430 €, 3.400 €) **no son un dato de Makers ni de cliente**: son supuestos declarados que el propio texto invita a sustituir («cambia mis números por los tuyos»), así que nunca fueron el bloqueo. **La salida es la del 01-10: se describe la forma y no la cantidad** — el rodaje mensual con calendario y coste fijo, sin número de piezas. **Encargo pedido al redactor: reescribir ese párrafo en la versión A** (y en la B y la C si sale gratis en la misma pasada). **No se hace a mano.** Y su imagen 4:5 **deja de ser un requisito**: por la regla de activo visual, la cuenta ya está entera en el cuerpo y en el primer comentario, así que la pieza sale en texto. Con eso, Oferta recupera inventario publicable de verdad, que es lo que hoy no tenía: su única pieza sin fecha estaba bloqueada por un archivo y la otra por este dato | Texto (+ imagen opcional) | Método | creada · **desbloqueo pedido al redactor** |
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
| 23-09 | Mié | Actualidad | N | Quién encarga un estudio forma parte del estudio · **elegida versión A** | Estudio de Public First encargado por Google, presentado con San Sebastián en marcha. **La A no lleva ni una cifra:** se eligió así porque la verificación en blog.google no llegó y ese dominio está bloqueado desde la sesión. La tesis no necesitaba números — quién encarga un estudio forma parte del estudio, y un informe que mide el ahorro no mide qué pasa con lo ahorrado. La B y la C quedan bloqueadas con sus cifras marcadas. `cola/2026-09-23-quien-paga-el-estudio.md` **· DECISIÓN DEL 08-10: SE REESCRIBE Y SE REASIGNA A AUTORIDAD, VIERNES 30-10.** Es el caso exacto para el que se ha escrito la salida 2 del protocolo: su tesis —«quién encarga un estudio forma parte del estudio»— es una regla de lectura, no una noticia, y no lleva ni una cifra. **Pero el texto elegido no se puede publicar tal cual, y lo he comprobado leyéndolo, no leyendo la ficha:** lleva tres anclas de noticia seguidas («se presenta con el Festival de San Sebastián en marcha», «justo después de que España se consolidara el año pasado…», «el momento está muy bien elegido») que el 30 de octubre son falsas o huérfanas. **Desanclar eso no es un corte, es una reescritura de tres párrafos, y las piezas no se arreglan a mano:** va al redactor. El gancho alternativo que ya está en la ficha («te van a citar en una reunión este otoño») no lleva marca temporal y es el que entra. **Tres semanas de holgura**, que es justo lo que le faltó a la del 09-09. **Y un guardarraíl de solape:** el 13-10 ataca «el informe mensual que justifica el gasto»; aquí el enemigo es otro objeto —el estudio de sector que se cita sin leer— y se enuncia con otras palabras, como ya se hizo el 10-09 respecto al 08-09 | Texto | Método | **creada · reescritura pedida · reasignada al 30-10** |
| 24-09 | Jue | Oferta | C2 | Plazas de retainer para Q4: para quién no es · **elegida versión A** | **Sin cifra de plazas, y a propósito.** El dato no llegó, así que la A se construyó para no necesitarlo: la restricción de Q4 deja de ser de agenda y pasa a ser de criterio — no se entra porque quede hueco, se entra porque encaja. Así no suena a escasez fabricada, que es lo que el pilar prohíbe. Usa la apertura por expulsión que quedó reservada el 10-09. La B y la C llevan el número marcado y quedan disponibles. `cola/2026-09-24-para-quien-no-es.md` | Texto | Método | creada · tres versiones |
| 25-09 | Vie | **Humano** | D2 | Encuesta: ¿qué frena de verdad vuestro contenido? | Encuesta con 4 opciones que dividen al ICP (presupuesto, tiempo, criterio, aprobaciones). En el primer comentario, el voto de Angello y por qué. **Reetiquetada el 08-10: el pilar es Humano, no Autoridad.** `02-tipos-de-contenido.md` pone D2 bajo «D. Humano» desde el principio; esta fila decía Autoridad y de aquí salió el error que convirtió una «corrección del exceso de Humano» en un cuarto viernes Humano. D2 tiene **fase** de atracción, y la fase no es el pilar. **La encuesta ya no está asignada al 23-10:** vuelve al banco como Humano disponible y entra en el primer viernes Humano que no tenga inventario escrito detrás. Una encuesta no caduca. Solo cambia la etiqueta de pilar: el estado no se toca | Encuesta | Método | planificada |

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
| 30-09 | Mié | Actualidad | N | Pagaste por un vídeo y lo que generaste fue un dataset · **elegida versión A** | Hueco fijo, anclado en el barrido del 29-09. ALÍA reunió en las actividades de Industria del Festival de San Sebastián una mesa sobre IA en el pipeline audiovisual y la palabra que la atravesó fue *trazabilidad*. Ángulo: traducción a negocio, no crónica de mesa redonda — el sector lo discute como ingeniería y para el ICP es una cláusula del contrato de producción que firma sin leer. Enemigo: el modelo de contrato que solo habla del entregable final; nunca una productora. **Cero cifras en las tres versiones, y no por bloqueo: la noticia no tiene ninguna.** Maverick corrigió las tres antes de guardar: situaban la mesa «el lunes», que es la fecha de la crónica y no la del debate. `cola/2026-09-30-la-clausula-que-falta.md` **· DECISIÓN DEL 08-10: SE PUBLICA, REASIGNADA A AUTORIDAD, VIERNES 16-10, Y SIN TOCAR UNA PALABRA.** Es la única de las cuatro que cumple entera la condición de la salida 2: **cero cifras y cero marcas temporales en el texto.** «En las actividades de Industria del Festival de San Sebastián, ALÍA juntó a…» es pasado sin fecha y seguirá siendo verdad en noviembre; el día de la semana ya se eliminó el 30-09 y la fecha vive en el primer comentario atribuida a la crónica, que es donde no caduca. Su gancho no depende de la noticia: funciona aunque el lector no haya oído hablar de la mesa. Intensidad método, que es lo que el viernes 16 necesita porque la pura se gasta el lunes 12. **Riesgo declarado, y es de adyacencia, no de veracidad:** el jueves 15 también va de lo que no está por escrito. Se diferencia en objeto (preproducción frente a propiedad del material), en formato (carrusel frente a texto) y en CTA (DM «mitad» frente a abrir el contrato y buscar la palabra «brutos»). **Palanca si aun así suena a fórmula:** se cambia por la del 30-10 en cuanto el redactor entregue la reescritura del 23-09 | Texto | Método | **creada · reasignada al 16-10** |
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
| 07-10 | Mié | Actualidad | N | Las primeras cifras del sitio nuevo las firman los socios de quien lo abrió | **Reverificada y corregida el 06-10.** Ayer anclé esta fila sobre la página equivocada de OpenAI: la que cité está fechada el 5 de **mayo** y de ahí salían el Ads Manager y la puja por CPC. El anuncio del 5 de octubre es otro, «Building advertising for the way people use AI», y lleva la fecha visible en la propia página. **El anuncio real es más pequeño y mejor para la pieza:** formato de anuncio visual en ChatGPT, probado solo durante la generación de imágenes, **este mes, en EE. UU. y con un grupo inicial de anunciantes.** Doble eje: las tres cifras que avalan el canal las firma cada una un socio de medición que es socio del propio lanzamiento, sobre una sola marca y sin método a la vista —el «quién encarga un estudio» del 23-09 con sello de independencia encima—; y el dato accionable que nadie le va a dar a un director de marketing en España es que **este mes no hay nada que comprar**. Cierra la trilogía de la semana. `cola/2026-10-07-cifras-de-los-socios.md` **· DECISIÓN DEL 08-10: SE PUBLICA YA, TAL CUAL, CON CADUCIDAD ESCRITA AL 17-10.** Es la única de las cuatro que sigue siendo actualidad: un día de retraso sobre su franja, el gancho ya se corrigió para no llevar marca temporal, y su dato accionable —**este mes no hay nada que comprar desde España**— sigue siendo cierto. **Caducidad explícita, que es lo que le faltó a la del 09-09: 17-10.** Ese día deja de tener ventaja la mitad accionable, y si no se ha publicado **se archiva el 17-10 sin reabrir el debate**. Deja de serlo antes si OpenAI abre la compra fuera de EE. UU. o amplía el grupo de anunciantes: entonces se archiva ese mismo día. **Mientras siga sin publicar es el respaldo nivel 4 del hueco del 14-10** (ver la fila), y eso no es precargar el miércoles: la fila sigue abierta y el radar decide primero | Texto | Método | **creada · se publica · caduca el 17-10** |
| 08-10 | Jue | Oferta | C3 | Las tres opciones de propuesta y por qué nunca doy una sola cifra | Sale del banco de reserva. Objeción respondida desde el método de presupuestar, no desde el precio. **Escrita el 07-10 y es la primera pieza de la semana que no espera a nadie:** cero cifras, cero `[DATO]`, las tres versiones publicables tal cual. El eje es que una cifra única sobre un briefing sin cerrar no es un precio, es una apuesta, y que las tres opciones existen para que el cliente elija **alcance** y no precio — la propuesta como último sitio donde el briefing se cierra por escrito. Elegida A, la única sin ninguna frase que necesite un sí de Angello. `cola/2026-10-08-tres-opciones-de-propuesta.md` | Texto | Método | creada · tres versiones |
| 09-10 | Vie | Humano | D1 | Cómo decido si un cliente va a ser un problema en la primera llamada | Sale del banco de reserva. **Escrita el 08-10, y el enemigo quedó girado 180 grados respecto a lo planificado.** La forma fácil de esta pieza era quejarse de clientes, y eso rompe dos reglas a la vez: el enemigo tiene que ser una práctica, y el ICP *es* el cliente. Las señales no son defectos de nadie, son formas de decidir; y el que sale señalado es el proveedor —Angello— que las ve y firma igual porque hay que cerrar el mes. Segunda pieza seguida sin cifras y sin `[DATO]`. Elegida C, la única en la que el conflicto está dentro de él. **Las tres versiones las escribí yo: los subagentes no estaban disponibles en la sesión.** **Auditada el 08-10 a petición de Angello, por ser la única pieza del sistema que no pasó por el redactor, y con una corrección:** la versión elegida decía «lo que aprendí no fue que *aquel proyecto* fuera difícil… y después *lo conté* como mala suerte». Eso no es admisión en patrón, es un **episodio** — afirma un proyecto singular y afirma algo que Angello habría dicho en público sobre él. Corregido a patrón («los he firmado sabiendo cómo iban a acabar») y partida la frase de 22 palabras del pivote. Lo demás aguanta: ganchos remedidos (A 149, B 120, C 137), enemigo girado al proveedor, cero cifras, cero `[DATO]`, un solo CTA. **La longitud de frase no era un defecto de esta pieza:** 20 frases de más de 15 palabras sobre 105, y el 7-10 va en 24 sobre 101 — es una deriva de toda la casa. **La auditoría también la hice yo: el tool de agentes tampoco existe hoy.** `cola/2026-10-09-la-senal-y-la-factura.md` | Texto | Método | creada · tres versiones |

## Semana 6 · 12 al 16 de octubre

**Replanificada el 08-10 por decisión de Maverick, después de una auditoría del estratega. La semana pasa
a inventario y no se escribe ni una pieza nueva.**

El estratega tenía razón en lo que importa, y no era el contenido: era el orden de operaciones. **Veintidós
piezas escritas, cero publicadas**, y esta semana reservaba sus cinco huecos para piezas nuevas mientras una
docena de evergreen escritas no tenía fecha. Su frase es la que manda ahora: construir el almacén número dos
antes de abrir la tienda. **Y el inventario era aún mayor de lo que él contó:** veintidós piezas, no
diecinueve, porque `cola/` no es todo el almacén — cuatro piezas viven solo en el banco.

**Qué no he aceptado, y con qué dato.** Su propuesta era pasar las cinco filas íntegras a la semana 7 u 8.
Eso tira a la basura dos piezas que ya están escritas, elegidas, sin un solo `[DATO]` y fechadas en esta
misma semana — el lunes 12 y el jueves 15, y el 15 además con el brief visual real del diseñador, la primera
pieza del sistema que ha pasado por la cadena completa. Mover a la semana 7 lo que hoy está listo es la
misma falta que él denuncia, solo que en la otra dirección: también es dejar trabajo guardado. **Y su
candidato para el jueves —el carrusel `2026-09-10-carrusel-sistema-makers`— es precisamente el que lleva un
`[DATO]` sin confirmar** (el número de días de rodaje, abierto en `decisiones.md` desde el 10-09), mientras
el carrusel del 15 no tiene ninguno. Cambiar una pieza sin dependencias por una con dependencia, en nombre
de usar inventario, habría sido un retroceso.

**La regla que queda escrita, y es de las que aplica a todo lo que venga:**

> **Ninguna franja se rellena con una pieza nueva si hay inventario escrito que la cubra. Y no se redacta
> ninguna pieza nueva hasta que haya una publicada.** Lo que sí se autoriza es **recuperar inventario**:
> desanclar una pieza escrita para que se pueda publicar no es escribir una pieza nueva, es abrir la tienda.
> Esa es la única excepción, y se le pide al redactor, nunca se hace a mano.

**El híbrido, día a día, y por qué cada día lleva lo que lleva:**

1. **Lunes 12 · se queda `2026-10-12-volver-a-pagar-la-curva`.** Escrita, elegida la B, cero cifras, cero
   `[DATO]`, y fechada hoy para el lunes. Sustituirla por inventario no ganaría nada y perdería la única
   confrontación pura de la semana, que es el papel que tiene asignado el lunes.
2. **Martes 13 · entra inventario: `2026-09-18-que-mido-y-que-ignoro`.** La fila planificada («Un mes de
   contenido no se graba pieza a pieza») estaba sin escribir, así que es exactamente el hueco que el
   inventario tiene que cubrir. **El B3 vuelve al banco sin gastar.**
3. **Miércoles 14 · intacto.** El hueco de actualidad no se precarga nunca, ni para meter inventario. Lo
   único que cambia es que la escalera de respaldo gana un nivel.
4. **Jueves 15 · se queda `2026-10-15-lo-que-tiene-que-estar-de-tu-lado`.** Escrita, elegida la A, brief
   visual del diseñador, cero `[DATO]`, y resuelve el hueco de formato con un carrusel propio en lugar de
   con uno que arrastra un dato sin confirmar.
5. **Viernes 16 · entra inventario: `2026-09-30-la-clausula-que-falta`, versión A, sin tocar una palabra.**
   La fila planificada («Por qué un logo no es una marca») estaba sin escribir y **vuelve al banco sin
   gastar.**

**Resultado: cinco franjas, cuatro piezas ya escritas, un hueco de radar, cero redacción nueva.**

**El dato que forzó el viernes, y es un hallazgo de estructura que conviene no perder.** Para el viernes 16
hacía falta una Autoridad de intensidad **método**, porque la pura se gasta el lunes 12. **Las cinco
Autoridades escritas del sistema son las cinco de confrontación pura:** 08-09, 14-09, 21-09, 05-10 y 12-10.
**Cero Autoridades de método en el inventario escrito.** O sea: con el techo de una pura por semana, el
inventario de Autoridad solo puede cubrir **un lunes**, y el viernes Autoridad de la alternancia no lo puede
cubrir nunca. En el banco sí hay un candidato de método («por qué un logo no es una marca»), pero **está sin
escribir, que es justo lo que hoy no se hace.** Si el 30-09 no hubiera salido de actualidad a criterio, el
viernes 16 habría obligado a escribir. Y las dos Autoridades de método que el inventario tiene desde hoy
—el 30-09 y el 23-09— **vienen las dos de actualidad reasignada**, no del pilar. Queda apuntado
como encargo para el estratega: **el banco necesita Autoridades de método, no más tesis puras.**

| Fecha | Día | Pilar | Tipo | Titular de trabajo | Notas | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 12-10 | Lun | Autoridad | A1 | Cambiar de proveedor cada año no es optimizar el gasto. Es volver a pagar la curva | Sale del banco de Autoridad («el coste real de cambiar de proveedor audiovisual cada año»). **Es la confrontación pura de la semana y la única.** Enemigo: la práctica de volver a concurso cada año y decidir por precio; jamás un proveedor, un sector ni una empresa identificable. Dolor no dicho: «cada enero vuelvo a explicar mi marca desde cero y lo presento en comité como un ahorro». **Cero cifras, y esta vez cuesta:** la tentación de esta pieza es un rango de euros de coste de arranque, y Angello no ha dado ninguno — así que el coste se cuenta en lo que se vuelve a pagar (el aprendizaje de la marca, el criterio que se fue con el anterior, los dos primeros meses en los que nadie acierta el tono), nunca en dinero. **Riesgo declarado, y se desactiva dentro del post, no en esta ficha:** es un argumento que beneficia a quien lo firma, un proveedor defendiendo la continuidad. Si no concede en voz alta cuándo cambiar **sí** es lo correcto —cuando el proveedor dejó de decidir y se convirtió en un par de manos— la pieza suena a defensa de su propio retainer y no sale. No solapa con 24-09 ni con 08-10: allí se hablaba de entrar y de presupuestar, aquí de salir y de lo que se queda por el camino. CTA de atracción sin estrenar en la cuenta: guardarla para la conversación de renovación. No repite dilema A/B (5-10), inventario (6-10), DM (8-10) ni señal propia (9-10). **Escrita el 08-10 por `linkedin-copywriter`, que hoy sí estaba disponible.** Elegida la B, «La mitad que nadie firma»: es la única que no culpa a nadie —absuelve por escrito al responsable de compras, al que le miden por ahorro conseguido— y ataca el sistema de incentivos en lugar de la decisión, así que el lector no tiene que defenderse antes de poder estar de acuerdo. La concesión está en el cuerpo de las tres, como exigía el brief. Cero cifras y ningún `[DATO]`. Ganchos medidos: 142, 156 y 156. `cola/2026-10-12-volver-a-pagar-la-curva.md` **Confirmada el 08-10 frente a la propuesta de pasarla a la semana 7:** está escrita, elegida, sin un solo `[DATO]` y fechada para este lunes. La regla de inventario existe para no escribir de más, no para guardar lo que ya está listo. **Es la primera pieza candidata a publicarse del sistema entero, y de ella depende todo lo demás que hay escrito en este documento** | Texto | Pura | creada · tres versiones |
| 13-10 | Mar | Prueba | B · método | El informe que no sirve para decidir el mes siguiente · **inventario: `cola/2026-09-18-que-mido-y-que-ignoro.md`, versión B «El reloj»** | **Esta fila se ha cambiado entera el 08-10 por la regla de inventario.** Antes era el B3 «Un mes de contenido no se graba pieza a pieza», planificada y **sin escribir**: justo la clase de hueco que el inventario tiene que cubrir antes de que nadie redacte nada. **El B3 vuelve al banco sin gastar** y se le quita la marca `gastada el 13-10`. **Lo que entra está escrito desde el 18-09 y nunca se publicó:** eje de tiempo en vez de lista, cero cifras, cero `[DATO]`, tres versiones y la B elegida. **Es evergreen de verdad, y eso hay que decirlo con precisión:** no lleva ninguna fecha, ninguna noticia y ninguna cifra, así que publicarla el 13 de octubre no es fechar hacia atrás — es publicar por primera vez una pieza que se escribió antes. La prohibición de fechar hacia atrás protege a la actualidad, que caduca; una pieza de criterio no caduca. **Y NO se retipa a B4, aunque la tentación estaba ahí.** El tipo nuevo exige que el lector pueda **abrir** el artefacto, y el informe mensual de Angello no se puede abrir: las cuatro filas que sobreviven en el suyo son una afirmación suya, no algo comprobable. Etiquetarla B4 sería cometer con etiqueta nueva la misma falta que la auditoría encontró — **esta pieza es exactamente una de las dos que el informe llamó «método con chapa de Prueba», y lo sigue siendo.** Entra porque está escrita y porque el martes es Prueba, no porque haya dejado de ser método. **El primer B4 de verdad es el del 20-10**, donde el artefacto son catorce líneas que cualquiera puede abrir en este repositorio. Tipo: `B · método, sin artefacto`. **Solape vigilado:** el viernes 16 también habla de documentos, pero de un contrato, no de un informe; y el enemigo del 30-10, cuando entre, se enunciará con otras palabras que esta | Texto | Método | **creada · inventario reasignado** |
| 14-10 | Mié | Actualidad | N | **[Hueco abierto al radar · sin tema fijo]** | **Esta fila se queda abierta a propósito.** Ancla en el barrido del 13-10 y quedan tres barridos antes (9, 12 y 13). Condición de entrada, sin excepción: **fuente primaria abierta y leída**, nunca prensa secundaria ni agregador. Es la regla que impidió publicar las cifras del estudio de Google el 23-09 y la que falló el 5-10 al dar por buena una fecha de prensa. **Lo que hay hoy y por qué no sirve:** las dos pendientes del 1-10 (los tres modelos de voz de Microsoft AI y el vídeo a vídeo de Tavus) tienen seis dominios inalcanzables desde esta sesión y ninguna de sus cifras leída en primaria; ya hay contradicciones entre secundarias («10+ idiomas» frente a 23) y la cifra de Tavus es del fabricante, sobre 54 participantes y sobre un modelo que no es el que vende. **Escalera de respaldo para la noche del 13, por orden:** (1) noticia nueva verificada en primaria en cualquiera de los tres barridos; (2) si los dominios se abren, la de voz **como categoría y no como anuncio de producto** — dos fabricantes distintos diciendo que una voz se reproduce desde una muestra mínima, con los 10 segundos de ElevenLabs al lado y cada cifra con su autor delante; Tavus solo con sus dos advertencias delante del número; (3) derechos de imagen y voz **por el lado de la autorización de quien sale en cámara**, nunca por la propiedad de los brutos, que es el 30-09 — a 14 de octubre hay dos semanas de distancia, que es lo que el radar pedía, y solo con material de apoyo ya verificado; (4) **nivel nuevo, añadido el 08-10:** si sigue sin haber noticia verificada y la pieza del 07-10 «Las cifras de los socios» no se ha publicado todavía, **entra esa** — está escrita, verificada en primaria, es actualidad de verdad y su dato accionable sigue vivo hasta el 17-10. Es inventario de actualidad y entra antes que cualquier sustitución de pilar, porque mantiene el miércoles siendo miércoles. **Esto no precarga la fila:** el radar decide primero y esta fila sigue abierta hasta la noche del 13; (5) si tampoco eso, **el hueco no se rellena con una reseña de producto ni con un resumen sin tesis**: pasa a la Autoridad del banco («por qué la coherencia vende más que la creatividad») y esa semana el miércoles deja de ser actualidad. **Lo que no se hace en ningún caso es publicar una cifra no leída en primaria para no dejar el miércoles vacío.** La ley española de protección civil del honor sigue **no citable**: no se ha localizado la referencia del Consejo de Ministros ni el texto en el Boletín de las Cortes | Texto | Método | planificada · hueco abierto |
| 15-10 | Jue | Oferta | C3 | Lo que tiene que estar de tu lado para que esto salga | **Carrusel por decisión de formato, no de contenido:** la semana 5 fueron cinco piezas de solo texto seguidas y la última pieza visual era del 01-10. Un mes sin un carrusel es un hueco de formato. El pilar que mejor lo aguanta es Oferta: un carrusel se guarda, y lo que se guarda vuelve. **Ángulo nuevo para un pilar saturado:** Oferta lleva cinco ángulos seguidos de precio o de propuesta (10-09, 17-09, 24-09, 01-10, 08-10), así que este **no toca el dinero por ningún lado.** Va de la mitad del trabajo que no se factura y que casi nadie pide por escrito: material, accesos, una persona que conteste en plazo, quién decide. **Enemigo doble, las dos prácticas:** vender producción como llave en mano, y la costumbre del propio proveedor de no pedir nada por escrito para no parecer complicado en la llamada de cierre. Dolor no dicho, y es el que evita que esto sea un reproche al cliente: «el proyecto se retrasó por mi lado y dentro de casa lo conté como retraso del proveedor». **El giro que mantiene al ICP a salvo:** la lista no es una exigencia, es una prueba del algodón que el lector aplica a su proveedor actual — si no te ha pedido esto, no ha planificado. Semilla ya sembrada el 09-10 («nadie pregunta qué hace falta de su lado») y sin solape: allí era una señal en una llamada, aquí es el contenido de un documento. **Cero cifras y ningún `[DATO]`:** no dice cuántas piezas, ni plazos, ni precios. La lección del 01-10 —el entregable mensual no estaba documentado en el repositorio— es que se describe la forma y no la cantidad. CTA de captación por DM con palabra distinta de «alcance», gastada el 08-10: la palabra es **«mitad»**. **Escrita el 08-10: copy de `linkedin-copywriter`, brief visual de `linkedin-designer`. Es la primera pieza del sistema que ha pasado por la cadena completa como está diseñada.** Elegida la A, la que mejor protege al ICP porque asume la culpa del proveedor antes de mirar al lector. **Retipada: no es un C3.** No hay objeción literal, ni coste de la alternativa, ni CTA de precio; con la etiqueta C3 habría sido el cuarto C3 consecutivo y el recuento de tipos habría mentido. Abre el **eje 4 de Oferta, «Responsabilidad compartida»**, que se ha escrito en `02-tipos-de-contenido.md` a partir de esta pieza. **La versión 3 queda declarada no elegible por un defecto de premisa**, no de redacción: pone en boca de Angello el dolor del cliente («se retrasó por mi lado y lo conté como retraso del proveedor») cuando él es el proveedor de esa misma historia. Ganchos medidos: 111, 133 y 115. `cola/2026-10-15-lo-que-tiene-que-estar-de-tu-lado.md` **Confirmada el 08-10 frente a la propuesta de sustituirla por el carrusel del 10-09.** Dos razones: esta no tiene ninguna dependencia y la del 10-09 arrastra un `[DATO]` abierto desde el 10-09 en `decisiones.md` (el número de días de rodaje); y esta ya trae el brief visual del diseñador. El hueco de formato se resuelve igual, y sin heredar un dato que no ha llegado en un mes. **DECISIÓN DEL 09-10 · PUERTA DE PRODUCCIÓN, Y LA FRANJA NO SE MUEVE.** El brief del diseñador está completo y estima **110 minutos en Figma** con la grotesca del Brand Book. **Ningún agente del sistema puede producir ese PDF**: es tiempo de Angello o de alguien a quien él se lo encargue, y quedan seis días. **Lo que NO se hace, y se escribe por qué:** no se sustituye la pieza por otra de inventario —Oferta no tiene hoy ninguna alternativa limpia, su inventario sin fecha está bloqueado por un archivo (01-10, 10-09) o por un dato (17-09)— y no se mueve el jueves a la espera del archivo, porque con la tienda sin abrir **retener una franja por un formato es el error que esta jornada corrige**. **Lo que se hace:** la pieza se publica el 15 en todo caso. Si el PDF está exportado y nombrado en `linkedin/activos/` la noche del 14, sale como carrusel; **si no está, sale en texto, sin tocar una palabra**, y el brief queda marcado `no producido` en su ficha. **Esto se puede hacer sin coste porque el cuerpo de la versión A ya es un post completo:** los tres elementos de la lista, el giro de la prueba del algodón, la sentencia y el CTA «mitad» están todos en el texto, y el cuerpo no nombra el carrusel en ningún momento. Lo único que se pierde en la salida de texto es el hueco de formato, y eso se corrige reservando producción, no aplazando publicaciones | Carrusel · 8 slides · **o texto, según puerta del 14-10** | Método | creada · tres versiones |
| 16-10 | Vie | **Autoridad** | N→A | La cláusula que falta · **inventario: `cola/2026-09-30-la-clausula-que-falta.md`, versión A, sin tocar una palabra** | **Esta fila ha cambiado dos veces en un día y las dos veces por un motivo distinto.** Primero cambió de pilar: era Humano y pasó a Autoridad, porque el viernes es franja «Humano / Autoridad» y tres viernes Humanos seguidos (02-10, 09-10, 16-10) dejaban Autoridad en 24,1 %. Eso se mantiene. **Lo que cambia ahora es el contenido: entra inventario y no una pieza nueva.** El A2 «Por qué un logo no es una marca» estaba planificado y **sin escribir**, y **vuelve al banco sin gastar**. **Qué entra y por qué se puede:** la pieza del 30-09 es la única de las cuatro de actualidad en decadencia que cumple entera la condición de la salida 2 del protocolo —**cero cifras y cero marcas temporales en el texto**—, así que deja de ser actualidad y pasa a ser criterio. Su gancho no depende de la noticia, la mesa va en pasado sin fecha y la fecha vive en el primer comentario atribuida a la crónica. **Intensidad método, que es lo que esta franja necesitaba**, porque la pura se gasta el lunes 12. **Riesgo declarado, de adyacencia y no de veracidad:** el jueves 15 también habla de lo que no está por escrito. Se diferencia en objeto (preproducción frente a propiedad del material), en formato (carrusel frente a texto) y en CTA (DM «mitad» frente a abrir el contrato y buscar la palabra «brutos»). **Palanca si suena a fórmula:** se intercambia con el 30-10 en cuanto llegue del redactor la reescritura del 23-09. **La pieza Humana desplazada** («Lo que hago los días en que no tengo ninguna idea») sigue desplazada, y por la regla de precedencia escrita hoy corre un turno más: el viernes 23-10 lo ocupa inventario Humano ya escrito, así que ella entra el **06-11** | Texto | Método | **creada · inventario reasignado** |

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

**Lo que se hace en su lugar, y se hace dentro de la semana 6:** el **viernes 16 pasa a Autoridad**.
Resultado: **Autoridad 27,6 %, Humano 10,3 %** — Humano clavado en objetivo, Autoridad a media pieza del
suyo. Y octubre al día 16 pasa de 16,7/25 a 25/16,7 en Autoridad/Humano.

**Cuarta premisa desmontada, y esta era mía de esta misma mañana.** Esta nota decía que la pieza Humana
desplazada se iba «al siguiente viernes Humano, **el 30-10**». **Eso contradice la regla de alternancia que
la propia nota acababa de escribir tres párrafos antes.** Si el 16-10 es viernes par y por tanto Autoridad,
entonces el 23-10 es impar y es **Humano**, y el 30-10 es par y es **Autoridad**. El siguiente viernes Humano
es el 23, no el 30. Una regla que se incumple en el mismo documento que la estrena no es una regla.
**Corregido:** el 23-10 es Humano y el 30-10 es Autoridad, y así quedan las filas de la semana 7.

**Y el 23-10 tampoco lo ocupa la pieza desplazada**, por la regla de precedencia escrita hoy: ese viernes
tiene inventario Humano ya escrito y sin publicar (el 11-09, versión D). «Lo que hago los días en que no
tengo ninguna idea» corre un turno más y entra el **06-11**. No caduca y no pierde nada esperando.

**Qué es D2, decidido el 08-10: vuelve a Humano**, que es donde el catálogo la puso siempre. El razonamiento
completo está en `02-tipos-de-contenido.md`, bajo D2, y el resumen es este: convertirla en Autoridad exigía
darle una tesis citable, y con tesis citable deja de ser una encuesta y es un A1 con una votación encima.
**Consecuencia que hay que leer entera: el 23-10 no es «la corrección» de nada.** La corrección del exceso de
Humano está hecha en el viernes 16, y el 23-10 es un viernes Humano por alternancia, que es lo correcto. La
encuesta **pierde su asignación al 23-10** y vuelve al banco como Humano disponible.

## Semana 7 · 19 al 23 de octubre

**Planificada el 08-10 con la regla de inventario, y por eso se puede planificar hoy: no hay nada que
redactar.** Las cuatro piezas de las cuatro franjas fijas están escritas desde septiembre y ninguna se ha
publicado. El miércoles queda abierto al radar, como siempre.

**Condición de arranque, y es la única de este documento que no depende de un agente.** Esta semana solo
tiene sentido si la semana 6 ha publicado algo. **Si al cerrar el viernes 16 sigue habiendo cero piezas
publicadas, estas filas no se ejecutan y la semana 8 no se planifica:** el sistema se declara en estado
almacén y la única tarea viva es publicar una pieza. Está escrito en `decisiones.md`, en el apartado de los
dos escenarios.

| Fecha | Día | Pilar | Tipo | Titular de trabajo | Notas | Formato | Intensidad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 19-10 | Lun | Autoridad | A3 | El briefing de 40 páginas no es rigor, es miedo a decidir · **inventario: `cola/2026-09-14-briefing-40-paginas.md`, versión B «La frase»** | Escrita el 14-09, elegida, sin un solo `[DATO]` —los dos que traía la B se eliminaron ese día— y nunca publicada. **Es la confrontación pura de la semana y la única.** Enemigo: el proceso de aprobación por comité, una práctica, nunca una empresa. No solapa con el lunes 12: allí se cambiaba de proveedor, aquí no se decide. **Las cinco preguntas siguen reservadas** para el carrusel A4 del banco, así que la pieza no las quema | Texto | Pura | **creada · inventario reasignado** |
| 20-10 | Mar | Prueba | **B4** | El código a la vista · **inventario: `cola/2026-10-06-script-problema-no-definido.md`, versión A** | **Es el B4 fundacional:** el artefacto son las catorce líneas de `tools/rename_clips.py`, públicas en este repositorio, y cualquiera puede comprobar que renumeran y borran la información que un sistema de nombres existe para conservar. Prueba una decisión que no se tomó, no un resultado, que es exactamente lo que el tipo permite afirmar. **Dos cosas pendientes y las dos son pequeñas, pero ninguna se arregla a mano.** (1) La ficha marcaba «Yo quería dejar de perder tiempo buscando planos» como motivo no confirmado y ofrecía la alternativa «Quería encontrar los planos más rápido»: **se elige la alternativa**, que es elegir entre dos textos ya escritos y no redactar. (2) El cuerpo lleva un puente a la pieza del 05-10 («Ayer escribí que el volumen ya no es ventaja…») **que no se puede publicar si el 05-10 no se ha publicado antes, y hoy no lo está.** Quitarlo se lleva por delante dos párrafos y el remate «si lo cometes ahí, lo cometes en todo», así que **va al redactor junto con la reescritura del 23-09.** Once días de holgura. **Antiticio:** este repositorio se usó como artefacto el 02-10 y el 06-10; este es el tercero y por eso la regla de B4 fija uno cada tres Pruebas a partir de aquí | Texto | Método | **creada · inventario · una reescritura corta pedida** |
| 21-10 | Mié | Actualidad | N | **[Hueco abierto al radar · sin tema fijo]** | **No se precarga, y tampoco con inventario.** Ancla en el barrido del 20-10, con los barridos del 16 y el 19 por delante. Condición de entrada sin excepción: **fuente primaria abierta y leída, con la fecha visible en la propia página.** Misma escalera de respaldo que el 14-10, con la pieza del 07-10 en el nivel 4 **solo si para entonces sigue sin publicarse y sigue siendo verdad que este mes no hay nada que comprar** — a 21 de octubre eso ya está en el filo, así que si el radar no trae nada verificado, el nivel que entra es el 5 y el miércoles deja de ser actualidad esa semana | Texto | Método | planificada · hueco abierto |
| 22-10 | Jue | Oferta | C2 | Plazas de retainer: para quién no es · **inventario: `cola/2026-09-24-para-quien-no-es.md`, versión A** | Escrita el 24-09 **sin ninguna cifra de plazas y a propósito**: la restricción no es de agenda, es de criterio. Por eso es la Oferta de inventario que se puede publicar en otro mes sin cambiar una palabra — la A nunca nombró el trimestre como argumento. **Rotación de ejes:** el 08-10 fue economía (2), el 15-10 responsabilidad compartida (4), este es criterio de entrada (3). Queda el eje 1, método, para la siguiente Oferta. **Techo de perspectiva:** el 15-10 estaba escrito desde el lado del que compra, así que esta puede volver al lado del vendedor sin romper el máximo de dos consecutivas | Texto | Método | **creada · inventario reasignado** |
| 23-10 | Vie | **Humano** | D1 | Rechacé un proyecto y me llamaron arrogante · **inventario: versión D «El no que retuvo criterio», en el banco** | **Viernes Humano por alternancia estricta**, no por descarte: el 16-10 es Autoridad, así que este es Humano y el 30-10 vuelve a Autoridad. **Entra inventario y no la pieza desplazada**, por la regla de precedencia escrita hoy: la versión D está escrita desde el 11-09, se eligió precisamente porque **no necesita el importe** que bloqueaba a las otras tres (mide la pérdida en semanas de producción reservadas, no en euros) y nunca se publicó. **No tiene ficha en `cola/`: su copy vive en el banco**, que es el caso de las cuatro piezas escritas que `cola/` no contiene. Formato texto + foto propia, como su ficha original. **La foto reservada para la pieza biográfica sigue reservada**: no es la misma. «Lo que hago los días en que no tengo ninguna idea» corre un turno y entra el 06-11. **Añadido el 09-10 · segundo plazo de activo del plan, y no estaba contado.** Esta franja pide una **foto propia 4:5 que no existe** —sin posado, sin filtro, de trabajo real— y no es la que está reservada para la pieza biográfica. Misma puerta de producción que el 15: se mira `linkedin/activos/` la noche del 22 y **si no hay foto, la pieza sale en texto**, que se puede porque el cuerpo de la versión D no la nombra en ninguna línea. Una foto cuesta minutos y no 110, así que aquí el aviso no es de agenda: es que nadie lo había escrito | Texto + foto **o texto, según puerta del 22-10** | Pura | **creada · inventario reasignado** |

> **Viernes 30-10, reservado y escrito aquí para que no se pierda:** franja **Autoridad** por alternancia, y
> la ocupa la reescritura de `cola/2026-09-23-quien-paga-el-estudio.md` (versión A desanclada, con el gancho
> alternativo). Es la única pieza de todo el plan que depende del redactor, y tiene tres semanas de holgura.
>
> **Añadido el 09-10 al mismo encargo, para no abrir una segunda pasada.** Esta pieza es una de las
> **dos únicas** del sistema que pasan el techo de 1.600 caracteres de `03-guia-copywriting.md`, y es
> además la que más frases largas acumula de todas las medidas. **La reescritura de desanclaje ya está
> pedida; el recorte entra en la misma pasada y sale casi gratis**, porque lo que se corta son
> precisamente las tres anclas de noticia que hay que quitar de todas formas. Instrucción para el
> redactor: **cuerpo por debajo de 1.600 caracteres sin hashtags, frases de más de 15 palabras por
> debajo del 10% y ninguna por encima de 25.**
>
> **La otra pieza que pasa el techo es la del 07-10, y esa NO se toca.** Está declarada publicable tal
> cual, caduca el 17-10 y es la única actualidad viva del sistema. Reabrir una pieza publicable hoy
> para quitarle unos caracteres es exactamente el orden de operaciones que esta semana corrige. **Sale
> con el exceso, y el exceso queda escrito aquí** en lugar de incumplir la regla en silencio.
>
> La semana 8 completa la planifica el estratega, **y solo si hay algo publicado.**

---

## Temas en reserva (banco de ideas)

Para rellenar huecos, sustituir una pieza bloqueada por falta de datos, o alimentar octubre.

**Revisado el 08-10 al planificar la semana 6.** Hasta hoy el banco era una lista de títulos y había que
reabrir la discusión cada vez que se usaba uno. Ahora cada entrada gastada queda marcada con la fecha en
que se gastó, y cada entrada bloqueada lleva escrito **qué le falta**, para que nadie la elija un viernes
sin darse cuenta de que depende de un dato que no existe. Marcas: `gastada` · `bloqueada` · sin marca =
disponible.

**Regla nueva, 08-10: el banco va después del inventario.** Una entrada de este banco no se elige mientras
exista una pieza escrita y sin publicar que cubra ese pilar y esa intensidad. El banco sirve para planificar,
no para adelantarse al almacén. Por eso hoy tres entradas pierden su marca de `gastada` y la encuesta D2
pierde su fecha: sus franjas pasaron a inventario.

**Encargo abierto para el estratega, salido del viernes 16.** Las cinco Autoridades **escritas** del sistema
(08-09, 14-09, 21-09, 05-10, 12-10) son las cinco de confrontación pura: **cero de método.** Con el techo de
una pura por semana, el inventario de Autoridad solo puede cubrir un lunes y **nunca puede cubrir el viernes
Autoridad de la alternancia.** Este banco tiene exactamente dos candidatos de método sin escribir («por qué
un logo no es una marca» y «por qué la coherencia vende más que la creatividad»), y el segundo está
comprometido como respaldo del miércoles. **Lo que hace falta son candidatos de Autoridad con intensidad
método** —criterio explicado, sin enemigo nuevo—, no más tesis puras.

**Y se recuperan aquí tres ideas que la semana 4 declaró devueltas al banco y nunca llegaron a entrar.** La
nota del 29-09 decía que la encuesta del 25, el dron del 28 y el error de rodaje del 29 volvían a reserva,
pero el banco se quedó sin ellas. Sus filas siguen en estado `planificada` en las semanas 3 y 4; **no se
les cambia el estado** —esas tablas alimentan mapas paralelos que no toco— pero las ideas viven desde hoy
aquí, que es donde se pueden elegir.

**Autoridad**
- Carrusel A4 «Las 5 preguntas que sustituyen a un briefing de 40 páginas» (reservado de la versión A del 14-09; octubre). **Sigue reservado:** la pieza del 14-09 que se publica el 19-10 es la versión B y no quema las cinco preguntas.
- «Si tu vídeo empieza con un dron sobre el edificio, ya has perdido» — vídeo, A1, confrontación pura. **Recuperada del 28-09.** `bloqueada` por formato: en vídeo depende de material de rodaje de Angello. Escribible hoy solo si se pasa a texto, y entonces hay que revisar que no choque con el lunes 12, que también es A1 de confrontación pura.
- Por qué la coherencia vende más que la creatividad. **Es el respaldo nivel 4 del hueco de actualidad del 14-10.**
- "Cobrar barato no te hace competitivo, te hace prescindible." — `bloqueada` por público: tal cual está, le habla al proveedor, y aquí no se escribe para colegas. Entra solo girada al que compra: lo que acaba pagando quien elige por precio.
- Las 5 preguntas que hago antes de aceptar un proyecto. — Revisar solape con el 09-10, que ya usó tres señales de cualificación de la primera llamada.
- Por qué un logo no es una marca y qué es lo que sí. — **Estuvo asignada al viernes 16-10 y vuelve aquí sin gastar el 08-10**, porque ese viernes pasó a inventario escrito. Disponible. **Es candidata de Autoridad de intensidad método**, que es justo lo que este banco no tiene.
- El coste real de cambiar de proveedor audiovisual cada año. — `gastada` el 12-10.
- Lo que un director creativo hace de verdad todo el día.

**Prueba**
- Cómo montamos un mes entero de contenido en dos días de rodaje. — **Disponible otra vez. Se le quita la marca `gastada el 13-10` el 08-10**: el martes 13 pasó a inventario escrito y esta entrada nunca llegó a redactarse. Cuando entre, entra **sin la cifra**: los «dos días» son un dato de la operación de Makers que Angello no ha confirmado. Y entra **solo cuando no haya inventario de Prueba sin fecha**, que es la regla nueva.
- El error que costó un día entero de rodaje (B3). **Recuperada del 29-09.** `bloqueada`: es un episodio, y la regla de no-episodio no se relaja. Necesita que Angello diga qué pasó y qué parte se puede contar en público.
- Caso de estudio B1 con cliente y cifras autorizadas. `bloqueada` desde la semana 1. **Recuperada del 22-09**, que quedó como «caso 2: pendiente de elegir cliente». Necesita tres cosas: cliente, autorización escrita y cifras.
- B2 «Mismo presupuesto, otro sistema» (antes y después con cifra). `bloqueada` desde la semana 1: necesita presupuesto, plazo y resultado autorizados.
- El sistema de nombres de archivo que nos ahorra horas. — **muerta, y queda escrito por qué.** El 06-10 se abrió `tools/rename_clips.py`: son catorce líneas que renumeran y borran la información que un sistema de nombres existe para conservar. No hay sistema que contar. El script ya se usó como prueba de lo contrario y ese tema está cerrado.
- Antes y después de una identidad audiovisual. — `bloqueada`: necesita cliente y autorización de imagen.
- Qué mide Makers en un proyecto y qué ignora deliberadamente. — `gastada` el 18-09, **y la pieza que salió de ahí se publica el 13-10**: se escribió, no se publicó, y es inventario, no una entrada nueva.

**Actualidad (ángulos recurrentes)**
- Cada anuncio de modelo generativo de vídeo: qué cambia y qué no en un rodaje real.
- **Lo que automatizo con IA y lo que no pienso automatizar nunca** (vuelve a reserva el 22-09, sin gastar: la desplazó el estudio de Google en el hueco del 23. El tema no caduca y el texto existe como versión C del 9-09).
- AI Act: plazos y qué debe tener firmado una empresa que usa IA en campañas.
- Derechos de imagen y voz sintética en publicidad en España. — **Entra por la autorización de quien sale en cámara, nunca por la propiedad de los brutos**, que ya es el 30-09. Es el respaldo nivel 3 del hueco del 14-10. La ley española de protección civil del honor sigue **no citable** hasta localizar la primaria.
- Cada actualización de formatos o especificaciones de vídeo en LinkedIn.
- Campañas de marcas grandes hechas con IA y la reacción del público.

**Oferta**
- Las tres opciones de propuesta y por qué nunca doy una sola cifra. — `gastada` el 08-10.
- Plazas de retainer: para quién no es. — `gastada` el 22-10 con la pieza escrita el 24-09, que nunca se publicó.
- Lo que tiene que estar del lado del cliente para que un proyecto salga. — `gastada` el 15-10.
- Por qué no trabajamos por horas. — Disponible, pero **aplazada a noviembre por saturación**: Oferta lleva cinco ángulos seguidos de precio o de propuesta (10-09, 17-09, 24-09, 01-10, 08-10) y este es un sexto. No está bloqueada por datos; está bloqueada por repetición.
- Qué pasa en los primeros 30 días de un retainer. — `bloqueada` por el mismo fallo que casi tumbó el 01-10: **el onboarding de un retainer no está documentado en este repositorio.** No consta qué ocurre, en qué orden ni con qué hitos. Se desbloquea cuando Angello lo describa, o se reescribe por la forma y no por el calendario, como se hizo el 01-10.

**Humano**
- Encuesta D2 «¿Qué frena de verdad vuestro contenido?» — 4 opciones que dividen al ICP: presupuesto, tiempo, criterio, aprobaciones. En el primer comentario, el voto de Angello y por qué. **Movida aquí el 08-10, de Autoridad a Humano**, que es donde la pone el catálogo; la etiqueta anterior era el error del que salió una «corrección» del exceso de Humano hecha con otra pieza Humana. **Recuperada del 25-09**, que se perdió por un fallo de canal, no por decisión editorial. **Pierde su asignación al viernes 23-10**, porque ese viernes se cubre con inventario escrito. Disponible, sin fecha, hasta el primer viernes Humano que no tenga inventario detrás. Una encuesta no caduca.
- Lo que hago los días en que no tengo ninguna idea. — **Desplazada dos veces y sin perder nada.** Salió del 16-10 cuando esa franja pasó a Autoridad, y no entra el 23-10 porque ese viernes tiene inventario Humano escrito (el 11-09, versión D) y el inventario manda sobre el banco. **Entra el 06-11**, el siguiente viernes Humano. No caduca y no depende de ningún dato.
- Cómo decido si un cliente va a ser un problema en la primera llamada. — `gastada` el 09-10.
- Rechacé un proyecto y me llamaron arrogante (D1, versión D). — `gastada` el 11-09 y **la pieza se publica el 23-10**: escrita, elegida, nunca publicada. Inventario.
- El proyecto del que más aprendí y menos cobré. — `bloqueada`: es un episodio. Necesita que Angello diga qué proyecto, qué cifra se puede decir (o ninguna) y qué lección quiere que se lleve el lector.
- Qué le diría al Angello que empezaba. — `bloqueada` por público: tal cual está es consejo a creadores, y aquí no se escribe nunca para colegas ni para «la comunidad». Entra solo si cada lección se traduce a una decisión que un director de marketing reconozca como suya.
- «Por qué me fui de Perú a Madrid a montar esto». — `bloqueada` desde la semana 4. Necesita las tres cosas de siempre: qué parte quiere contar en público, qué detalle hace de bisagra y qué lección de negocio cierra. Se queda la foto propia reservada para ella.
