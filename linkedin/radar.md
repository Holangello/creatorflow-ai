# Radar de actualidad

Lo alimenta la rutina diaria. Cada entrada es un tema candidato, verificado contra su fuente
primaria. Angello decide cuál se publica; nadie redacta nada sin que lo pida.

**Caducidad:** una entrada con más de 72 horas se archiva al final del documento o se borra.
La ventaja competitiva de una noticia son 12 a 48 horas.

**Último barrido:** 08-10-2026. **Ninguna candidata nueva, pero esta vez no es porque no haya nada: es
porque no he podido verificar lo que hay.**

Han salido dos cosas que a este ICP le tocan de lleno, las dos del **1 de octubre**, o sea **siete días**, muy
fuera de la ventana de 72 horas. Las anoto abajo en un bloque aparte, porque el motivo por el que no entran
importa más que ellas:

**Una.** Microsoft AI publica tres modelos de voz, entre ellos un texto a voz multilingüe que —según la prensa
y la ficha de catálogo— mantiene la misma identidad de voz al cambiar de idioma y se guía con una grabación
corta de referencia.
**Dos.** Tavus presenta un modelo de vídeo a vídeo para conversación en tiempo real, con una cifra que es
exactamente del tipo que esta cuenta usa: el porcentaje de gente que, tras una llamada de un minuto, creyó
estar hablando con una persona.

**Lo que no he podido hacer, y por eso no se publica nada sobre ellas: abrir la fuente primaria.** Los seis
dominios que harían falta —`microsoft.ai`, `ai.azure.com`, `www.businesswire.com`, `openrouter.ai`,
`tavus.io` y `www.tavus.io`— **están todos inalcanzables desde esta sesión.** Lo he comprobado uno por uno y
los seis fallan igual. Todo lo que tengo es prensa secundaria y agregadores, y de ahí ya salen discrepancias
visibles: una ficha dice «10+ idiomas» y el resto dicen 23, y la fecha de versión del catálogo no coincide con
la del anuncio.

**No escribo una cifra que no he visto en su fuente.** Es la misma regla que impidió publicar las cifras del
estudio de Google el 23 de septiembre, y es la que falló el 5 de octubre cuando di por buena una fecha de
prensa secundaria. Quedan anotadas abajo como pendientes, con sus cifras entre comillas y con autor, para el
día en que los dominios se puedan abrir.

**Esto no deja ningún hueco.** La pieza del viernes es de Humano y no necesita radar. El próximo hueco de
actualidad es el miércoles 14, y quedan tres barridos antes.

**Añadido el 08-10 al planificar la semana 6:** la fila del miércoles 14 queda **explícitamente abierta y sin
tema fijo** en `calendario.md`, y allí está escrita la escalera de respaldo para la noche del 13 por si
ninguno de los tres barridos (9, 12 y 13) trae algo verificable en primaria. Resumen para quien barra: si se
abren los dominios, la mejor candidata es la de voz, **y no como anuncio de producto sino como categoría** —
dos fabricantes distintos diciendo que una voz se reproduce desde una muestra mínima, con los 10 segundos de
ElevenLabs al lado y cada cifra con su autor delante. Si no se abren, el respaldo es derechos de imagen y voz
**por el lado de la autorización de quien sale en cámara**, nunca por la propiedad de los brutos, que ya es
el 30-09; el 14 de octubre hay dos semanas de distancia, que es lo que este radar pedía. Y si tampoco hay
eso, el miércoles **no se rellena con una reseña**: cede el hueco a una pieza de Autoridad del banco. Ningún
respaldo autoriza publicar una cifra que no se haya leído en su fuente primaria.

**Nota de infraestructura, no editorial.** El contenedor de esta sesión se reconstruyó con un clon antiguo del
repositorio y durante unos minutos no existía ni `linkedin/`. No se perdió nada: todo estaba subido a la rama.
Lo apunto porque explica por qué el barrido de hoy empieza con un `git fetch` y no con una búsqueda.

## Candidatos activos

