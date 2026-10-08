# 2026-10-06 → publicar el 20-10 · Prueba · **B4 · artefacto verificable** · «El código a la vista»

**Estado:** creada. Tres versiones. **Elegida por Maverick: A, «El código a la vista».**
**Publicar:** ~~martes 6 de octubre~~ → **martes 20 de octubre, 12:30.** Intensidad método. Solo texto.
**Métrica:** comentarios con un script propio confesado. El CTA pide un inventario incómodo, que es
el tipo de comentario que identifica a alguien con procesos de verdad.

## Desatada de la pieza del 5, y es el primer B4 real del sistema

**La versión A arrancaba con un puente a la pieza del 5 de octubre** —«Ayer escribí que el volumen ya no es
ventaja y que lo escaso es saber qué decir. Esto es el mismo error en su versión pequeña y tonta»— más el
remate que colgaba de él, «si lo cometes ahí, lo cometes en todo». **Pero la pieza del 5 no se ha publicado**,
así que el puente apuntaba a algo que el lector no ha visto nunca y el «ahí» no señalaba a nada.

**Puente y remate fuera.** El remate era el escalón de la pieza, lo que la saca de ser la anécdota de una
carpeta, así que quitarlo a secas dejaba la sentencia final sin rampa. Se recuperó con **una formulación
autónoma que ya existía en esta misma ficha**, en el primer comentario de la versión C: «si el error se comete
en algo así de pequeño, se comete en todo lo demás». No es texto nuevo ni un puente disfrazado — no menciona
nada anterior, y «algo así de pequeño» se refiere al script que el lector acaba de leer.

**Y queda cerrada la única marca que esta pieza tenía pendiente.** De las dos frases de motivo se queda
**«Quería encontrar los planos más rápido»**, que elimina el motivo no confirmado. **Ya no hay nada que
confirmar para publicarla.**

**Es el primer `B4` del sistema, y el tipo acaba de nacer para esto.** `02-tipos-de-contenido.md` redefine el
pilar de Prueba como *artefacto verificable*, con cuatro condiciones, y la primera es que el artefacto **se
pueda abrir**. Aquí se puede: las catorce líneas están en el repositorio y cualquiera las cuenta. Prueba una
**decisión**, no un resultado, y no lleva ni una cifra de resultado. El contraste que lo demuestra es el
martes 13, que **no** se etiqueta B4 porque su artefacto es un informe interno que el lector no puede abrir.

**Gancho: 192 caracteres.** No se tocó: ya arrancaba solo.

**Intacto:** las catorce líneas, los `clip_000X`, la destrucción de fecha, proyecto, cámara, escena y toma, el
recorrido de la carpeta sin ordenar, los seis meses, la sentencia citable, el CTA de inventario, los hashtags
y el primer comentario — el puente estaba en los de las versiones B y C, no en el de la A.

### Versión A, desatada y lista para pegar

```
En este sistema hay un script mío de catorce líneas. Pide una carpeta y renombra todos los vídeos a clip_0001, clip_0002, clip_0003.

Funciona sin un fallo. Y es lo peor que he escrito en años.

Lo que hace, exacto: coge el nombre de cada archivo y lo tira.

La fecha fuera. El proyecto fuera. La cámara, la escena, la toma, fuera. Deja un número y la extensión.

Después de pasarlo, un plano se llama clip_0073. No hay manera de saber de qué rodaje salió.

Hay un detalle peor. Recorre la carpeta sin ordenarla antes.

Así que el número que asigna no es el orden de grabación. Ni el alfabético. Es el orden que el disco tenga ese día.

Resumiendo: borré la única información que servía y la cambié por un número que no significa nada.

El código no tiene ningún error. El error es anterior al código.

Quería encontrar los planos más rápido. Y automaticé lo único que era fácil de automatizar: poner números.

La parte difícil nunca la decidí. Qué información tiene que llevar el nombre de un archivo para poder encontrarlo dentro de seis meses.

Si el error se comete en algo así de pequeño, se comete en todo lo demás.

Automatizar antes de decidir no te ahorra el trabajo. Te lo esconde.

¿Qué script tienes funcionando que no deberías estar usando? Dímelo en comentarios.

#Automatización #Procesos #MarketingB2B
```

## El eje cambió, y fue por un error mío

El viernes 2 planifiqué esta fila diciendo que «el sistema existe en este repositorio, en
`tools/rename_clips.py`, así que la prueba es el propio script». **Lo escribí sin abrir el
archivo.** Al abrirlo: catorce líneas que renombran todos los ficheros de una carpeta a
`clip_0001`, `clip_0002`… Eso no es un sistema de nombres, es un renumerador que **borra** la
información que un sistema de nombres existe para conservar — fecha, proyecto, cámara, escena,
toma. Y recorre `os.listdir` sin ordenar, así que el número no corresponde a ningún orden real.

No se podía escribir «el sistema que nos ahorra horas» sobre eso sin inventarse el sistema. **El
eje nuevo es el único honesto y además es mejor:** el script sigue siendo la prueba, pero de otra
cosa — de automatizar antes de haber decidido qué problema se resuelve. Catorce líneas que
ejecutan impecablemente una decisión que nunca se tomó.

Y es la pieza más verificable que ha escrito este sistema: **el archivo está en el repositorio y
cualquiera puede contar las catorce líneas.**

## Las tres cosas que no puedo sostener, y lo que he hecho con cada una

**1. «Lo he hecho yo esta semana» (versión C).** Eliminada. No sé cuándo escribió ese script. La
fecha del archivo no es la fecha de la decisión y nadie me ha dicho cuándo fue. La versión C queda
sin esa frase; el resto se mantiene.

**2. La escena dialogada de la versión B.** «Busco un plano concreto. Sé que lo grabé», el diálogo
de tres réplicas y «la escena es ridícula y la he vivido más de una vez». Es la mejor prosa de las
tres y **escenifica un incidente concreto del que no tengo constancia.** Que escribiera el script
está comprobado; que luego sufriera esa búsqueda es verosímil y no es un hecho. **La B queda
bloqueada hasta que Angello confirme que esa escena le pasó** — si le pasó, es la mejor de las
tres y sale tal cual.

**3. «Yo quería dejar de perder tiempo buscando planos» (en la elegida).** Esta **no** la he
quitado, y la distinción importa: es la única lectura razonable de por qué alguien escribe un
renombrador de clips, es un motivo y no un hecho, y es exactamente el tipo de frase que solo el
autor puede firmar. **Queda marcada para que Angello la confirme o la reescriba en treinta
segundos.** No bloquea publicar: si no se reconoce en ella, se cambia por «Quería encontrar los
planos más rápido» y la pieza no se mueve.

## Por qué la A

1. **Es la más verificable de las tres.** Todo lo que afirma sobre el script se comprueba abriendo
   el archivo, y lo único que añade es el juicio de Angello sobre su propio código.
2. **Entra describiendo el código sin juzgarlo** y deja que el lector vea el agujero antes de que
   nadie lo nombre. Eso respeta al lector, que es lo que mejor funciona en el pilar de prueba.
3. Es la más seca. En una semana que abre con una pieza de confrontación pura, el martes aguanta
   mejor con el tono bajo.

**El enlace con la pieza de ayer está en el cuerpo, en una línea y sin resumirla:** allí el
volumen deja de ser ventaja a escala de cientos de anuncios por semana; aquí el mismo error en su
versión pequeña, una carpeta de clips y catorce líneas. «Si lo cometes ahí, lo cometes en todo.»

**El enemigo nombrado:** automatizar la parte fácil para no tener que decidir la difícil. Con su
agravante, que es lo que hace la pieza: **que la herramienta funcione bien es lo que impide darse
cuenta.** Si diera un error, se habría arreglado el primer día.

**Nada que confirmar para publicar.** Cero cifras de resultado. Los únicos números son «catorce
líneas», los `clip_000X` del propio script y el «dentro de seis meses» del criterio, que es un
horizonte y no un dato. **Y ninguna versión afirma que exista un sustituto:** las tres cierran en
criterio o en decisión pendiente, porque un sistema nuevo no existe y no se puede decir que sí.