| Detectado | Titular propuesto | Ángulo | Por qué le importa al ICP | Fuente | Caduca |
| --- | --- | --- | --- | --- | --- |
| 06-10 | Alquilar tu cara por cuarenta euros, y la letra pequeña de la autorización | Traducción a negocio · derechos de imagen | **Nivel 2, y no entra esta semana.** El Mundo publica un reportaje sobre la fábrica de microdramas chinos hechos con IA, donde se escanea el rostro de una persona para que su doble digital actúe sin ella. Lo que lo hace relevante para el ICP es la grieta que señala una abogada especializada: **la imprecisión de las autorizaciones** — quien alquila su cara para un anuncio puede descubrir que su doble vende mañana un producto que no usaría. Recoge además que un tribunal de Pekín dictaminó en marzo que insertar la apariencia de alguien en un drama generado con IA vulnera su derecho a la imagen aunque se le modifiquen las facciones. **Riesgo declarado: se solapa con la pieza del 30-09**, que ya iba de lo que el contrato no dice sobre los brutos. Si se escribe, tiene que entrar por el otro lado — la autorización del que sale en cámara, no la propiedad del material — y no antes de que haya distancia con el 30-09 | El Mundo, 6-10-2026, sección Futuro. **Prensa secundaria sobre un fenómeno extranjero:** cita a Sun Bin (Universidad de Comunicación de China) y a la abogada Yile Deng, pero la resolución del tribunal de Pekín no está localizada en primaria. Si se usa, va atribuido al reportaje y nunca como hecho verificado por mí | 09-10 · se archiva si no se usa |

## Pendientes de verificar · no usar todavía

Cosas detectadas cuya fuente primaria no se ha podido abrir desde esta sesión. **No se escribe una línea sobre
ellas, ni se cita ninguna de sus cifras, hasta haber leído la primaria.** Viven aquí para que no se pierdan y
para que quede escrito por qué no se usaron.

| Detectado | Qué es, según prensa secundaria | Las cifras que habría que verificar | Qué falta |
| --- | --- | --- | --- |
| 08-10 · anunciado el 01-10 | Microsoft AI publica tres modelos de voz: un texto a voz multilingüe, una variante rápida y uno de transcripción en streaming. Lo relevante para el ICP es que, según la prensa, **mantiene la misma identidad de voz al cambiar de idioma** y se guía con una **grabación corta de referencia**, con guardarraíles de consentimiento documentados | «23 idiomas y 26 locales», «22 dólares por millón de caracteres», «150 ms de latencia» en la variante rápida. **Todas de prensa y agregadores, ninguna leída en primaria.** Y ya hay contradicción dentro de las propias fuentes: una ficha habla de «10+ idiomas» frente a 23, y la fecha de versión del catálogo no coincide con la del anuncio | `microsoft.ai` y `ai.azure.com` inalcanzables desde esta sesión. **Si se verifica, es la mejor pareja de la cifra de ElevenLabs** que ya está en material de apoyo: dos fabricantes distintos diciendo que una voz se reproduce desde una muestra mínima. Eso deja de ser una anécdota de un proveedor y pasa a ser cómo funciona la categoría |
| 08-10 · anunciado el 01-10 | Tavus presenta un modelo de vídeo a vídeo para conversación en tiempo real, en una sola tubería en lugar de encadenar transcripción, modelo de lenguaje y síntesis. Acceso limitado a un grupo de desarrolladores, con despliegue amplio anunciado para más adelante | «48% de los participantes creyeron hablar con una persona tras una llamada de un minuto» —un medio lo describe como 26 de 54 participantes y referido a una versión reducida de investigación, no al modelo completo— y «3,83 frente a 3,92 de referencia humana» en un banco de pruebas de NVIDIA. **Cifra del fabricante sobre sí mismo, muestra pequeña, y sobre un modelo que no es el que se vende** | `tavus.io` y `www.businesswire.com` inalcanzables desde esta sesión. Y aunque se verifique: con muestra de 54 y cifra propia, tendría que ir con esas dos advertencias delante del número o no ir. Un 48% sobre 54 personas no es un 48% |

## Material de apoyo · no caduca

Hechos públicos, verificables y con cifra que sirven DENTRO de una pieza, no como pieza. No son noticia y no
compiten por el hueco del miércoles: son la prueba que se cita cuando hace falta bajar una tesis al suelo. Aquí
no se aplica la regla de las 72 horas, porque un caso con cifras no envejece como envejece un anuncio.

| Añadido | Qué es | La cifra que lo hace útil | Para qué sirve | Fuente |
| --- | --- | --- | --- | --- |
| 07-10 · **tema a vigilar, todavía no citable** | La ley española de protección civil del derecho al honor, que convierte en intromisión ilegítima el uso de la voz o la imagen de una persona con IA sin autorización para fines publicitarios o comerciales. Lo que he podido reconstruir hoy: el Consejo de Ministros aprobó el anteproyecto el **13 de enero de 2026**, la AEPD avisó el mismo día de los riesgos de subir y transformar imágenes de personas con herramientas de IA, y el **7 de julio de 2026** el Gobierno aprobó el proyecto y lo envió al Congreso. Sube como novedad principal, además de la prohibición, que la edad para consentir el uso de la propia imagen pasa a 16 años, que la protección se extiende a víctimas y fallecidos, y que por primera vez se fijan criterios para calcular el daño moral | **Ninguna cifra verificada hoy, y por eso no sube como cifra.** Lo único con número son la fecha de las dos aprobaciones y la edad de 16 años, y las tres vienen de prensa y de boletines de despachos, no de primaria | **Es el tema que más le va a importar a este ICP cuando se mueva, y no se ha movido hoy.** Cuando pase el trámite parlamentario deja de ser derecho de imagen en abstracto y se convierte en lo que hay que firmar antes de un rodaje: autorización expresa, finalidad acotada, caducidad. Conecta directo con la pieza del 30-09 sobre lo que el contrato no dice y con el reportaje de los microdramas. **Antes de usarlo hay que localizar la primaria** — referencia del Consejo de Ministros en La Moncloa y el texto en el Boletín Oficial de las Cortes — y confirmar en qué punto del trámite está. Hasta entonces no se escribe ni una línea sobre él | **Prensa secundaria y boletines jurídicos, sin primaria localizada:** notas de Ecija y de Pérez-Llorca, RTVC, Infocop y Ara. **Limitación declarada: no he abierto ni la referencia oficial del Consejo de Ministros ni el texto del proyecto.** Entra en el radar como aviso para mí mismo, no como material de apoyo utilizable |
| 06-10 | La fábrica de microdramas chinos hechos con IA, donde se alquila el rostro de una persona para que su doble digital actúe sin ella. Culebrones verticales de 30 a 90 segundos, grabados para el móvil, con doblaje automático que abarata la exportación | **Dos cifras, cada una con su autor. ByteDance afirma que desde comienzos de 2026 ha eliminado más de 85.000 vídeos que reproducían ilegalmente caras o voces con IA.** Y en el caso que lo destapó, una serie generada con los rostros de dos creadores sin su permiso acumuló más de 40 millones de reproducciones antes de ser retirada | **Es la prueba más dura que existe de que el problema no es la herramienta sino la autorización.** Y trae de regalo la mejor formulación ajena de la tesis de esta semana, en boca de Huang Jianxin (escuela de cine de la Universidad de Xiamen, presidente de la Asociación de Cine de Pekín): «cuanto más poderosa sea la herramienta, más importante resulta el juicio humano». Sirve para cualquier pieza sobre derechos de imagen y voz en un rodaje, y para responder comentarios en la pieza del 30-09 sobre lo que el contrato no dice | El Mundo, «40 euros por alquilar mi rostro para un micro culebrón chino hecho con inteligencia artificial», 6-10-2026, sección Futuro. **Tres limitaciones declaradas: es prensa secundaria**, las cifras son **declaraciones de ByteDance sobre sí misma** y se citan como tales, y **las citas están traducidas** del chino por el medio, así que van atribuidas al reportaje y nunca como transcripción |
| 02-10 | Runway anuncia **Runway Ads**, un motor autónomo para marketing de resultados: conectas cuenta publicitaria y kit de marca, y genera creatividades de vídeo e imagen desde las guías de marca, los anuncios pasados y las imágenes de producto, publica las variantes aprobadas en Meta, Google y TikTok, lee el rendimiento de vuelta y produce la siguiente ronda con lo que se llevó la inversión. Localiza texto en pantalla y capturas, no solo la locución. Aprobación humana activada por defecto | **Desde julio, de 77 anuncios semanales a unos 900 por semana. Retorno de la inversión publicitaria doblado. Conversión +34% con CTR estable. Coste por suscriptor −41% en el mismo periodo, gastando más.** Y la frase que vale más que las cifras, porque la dice el fabricante: «las empresas están limitadas por su capacidad de producir suficientes creatividades, no por su analítica ni por su intuición» | **Es la prueba de la tesis central del pilar de autoridad, y la pone la parte contraria.** Si encontrar el anuncio que funciona es cuestión de volumen y no de criterio, y el volumen acaba de volverse barato para todos, el volumen deja de distinguir a nadie. Lo que queda escaso es saber qué se dice en las mil variantes. Ancla la pieza del lunes 5 y sirve para cualquier pieza futura sobre agentes en el flujo de marketing | Runway, «Introducing Runway Ads», runwayml.com/news/introducing-runway-ads (fuente primaria del fabricante), con cita de su co-CEO Anastasis Germanidis. **Dos limitaciones declaradas: la página no muestra fecha de publicación** —el 28-09 se deduce de la ruta de su imagen de portada, no está publicado—, **y todas las cifras son de Runway sobre su propio programa de marketing**, así que se citan como suyas y nunca como dato independiente |
| 01-10 | ElevenLabs publica Eleven v4 y v4 Turbo, su modelo de texto a voz más expresivo, con mejoras de latencia, más de 90 idiomas y conservación de la identidad de la voz al cambiar de idioma | **Clonación de voz con 10 segundos de audio.** Es el dato que lo hace útil, y viene de la propia página del fabricante | Es la cifra que baja al suelo la conversación de consentimiento y derechos de voz. Diez segundos es menos de lo que dura un saludo en una reunión grabada, un mensaje de voz o cualquier vídeo corporativo ya publicado. Sirve para la pieza del 30 sobre trazabilidad, para responder a sus comentarios y para cualquier pieza futura sobre derechos de imagen y voz en un rodaje | ElevenLabs, «Eleven v4: nuestro modelo de IA de texto a voz más expresivo hasta la fecha», elevenlabs.io/es/blog/eleven-v4 (fuente primaria del fabricante). **Limitación declarada: la página no muestra fecha de publicación visible.** Por eso entra como material de apoyo y no como noticia: la cifra se puede citar, el «acaba de salir» no. Y la cifra se cita como del fabricante, no como dato independiente |
| 17-09 | Avid y Google Cloud meten Gemini Enterprise dentro de Media Composer, con Media Composer en navegador y agentes de IA en el entorno de postproducción. Anunciado el 11 de septiembre, tres días después de Adobe | **No es una noticia, es la confirmación de que hay categoría.** La pieza del 16 se apoyaba en un solo fabricante y eso deja flanco: siempre se puede contestar «es Adobe vendiendo Adobe». Con dos de las plataformas de montaje profesional moviéndose igual en la misma semana, deja de ser la jugada de una empresa y pasa a ser hacia dónde va la herramienta. Sirve para responder comentarios en la pieza del 16 y para cualquier pieza futura sobre generación dentro del flujo | Google Cloud, «Avid and Google Cloud Expand Strategic Partnership to Deliver Browser-Based Media Composer and Agentic Creative Workflows», googlecloudpresscorner.com, 11-09-2026 (fuente primaria). Antes, el acuerdo inicial de abril: avid.com, press room, 16-04-2026 |
| 14-09 | El spot de Movistar con la Selección para el Mundial: 120 segundos emitidos en prime time en las grandes cadenas españolas, generados en un 95% con IA. Producido por ROMA y MITO AI, dirigido por Oriol Villar. Campaña en antena desde el 25 de mayo de 2026 | **Entre 55 y 65 rondas de iteración. Más de 5.130 recursos generados (4.000 imágenes y 800 vídeos). Más de 140 profesionales entre perfiles técnicos y creativos** | Es el contraejemplo del «la IA lo hace barato y rápido», y encima español, en abierto y con marca reconocible. Sostiene la tesis de que el trabajo real no es generar el plano, es la consistencia y la iteración. Sirve para la pieza del 16 (Adobe mete la generación en la línea de tiempo) y para cualquier pieza contra el hype | MITO AI, «Crafted Stories · Movistar World Cup», blog.mito.ai; cobertura de Panorama Audiovisual (1-07-2026) y Periódico de la Publicidad. **Las cifras vienen del desglose de la propia productora: se citan como suyas, no como dato independiente** |