**Rotación de CTA.** La ficha de ayer avisaba de romper el patrón del dilema A/B. Ninguna de estas
tres lo usa: la elegida cierra con una pregunta abierta de inventario propio.

---

## Versión A · El código a la vista · ELEGIDA

**Marcada:** la línea «Yo quería dejar de perder tiempo buscando planos» es un motivo, no un
hecho. Confírmala o cámbiala por «Quería encontrar los planos más rápido».

```
En este sistema hay un script mío de catorce líneas. Pide una carpeta y renombra todos los vídeos a clip_0001, clip_0002, clip_0003.

Funciona sin un fallo. Y es lo peor que he escrito en años.

Lo que hace, exacto: coge el nombre de cada archivo y lo tira.

La fecha fuera. El proyecto fuera. La cámara, la escena, la toma, fuera. Deja un número y la extensión.

Después de pasarlo, un plano se llama clip_0073. No hay manera de saber de qué rodaje salió.

Hay un detalle peor. Recorre la carpeta sin ordenarla antes.

Así que el número que asigna no es el orden de grabación. Ni el alfabético. Es el orden que el disco tenga ese día.

Resumiendo: borré la única información que servía y la cambié por un número que no significa nada.

El código no tiene ningún error. El error es anterior al código.

Yo quería dejar de perder tiempo buscando planos. Y automaticé lo único que era fácil de automatizar: poner números.

La parte difícil nunca la decidí. Qué información tiene que llevar el nombre de un archivo para poder encontrarlo dentro de seis meses.

Ayer escribí que el volumen ya no es ventaja y que lo escaso es saber qué decir. Esto es el mismo error en su versión pequeña y tonta: una carpeta de clips y catorce líneas de Python.

Si lo cometes ahí, lo cometes en todo.

Automatizar antes de decidir no te ahorra el trabajo. Te lo esconde.

¿Qué script tienes funcionando que no deberías estar usando? Dímelo en comentarios.

#Automatización #Procesos #MarketingB2B
```

**Primer comentario:**

```
El mío sigue en el repositorio. No lo he borrado todavía y lo cuento a propósito: no tengo un sustituto montado, tengo una decisión pendiente.

La decisión no es qué herramienta uso. Es qué tengo que poder encontrar, y en cuánto tiempo.

Un nombre de archivo existe para una sola cosa: que puedas localizar un plano sin abrirlo. Si tienes que abrirlo para saber qué es, el nombre no está haciendo su trabajo. Da igual lo bien que se ejecute el renombrado.
```

**Variante de gancho, si el primero no arranca:**

```
Catorce líneas de Python. Las escribí yo. Renombran todos los vídeos de una carpeta a clip_0001, clip_0002, clip_0003.
No tienen un solo fallo, y ahí está el problema.
```

**En qué se diferencia:** entra describiendo el código sin juzgarlo y deja que el lector vea el
agujero antes de que yo lo nombre. La más seca y la más verificable de las tres.

---

## Versión B · La búsqueda imposible · BLOQUEADA hasta que confirmes la escena

**No se publica tal cual.** Escenifica una búsqueda concreta con diálogo y afirma «la he vivido
más de una vez». Que escribieras el script está comprobado; que sufrieras esa escena no me consta.
**Si te pasó, dilo y sale tal cual: es la mejor escrita de las tres.** Si no, hay que quitar el
diálogo, y entonces se parece demasiado a la A.

```
Busco un plano concreto. Sé que lo grabé. En la carpeta se llama clip_0073.

No puedo saber de qué rodaje es, ni de qué día, ni qué toma era. Esa información la borré yo, con un script mío.

La escena es ridícula y la he vivido más de una vez.

— ¿Lo tienes?
— Sé que lo tengo.
— Pues mándalo.

Y entonces empiezas a abrir archivos de uno en uno para ver qué hay dentro. clip_0071. clip_0072. clip_0073.

El culpable son catorce líneas de Python que escribí para ahorrarme tiempo.

Pide una carpeta y renumera todo: clip_0001, clip_0002, clip_0003. Conserva la extensión y nada más.

No es un sistema de nombres. Es un renumerador.

Y borra exactamente lo que un sistema de nombres existe para conservar: fecha, proyecto, cámara, escena, toma.

Por si faltaba algo, lee la carpeta sin ordenarla. El número tampoco corresponde al orden de grabación. Es el orden del sistema de ficheros ese día.

El script hace impecablemente lo que le pedí. Yo le pedí mal.

Quería no perder tiempo buscando planos, y automaticé poner números, que era la parte fácil. Decidir qué tiene que decir un nombre para encontrarlo en seis meses, eso no lo decidí.

Un nombre de archivo sirve para una cosa: localizar un plano sin abrirlo. Ese es el criterio, y es una decisión, no una herramienta.

Un script que funciona perfectamente puede estar resolviendo el problema equivocado. Y como funciona, nadie lo revisa.

Guarda esto para la próxima vez que vayas a automatizar algo.

#Automatización #Procesos #MarketingB2B
```

**Primer comentario:**

```
Lo que me parece más incómodo del asunto: si el script hubiera dado un error, lo habría arreglado el primer día.

Al funcionar, pasó a la categoría de cosa resuelta. Y las cosas resueltas no se auditan.

Ayer hablaba de esto mismo a escala de cientos de anuncios a la semana, donde lo escaso es saber qué decir. Aquí es una carpeta de vídeos y catorce líneas. El tamaño cambia, el error es el mismo: ejecutar a toda velocidad una decisión que nadie tomó.
```

**En qué se diferencia:** entra por la consecuencia y con escena dialogada; el script aparece a
mitad, como culpable y no como tema. La más narrativa. Su CTA pide guardar en vez de comentar, así
que es también la única que rompe el patrón de CTA de comentario.

---

## Versión C · El diagnóstico

**Corregida:** venía con «Lo he hecho yo esta semana». Eliminada — no sé cuándo escribió el script.

```
Automatizamos la parte fácil para no tener que decidir la difícil.

Lo he hecho yo. Catorce líneas de Python, cero errores, y destruyendo justo el dato que me hacía falta.

El script es mío y sigue en el repositorio.

Pide una carpeta y renombra todo a clip_0001, clip_0002, clip_0003. Deja el número y la extensión.

Lo que se lleva por delante: fecha, proyecto, cámara, escena, toma. Un plano pasa a llamarse clip_0073 y ya no sabes de dónde viene.

Y como recorre la carpeta sin ordenarla, el número no corresponde a ningún orden real. Ni grabación ni alfabético. El del disco ese día.

Ahora la parte que importa, porque el código es solo la prueba.

Yo no tenía un problema de nombres. Tenía un problema de búsqueda. Y nunca lo definí.

Automaticé poner números, que era lo único trivial. Decidir qué información necesita un nombre para encontrar un plano dentro de seis meses, eso quedó sin decidir.

Lo agravante es esto: que la herramienta funcione bien es lo que impide darte cuenta.

Si fallara, la revisas. Al funcionar, la das por buena y sigues.

Así que antes de automatizar nada, dos preguntas, en este orden:

1. Qué tengo que poder encontrar.
2. En cuánto tiempo tengo que poder encontrarlo.

La herramienta se elige después. Para un nombre de archivo el criterio es simple: tiene que dejarte localizar un plano sin abrirlo.

Automatizar antes de decidir no te ahorra el trabajo. Te lo esconde, y encima te cobra intereses.

¿Qué tenéis automatizado sin haber decidido antes para qué? Respóndeme con uno.

#Automatización #Procesos #MarketingB2B
```

**Primer comentario:**

```
Respondo yo primero, que para eso lo pregunto: el renombrado de clips. Y no tengo un sistema nuevo funcionando. Tengo la decisión sobre la mesa, que es distinto.

Ayer escribía que a escala de cientos de anuncios por semana lo escaso es saber qué decir. Esto es el mismo fallo en miniatura: una carpeta de vídeos y catorce líneas.

Si el error se comete en algo así de pequeño, se comete en todo lo demás. Por eso lo enseño.
```

**En qué se diferencia:** entra por la práctica y no por el objeto; el script es evidencia y la
pieza cierra en criterio accionable numerado. La más útil para el decisor y la más larga.