## Formato de entrada

- **Titular propuesto:** el gancho, no el titular del medio. Debe contener la consecuencia.
- **Ángulo:** traducción a negocio · contra el hype · contra el miedo · prueba en directo.
- **Por qué le importa al ICP:** una frase que conecte la noticia con el presupuesto, el
  calendario o el equipo de un director de marketing. Si no se puede escribir, se descarta.
- **Fuente:** enlace al anuncio oficial, documento o comunicado. Nunca un hilo ni una captura.
- **Caduca:** fecha y hora a partir de la cual el tema deja de tener ventaja.

## Archivo

Temas ya usados o caducados, para no repetir.

| Fecha | Titular | Qué pasó con él |
| --- | --- | --- |
| 05-10 · usada el 07-10 | Se ha abierto un sitio nuevo donde anunciarse, y las primeras cifras que lo avalan las firman los socios de quien lo abrió | Usada y cerrada. Ancló la pieza del miércoles 7 · `cola/2026-10-07-cifras-de-los-socios.md`. Fuente primaria correcta: OpenAI, «Building advertising for the way people use AI», `openai.com/index/new-chatgpt-ads-format-and-measurement`, 5 de octubre de 2026. **Deja el aprendizaje más caro del mes:** el 5 la anoté sobre la página equivocada —la de mayo— porque di por buena una fecha de prensa secundaria. La corrección del 6 no solo arregló la fuente, mejoró la pieza. Las tres cifras de socios de medición quedan citables solo con su autor delante, y el dato accionable —este mes no hay nada que comprar desde España— es lo que la hizo pieza y no reseña |
| 29-09 | Un estudio dice que la IA le va a dar 9.400 millones al año al audiovisual español. Lo ha pagado Google | Usada y cerrada. Ancló la pieza del miércoles 23, versión A «La regla de lectura» · `cola/2026-09-23-quien-paga-el-estudio.md`. Se eligió la única versión sin una sola cifra, porque la verificación en `blog.google` nunca llegó y ese dominio sigue bloqueado desde esta sesión. La condición que se escribió el 21 se cumplió sin relajarla: las cifras no se publicaron. La B y la C siguen bloqueadas con sus números marcados y así se quedan |
| 09-09 · cerrada el 29-09 | La herramienta de vídeo con IA apaga su API el 24 de septiembre | **Escrita, nunca publicada, y ahora caducada sin decisión.** Ancló la pieza del miércoles 9, versión B+ · `cola/2026-09-09-actualidad-sora.md`. Se escribió con el gancho «te quedan quince días». El 23 se avisó de que caducaba al día siguiente y se dejaron dos salidas honestas: sacarla ese mismo día tal cual, o archivarla y recuperar el tema en pasado con otro ángulo. No llegó respuesta. El 24 pasó, y con él la única de las dos que tenía fecha. Queda archivada por el paso del tiempo, no porque nadie eligiera. El tema es recuperable como ejemplo de riesgo de proveedor dentro de una pieza de autoridad, nunca ya como aviso |
| 29-09 | La mesa de ALÍA en San Sebastián: la industria audiovisual reclama trazabilidad, derechos y criterio profesional | Usada. Ancló la pieza del miércoles 30, versión A «La cláusula que falta» · `cola/2026-09-30-la-clausula-que-falta.md`. Duró menos de un día como candidata, que es lo normal en este radar. Lo que la hizo publicable no fue la mesa: fue que existía una traducción a negocio que nadie había hecho — el sector discutía ingeniería y el ICP tenía delante una cláusula de contrato |
| 16-09 | Adobe mete la generación de vídeo dentro de la línea de tiempo de Premiere | Usada. Ancló la pieza del miércoles 16, versión A «La partida» · `cola/2026-09-16-actualidad-plano-en-el-montaje.md`. Aguantó ocho días como candidata, que es mucho para este radar: se sostuvo porque no era un anuncio de producto sino un cambio en dónde ocurre el trabajo |
| 16-09 | IBC 2026: lo que enseñaron los fabricantes | Sin usar como pieza. Degradada a refuerzo el 13 y al final ni eso: la versión elegida no necesitó la frase de contraste. Cámaras y controladores no mueven una partida del ICP, y ese fue el aprendizaje — una feria del sector no es automáticamente una noticia para el cliente del sector |
| 13-09 | Un fabricante de coches estrena en España su primer spot hecho íntegramente con IA (Lepas L8, agencia Figari Candy Store, emisión desde el 1-09) | Caducada sin usar. Aguantó desde el 8-09 esperando la nota de prensa de la marca, que nunca salió: sin ella no había una sola cifra citable y el caso se quedaba en opinión sobre publicidad ajena. A los 7 días ya no tenía ventaja. Recuperable como ejemplo de apoyo en una pieza de autoridad, nunca como noticia |
