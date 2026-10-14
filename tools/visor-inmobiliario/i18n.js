// Internacionalización del visor y de los paneles.
//
// API:
//   tr(clave, vars?)         → texto traducido; interpola {x}. Fallback: idioma actual → es → la clave.
//   fijarIdioma(cod)         → cambia el idioma (si existe en el diccionario); actualiza <html lang>; avisa a los oyentes.
//   idiomaActual()           → "es" | "en" | "fr" | "de"
//   resolverTexto(valor)     → Texto (cadena o {es,en,…}) al idioma actual, con fallback es → primero disponible.
//   detectarIdioma(tour)     → ?lang= > tour.idioma > navigator.language (si está en tour.idiomas) > "es". No lo fija.
//   localeActual()           → etiqueta BCP 47 para Intl ("es-ES", "en-GB", "fr-FR", "de-DE").
//   alCambiarIdioma(fn)      → suscribe fn(cod); devuelve la función para desuscribirse.
//   nombreIdioma(cod)        → nombre del idioma en su propia lengua ("Español", "English"…).
//   diccionario              → { es: {...}, en: {...}, fr: {...}, de: {...} }
//
// Claves (prefijos):
//   modo.*        tour, libre, maqueta, titulo                        (núcleo)
//   ayuda.*       titulo, mirar, avanzar, volver, girar, zoom, flechas, caminar, correr, subir, capturar,
//                 joystick, plano, tocar_suelo                         (núcleo: panel de controles)
//   aviso.*       cargando, error_carga {x}, sin_tour, sin_webgl, contexto_perdido, reintentar, clic_explorar,
//                 libre_tactil, libre_raton, arrastra, estilo_no_disponible, sin_conexion, giroscopio_denegado,
//                 cargando_modelo {x}, libre_no_disponible             (núcleo: carga y errores)
//   medir.*       titulo, distancia, altura, marcar, deshacer, borrar, cerrar, ayuda_a, ayuda_b,
//                 ayuda_altura_a, ayuda_altura_b, precision, suelo, punto_a, salir
//   plano.*       planta, ampliar, titulo, reducir     plantas.* titulo, cambiar
//   guion.*       iniciar, parar, pausar, reanudar, paso {n}{total}, saltar
//   nav.*         ir_a {x}, metros {x}                 galeria.titulo
//   estilo.*      original, actual, nordico, mediterraneo, industrial, contemporaneo_minimalista, clasico
//   estilos.*     titulo, no_disponible, ia
//   momento.*     titulo, dia, atardecer, noche, simulado
//   pintura.*  comparar.*  personalizar.*  ficha.*  tipo.*  energia.*  contacto.*  hipoteca.*
//   compartir.*  herramientas.*  idioma.*  ajustes.*  comun.*  marca.* (web, creado_con {x})
//   galeria.*     titulo, renders, todo, filtro, tipo_render, tipo_foto, tipo_plano, autor, anterior, siguiente, n_de, ampliar, visor
//   contacto.*    incluye zona*, fotos*, hacer_foto, capturar, listo, pegar*, elige_chat, msg_foto, msg_zona (capturas en el contacto)

export const diccionario = {
  es: {
    "comun.cerrar": "Cerrar", "comun.volver": "Volver", "comun.si": "Sí", "comun.no": "No",
    "comun.pantalla_completa": "Pantalla completa", "comun.giroscopio": "Giroscopio", "comun.recentrar": "Recentrar",
    "comun.ayuda": "Ayuda", "comun.reintentar": "Reintentar", "comun.abrir_nueva": "se abre en una pestaña nueva",

    "modo.titulo": "Modo de visita", "modo.tour": "Recorrido 360", "modo.libre": "Modo libre 3D", "modo.maqueta": "Maqueta 3D",

    "ayuda.titulo": "Controles", "ayuda.mirar": "Arrastra para mirar alrededor",
    "ayuda.avanzar": "W A S D o flechas: ir a la estancia de delante, detrás o a los lados", "ayuda.volver": "Mantén W para seguir avanzando · Q E girar · RePág AvPág mirar arriba/abajo",
    "ayuda.girar": "Clic: capturar el ratón y mirar como en un videojuego (Esc para soltar)", "ayuda.zoom": "Rueda o pellizco: zoom",
    "ayuda.flechas": "Toca las flechas del suelo, el plano o la galería", "ayuda.caminar": "W A S D o flechas para caminar · ratón para mirar",
    "ayuda.correr": "Shift correr · Espacio saltar · Q E girar", "ayuda.subir": "Sin suelo (splat): Espacio subir · C bajar",
    "ayuda.capturar": "Clic para capturar el ratón (Esc para soltar)",
    "ayuda.joystick": "Móvil: pulgar izquierdo para caminar, arrastra a la derecha para mirar",
    "ayuda.plano": "M mostrar/ocultar mapa · R radar o plano · V cambiar modo · 1-9 estancias · H ayuda", "ayuda.tocar_suelo": "Toca el suelo para ir allí",

    "aviso.cargando": "Cargando…", "aviso.error_carga": "No se pudo cargar {x}",
    "aviso.sin_tour": "No se encontró tour.json. Mostrando la demo.", "aviso.sin_webgl": "Tu dispositivo no admite el recorrido 3D",
    "aviso.contexto_perdido": "Se perdió el contexto gráfico", "aviso.reintentar": "Reintentar",
    "aviso.clic_explorar": "Haz clic para explorar",
    "aviso.libre_tactil": "Pulgar izquierdo para caminar · arrastra a la derecha para mirar",
    "aviso.libre_raton": "WASD o flechas para caminar · ratón para mirar · Espacio saltar · Shift correr", "aviso.arrastra": "Arrastra para mirar",
    "aviso.estilo_no_disponible": "Este estilo no está disponible en esta estancia",
    "aviso.sin_conexion": "Sin conexión a internet", "aviso.giroscopio_denegado": "Permiso de movimiento denegado",
    "aviso.cargando_modelo": "Cargando modelo 3D… {x} %", "aviso.libre_no_disponible": "El modo libre 3D no está disponible para este inmueble",

    "medir.titulo": "Medir", "medir.distancia": "Distancia", "medir.altura": "Altura", "medir.marcar": "Marcar punto",
    "medir.deshacer": "Deshacer", "medir.borrar": "Borrar", "medir.cerrar": "Cerrar",
    "medir.ayuda_a": "Apunta al suelo y marca el punto A", "medir.ayuda_b": "Ahora marca el punto B",
    "medir.ayuda_altura_a": "Marca la base de la pared (en el suelo)", "medir.ayuda_altura_b": "Ahora marca el punto superior",
    "medir.precision": "Medida orientativa (±3 %)", "medir.suelo": "Apunta al suelo",
    "medir.punto_a": "Toca el suelo para el punto A", "medir.salir": "Terminar medición",

    "plano.planta": "Planta", "plano.ampliar": "Ampliar plano", "plano.titulo": "Plano", "plano.reducir": "Reducir plano",
    "plantas.titulo": "Plantas", "plantas.cambiar": "Cambiar de planta",

    "guion.iniciar": "Visita guiada", "guion.parar": "Detener visita", "guion.pausar": "Pausar visita guiada",
    "guion.reanudar": "Reanudar", "guion.paso": "Parada {n} de {total}", "guion.saltar": "Saltar",

    "nav.ir_a": "Ir a {x}", "nav.metros": "{x} m", "galeria.titulo": "Estancias",

    "estilo.original": "Actual", "estilo.actual": "Actual", "estilo.nordico": "Nórdico", "estilo.mediterraneo": "Mediterráneo",
    "estilo.industrial": "Industrial", "estilo.contemporaneo_minimalista": "Contemporáneo", "estilo.clasico": "Clásico",
    "estilos.titulo": "Estilo de decoración", "estilos.no_disponible": "Estilo no disponible en esta estancia",
    "estilos.ia": "Recreación con IA",

    "momento.titulo": "Momento del día", "momento.dia": "Día", "momento.atardecer": "Atardecer", "momento.noche": "Noche",
    "momento.simulado": "(simulación)",

    "pintura.titulo": "Colores", "pintura.paredes": "Paredes", "pintura.suelos": "Suelos",
    "pintura.libre": "Color personalizado", "pintura.restablecer": "Restablecer", "pintura.no_disponible": "No disponible en esta estancia",
    "comparar.titulo": "Comparar antes / después", "comparar.nota": "Original a la izquierda, propuesta a la derecha",
    "personalizar.titulo": "Personalizar",

    "ficha.titulo": "Ficha del inmueble", "ficha.pestana": "Ficha · precio", "ficha.abrir": "Abrir ficha del inmueble",
    "ficha.cerrar": "Cerrar ficha", "ficha.referencia": "Ref. {x}", "ficha.venta": "En venta", "ficha.alquiler": "En alquiler",
    "ficha.mes": "/mes", "ficha.precio_m2": "{x}/m²", "ficha.precio_consultar": "Precio a consultar",
    "ficha.datos": "Datos clave", "ficha.sup_construida": "Construidos", "ficha.sup_util": "Útiles", "ficha.sup_parcela": "Parcela",
    "ficha.habitacion": "habitación", "ficha.bano": "baño", "ficha.habitaciones": "Habitaciones", "ficha.banos": "Baños", "ficha.planta": "Planta", "ficha.ascensor": "Ascensor",
    "ficha.sin_ascensor": "Sin ascensor", "ficha.orientacion": "Orientación", "ficha.ano": "Año", "ficha.estado": "Estado",
    "ficha.garaje": "Garaje", "ficha.trastero": "Trastero", "ficha.terraza": "Terraza", "ficha.piscina": "Piscina",
    "ficha.jardin": "Jardín", "ficha.calefaccion": "Calefacción", "ficha.aire": "Aire acondicionado", "ficha.incluido": "Sí",
    "ficha.caracteristicas": "Características", "ficha.descripcion": "Descripción", "ficha.leer_mas": "Leer más",
    "ficha.leer_menos": "Leer menos", "ficha.gastos": "Gastos", "ficha.comunidad": "Comunidad", "ficha.ibi": "IBI",
    "ficha.al_mes": "{x}/mes", "ficha.al_ano": "{x}/año", "ficha.documentos": "Documentos", "ficha.ubicacion": "Ubicación",
    "ficha.zona_aprox": "Ubicación aproximada", "ficha.ver_mapa": "Ver en mapa", "ficha.osm": "OpenStreetMap",
    "ficha.google": "Google Maps", "ficha.superficies": "Superficies por estancia", "ficha.total_estancias": "Total estancias",
    "ficha.superficie_nota": "Calculado sobre el plano; orientativo.",
    "ficha.aviso_ia": "Imágenes de estilos generadas con IA, orientativas",
    "ficha.aviso_proyecto": "Inmueble en proyecto: imágenes orientativas y no contractuales",
    "ficha.agente": "Tu agente", "ficha.llamar": "Llamar", "ficha.email": "Email", "ficha.herramientas": "Herramientas",

    "tipo.piso": "Piso", "tipo.casa": "Casa", "tipo.chalet": "Chalet", "tipo.atico": "Ático", "tipo.duplex": "Dúplex",
    "tipo.estudio": "Estudio", "tipo.local": "Local", "tipo.oficina": "Oficina", "tipo.terreno": "Terreno", "tipo.loft": "Loft",
    "tipo.adosado": "Adosado", "tipo.villa": "Villa",

    "energia.titulo": "Certificado energético", "energia.consumo": "Consumo", "energia.emisiones": "Emisiones",
    "energia.unidad_consumo": "kWh/m²·año", "energia.unidad_emisiones": "kg CO₂/m²·año", "energia.en_tramite": "En trámite",
    "energia.letra": "Calificación {x}", "energia.mas": "Más eficiente", "energia.menos": "Menos eficiente",

    "contacto.boton": "Pregunta por esta vivienda", "contacto.corto": "Contactar", "contacto.titulo": "Pregunta por esta vivienda",
    "contacto.subtitulo": "Te respondemos lo antes posible.", "contacto.whatsapp": "Escribir por WhatsApp",
    "contacto.nombre": "Nombre", "contacto.telefono": "Teléfono", "contacto.pregunta": "Tu pregunta",
    "contacto.pregunta_ph": "Escribe tu pregunta…", "contacto.sugerencias": "Preguntas rápidas",
    "contacto.sug_disponible": "¿Sigue disponible?", "contacto.sug_visita": "Quiero visitarla",
    "contacto.sug_financiacion": "¿Admite financiación?",
    "contacto.acepto": "He leído y acepto la", "contacto.politica": "política de privacidad",
    "contacto.rgpd": "Responsable: {x}. Finalidad: responder a tu consulta. No se cederán tus datos a terceros salvo obligación legal. Puedes ejercer tus derechos de acceso, rectificación y supresión como indica la política de privacidad.",
    "contacto.enviar": "Enviar consulta", "contacto.enviar_whatsapp": "Enviar por WhatsApp", "contacto.enviando": "Enviando…",
    "contacto.exito": "Gracias, {x}. Hemos recibido tu consulta y te responderemos pronto.",
    "contacto.exito_whatsapp": "Hemos abierto WhatsApp con tu mensaje: solo falta pulsar enviar.",
    "contacto.error": "No se ha podido enviar la consulta.", "contacto.sin_conexion": "Parece que no tienes conexión.",
    "contacto.alternativa": "También puedes enviarla por WhatsApp.", "contacto.otra": "Hacer otra pregunta",
    "contacto.err_nombre": "Escribe tu nombre.",
    "contacto.err_telefono": "Escribe un teléfono válido (p. ej. 600 123 456 o +34 600 123 456).",
    "contacto.err_pregunta": "Escribe tu pregunta.", "contacto.err_privacidad": "Debes aceptar la política de privacidad.",
    "contacto.msg_saludo": "Hola, {x}.", "contacto.msg_interes": "Me interesa el inmueble {x}.",
    "contacto.msg_nombre": "Nombre", "contacto.msg_telefono": "Teléfono", "contacto.msg_pregunta": "Pregunta",
    "contacto.msg_estancia": "Estancia", "contacto.msg_vista": "Vista",

    "hipoteca.titulo": "Calculadora de hipoteca", "hipoteca.precio": "Precio", "hipoteca.entrada": "Entrada",
    "hipoteca.interes": "Interés anual", "hipoteca.anos": "Plazo", "hipoteca.anos_valor": "{x} años",
    "hipoteca.cuota": "Cuota mensual", "hipoteca.financiado": "Importe financiado", "hipoteca.intereses": "Intereses totales",
    "hipoteca.gastos": "Gastos de compraventa aproximados (~10 %: ITP o IVA, notaría, registro y gestoría): {x}. Cálculo orientativo; no es una oferta vinculante.",

    "compartir.titulo": "Compartir", "compartir.copiar": "Copiar enlace", "compartir.copiado": "Enlace copiado",
    "compartir.whatsapp": "WhatsApp", "compartir.email": "Email", "compartir.mas": "Más opciones",
    "compartir.qr": "Código QR", "compartir.qr_alt": "Código QR del enlace a esta vista", "compartir.descargar_qr": "Descargar QR",
    "compartir.enlace": "Enlace a esta vista", "compartir.mensaje": "Mira este inmueble: {x}",
    "compartir.qr_nota": "Escanéalo para abrir esta misma vista en el móvil.",

    "herramientas.titulo": "Herramientas", "idioma.titulo": "Idioma",
    "ajustes.titulo": "Ajustes", "ajustes.sens_raton": "Sensibilidad del ratón", "ajustes.sens_tactil": "Sensibilidad táctil",
    "ajustes.invertir_y": "Invertir eje vertical", "ajustes.reducir_movimiento": "Reducir movimiento",
    "ajustes.reducir_nota": "Transiciones por fundido, sin desplazamientos de cámara.", "ajustes.restablecer": "Restablecer",
    "marca.creado_con": "Creado con {x}",
    "contacto.zona": "¿Sobre qué estancia o zona es tu pregunta?",
    "contacto.zona_general": "General / toda la vivienda",
    "contacto.zona_otras": "Otras estancias",
    "contacto.fotos": "Fotos de la vista",
    "contacto.fotos_nota": "Opcional: añade fotos de lo que quieres preguntar.",
    "contacto.hacer_foto": "Hacer foto de esta vista",
    "contacto.n_fotos": "{x} fotos",
    "contacto.una_foto": "1 foto",
    "contacto.quitar_foto": "Quitar foto {x}",
    "contacto.foto_alt": "Foto {n}: {x}",
    "contacto.encuadra": "Encuadra la vista y pulsa Capturar",
    "contacto.capturar": "Capturar",
    "contacto.listo": "Listo",
    "contacto.capturada": "Foto {x} añadida",
    "contacto.max_fotos": "Máximo {x} fotos",
    "contacto.err_captura": "No se ha podido hacer la foto",
    "contacto.elige_chat": "Se abrirá el menú de compartir: elige el chat de {x} para enviar el mensaje con las fotos.",
    "contacto.pegar_titulo": "Último paso: pega la foto en WhatsApp",
    "contacto.pegar": "Hemos copiado la foto {n} de {total}. Pégala en el chat con Ctrl+V (⌘V en Mac) y envíala.",
    "contacto.copiar_siguiente": "Copiar siguiente foto ({n} de {total})",
    "contacto.descargar_fotos": "Descargar fotos",
    "contacto.copia_fallida": "No se ha podido copiar la foto: descárgala y adjúntala en el chat.",
    "contacto.abrir_whatsapp": "Abrir WhatsApp de nuevo",
    "contacto.copiada": "Foto copiada",
    "contacto.msg_foto": "📷 Foto {n} – {x}",
    "contacto.msg_zona": "Estancia de interés",
    "galeria.renders": "Renders y planos",
    "galeria.todo": "Todo",
    "galeria.filtro": "Filtrar la galería",
    "galeria.tipo_render": "Render / infografía",
    "galeria.tipo_foto": "Fotografía",
    "galeria.tipo_plano": "Plano",
    "galeria.autor": "Autor: {x}",
    "galeria.anterior": "Imagen anterior",
    "galeria.siguiente": "Imagen siguiente",
    "galeria.n_de": "{n} de {total}",
    "galeria.ampliar": "Ampliar: {x}",
    "galeria.visor": "Visor de imágenes",
    "marca.web": "Visitar web",
  },

  en: {
    "comun.cerrar": "Close", "comun.volver": "Back", "comun.si": "Yes", "comun.no": "No",
    "comun.pantalla_completa": "Full screen", "comun.giroscopio": "Gyroscope", "comun.recentrar": "Recentre",
    "comun.ayuda": "Help", "comun.reintentar": "Retry", "comun.abrir_nueva": "opens in a new tab",

    "modo.titulo": "Viewing mode", "modo.tour": "360 tour", "modo.libre": "3D free mode", "modo.maqueta": "3D model",

    "ayuda.titulo": "Controls", "ayuda.mirar": "Drag to look around",
    "ayuda.avanzar": "W A S D or arrows: go to the room ahead, behind or to the sides", "ayuda.volver": "Hold W to keep moving · Q E turn · PgUp PgDn look up/down",
    "ayuda.girar": "Click: capture the mouse and look around like in a video game (Esc to release)", "ayuda.zoom": "Wheel or pinch: zoom",
    "ayuda.flechas": "Tap the floor arrows, the floor plan or the gallery", "ayuda.caminar": "W A S D or arrows to walk · mouse to look",
    "ayuda.correr": "Shift run · Space jump · Q E turn", "ayuda.subir": "No floor (splat): Space up · C down",
    "ayuda.capturar": "Click to capture the mouse (Esc to release)",
    "ayuda.joystick": "Mobile: left thumb to walk, drag on the right to look",
    "ayuda.plano": "M show/hide map · R radar or plan · V switch mode · 1-9 rooms · H help", "ayuda.tocar_suelo": "Tap the floor to go there",

    "aviso.cargando": "Loading…", "aviso.error_carga": "Could not load {x}",
    "aviso.sin_tour": "tour.json not found. Showing the demo.", "aviso.sin_webgl": "Your device does not support the 3D tour",
    "aviso.contexto_perdido": "The graphics context was lost", "aviso.reintentar": "Retry",
    "aviso.clic_explorar": "Click to explore",
    "aviso.libre_tactil": "Left thumb to walk · drag on the right to look",
    "aviso.libre_raton": "WASD or arrows to walk · mouse to look · Space jump · Shift run", "aviso.arrastra": "Drag to look",
    "aviso.estilo_no_disponible": "This style is not available in this room",
    "aviso.sin_conexion": "No internet connection", "aviso.giroscopio_denegado": "Motion permission denied",
    "aviso.cargando_modelo": "Loading 3D model… {x} %", "aviso.libre_no_disponible": "3D free mode is not available for this property",

    "medir.titulo": "Measure", "medir.distancia": "Distance", "medir.altura": "Height", "medir.marcar": "Mark point",
    "medir.deshacer": "Undo", "medir.borrar": "Clear", "medir.cerrar": "Close",
    "medir.ayuda_a": "Aim at the floor and mark point A", "medir.ayuda_b": "Now mark point B",
    "medir.ayuda_altura_a": "Mark the base of the wall (on the floor)", "medir.ayuda_altura_b": "Now mark the top point",
    "medir.precision": "Approximate measurement (±3 %)", "medir.suelo": "Aim at the floor",
    "medir.punto_a": "Tap the floor for point A", "medir.salir": "Stop measuring",

    "plano.planta": "Floor", "plano.ampliar": "Enlarge floor plan", "plano.titulo": "Floor plan", "plano.reducir": "Shrink floor plan",
    "plantas.titulo": "Floors", "plantas.cambiar": "Change floor",

    "guion.iniciar": "Guided tour", "guion.parar": "Stop tour", "guion.pausar": "Pause guided tour",
    "guion.reanudar": "Resume", "guion.paso": "Stop {n} of {total}", "guion.saltar": "Skip",

    "nav.ir_a": "Go to {x}", "nav.metros": "{x} m", "galeria.titulo": "Rooms",

    "estilo.original": "Current", "estilo.actual": "Current", "estilo.nordico": "Nordic", "estilo.mediterraneo": "Mediterranean",
    "estilo.industrial": "Industrial", "estilo.contemporaneo_minimalista": "Contemporary", "estilo.clasico": "Classic",
    "estilos.titulo": "Interior style", "estilos.no_disponible": "Style not available in this room",
    "estilos.ia": "AI rendering",

    "momento.titulo": "Time of day", "momento.dia": "Day", "momento.atardecer": "Sunset", "momento.noche": "Night",
    "momento.simulado": "(simulated)",

    "pintura.titulo": "Colours", "pintura.paredes": "Walls", "pintura.suelos": "Floors",
    "pintura.libre": "Custom colour", "pintura.restablecer": "Reset", "pintura.no_disponible": "Not available in this room",
    "comparar.titulo": "Compare before / after", "comparar.nota": "Original on the left, proposal on the right",
    "personalizar.titulo": "Customise",

    "ficha.titulo": "Property details", "ficha.pestana": "Details · price", "ficha.abrir": "Open property details",
    "ficha.cerrar": "Close details", "ficha.referencia": "Ref. {x}", "ficha.venta": "For sale", "ficha.alquiler": "For rent",
    "ficha.mes": "/month", "ficha.precio_m2": "{x}/m²", "ficha.precio_consultar": "Price on request",
    "ficha.datos": "Key facts", "ficha.sup_construida": "Built", "ficha.sup_util": "Usable", "ficha.sup_parcela": "Plot",
    "ficha.habitacion": "bedroom", "ficha.bano": "bathroom", "ficha.habitaciones": "Bedrooms", "ficha.banos": "Bathrooms", "ficha.planta": "Floor", "ficha.ascensor": "Lift",
    "ficha.sin_ascensor": "No lift", "ficha.orientacion": "Orientation", "ficha.ano": "Year", "ficha.estado": "Condition",
    "ficha.garaje": "Parking", "ficha.trastero": "Storage room", "ficha.terraza": "Terrace", "ficha.piscina": "Pool",
    "ficha.jardin": "Garden", "ficha.calefaccion": "Heating", "ficha.aire": "Air conditioning", "ficha.incluido": "Yes",
    "ficha.caracteristicas": "Features", "ficha.descripcion": "Description", "ficha.leer_mas": "Read more",
    "ficha.leer_menos": "Read less", "ficha.gastos": "Running costs", "ficha.comunidad": "Community fees", "ficha.ibi": "Property tax (IBI)",
    "ficha.al_mes": "{x}/month", "ficha.al_ano": "{x}/year", "ficha.documentos": "Documents", "ficha.ubicacion": "Location",
    "ficha.zona_aprox": "Approximate location", "ficha.ver_mapa": "View on map", "ficha.osm": "OpenStreetMap",
    "ficha.google": "Google Maps", "ficha.superficies": "Room areas", "ficha.total_estancias": "Total of rooms",
    "ficha.superficie_nota": "Calculated from the floor plan; approximate.",
    "ficha.aviso_ia": "Style images generated with AI, for illustration only",
    "ficha.aviso_proyecto": "Off-plan property: images are for illustration only and not contractual",
    "ficha.agente": "Your agent", "ficha.llamar": "Call", "ficha.email": "Email", "ficha.herramientas": "Tools",

    "tipo.piso": "Apartment", "tipo.casa": "House", "tipo.chalet": "Detached house", "tipo.atico": "Penthouse", "tipo.duplex": "Duplex",
    "tipo.estudio": "Studio", "tipo.local": "Commercial premises", "tipo.oficina": "Office", "tipo.terreno": "Land", "tipo.loft": "Loft",
    "tipo.adosado": "Terraced house", "tipo.villa": "Villa",

    "energia.titulo": "Energy certificate", "energia.consumo": "Consumption", "energia.emisiones": "Emissions",
    "energia.unidad_consumo": "kWh/m²·year", "energia.unidad_emisiones": "kg CO₂/m²·year", "energia.en_tramite": "Pending",
    "energia.letra": "Rating {x}", "energia.mas": "Most efficient", "energia.menos": "Least efficient",

    "contacto.boton": "Ask about this home", "contacto.corto": "Contact", "contacto.titulo": "Ask about this home",
    "contacto.subtitulo": "We'll get back to you as soon as possible.", "contacto.whatsapp": "Message on WhatsApp",
    "contacto.nombre": "Name", "contacto.telefono": "Phone", "contacto.pregunta": "Your question",
    "contacto.pregunta_ph": "Type your question…", "contacto.sugerencias": "Quick questions",
    "contacto.sug_disponible": "Is it still available?", "contacto.sug_visita": "I'd like to view it",
    "contacto.sug_financiacion": "Is financing possible?",
    "contacto.acepto": "I have read and accept the", "contacto.politica": "privacy policy",
    "contacto.rgpd": "Data controller: {x}. Purpose: to answer your enquiry. Your data will not be shared with third parties unless legally required. You can exercise your rights of access, rectification and erasure as described in the privacy policy.",
    "contacto.enviar": "Send enquiry", "contacto.enviar_whatsapp": "Send via WhatsApp", "contacto.enviando": "Sending…",
    "contacto.exito": "Thank you, {x}. We have received your enquiry and will reply soon.",
    "contacto.exito_whatsapp": "WhatsApp is open with your message: just tap send.",
    "contacto.error": "Your enquiry could not be sent.", "contacto.sin_conexion": "You seem to be offline.",
    "contacto.alternativa": "You can also send it via WhatsApp.", "contacto.otra": "Ask another question",
    "contacto.err_nombre": "Please enter your name.",
    "contacto.err_telefono": "Please enter a valid phone number (e.g. +34 600 123 456).",
    "contacto.err_pregunta": "Please enter your question.", "contacto.err_privacidad": "You must accept the privacy policy.",
    "contacto.msg_saludo": "Hello, {x}.", "contacto.msg_interes": "I'm interested in property {x}.",
    "contacto.msg_nombre": "Name", "contacto.msg_telefono": "Phone", "contacto.msg_pregunta": "Question",
    "contacto.msg_estancia": "Room", "contacto.msg_vista": "View",

    "hipoteca.titulo": "Mortgage calculator", "hipoteca.precio": "Price", "hipoteca.entrada": "Deposit",
    "hipoteca.interes": "Annual interest", "hipoteca.anos": "Term", "hipoteca.anos_valor": "{x} years",
    "hipoteca.cuota": "Monthly payment", "hipoteca.financiado": "Loan amount", "hipoteca.intereses": "Total interest",
    "hipoteca.gastos": "Approximate purchase costs (~10 %: transfer tax or VAT, notary, land registry and agency): {x}. Estimate only; not a binding offer.",

    "compartir.titulo": "Share", "compartir.copiar": "Copy link", "compartir.copiado": "Link copied",
    "compartir.whatsapp": "WhatsApp", "compartir.email": "Email", "compartir.mas": "More options",
    "compartir.qr": "QR code", "compartir.qr_alt": "QR code linking to this view", "compartir.descargar_qr": "Download QR",
    "compartir.enlace": "Link to this view", "compartir.mensaje": "Take a look at this property: {x}",
    "compartir.qr_nota": "Scan it to open this same view on your phone.",

    "herramientas.titulo": "Tools", "idioma.titulo": "Language",
    "ajustes.titulo": "Settings", "ajustes.sens_raton": "Mouse sensitivity", "ajustes.sens_tactil": "Touch sensitivity",
    "ajustes.invertir_y": "Invert vertical axis", "ajustes.reducir_movimiento": "Reduce motion",
    "ajustes.reducir_nota": "Cross-fade transitions, no camera movement.", "ajustes.restablecer": "Reset",
    "marca.creado_con": "Made with {x}",
    "contacto.zona": "Which room or area is your question about?",
    "contacto.zona_general": "General / whole home",
    "contacto.zona_otras": "Other rooms",
    "contacto.fotos": "Photos of the view",
    "contacto.fotos_nota": "Optional: add photos of what you want to ask about.",
    "contacto.hacer_foto": "Take a photo of this view",
    "contacto.n_fotos": "{x} photos",
    "contacto.una_foto": "1 photo",
    "contacto.quitar_foto": "Remove photo {x}",
    "contacto.foto_alt": "Photo {n}: {x}",
    "contacto.encuadra": "Frame the view and press Capture",
    "contacto.capturar": "Capture",
    "contacto.listo": "Done",
    "contacto.capturada": "Photo {x} added",
    "contacto.max_fotos": "Maximum {x} photos",
    "contacto.err_captura": "The photo could not be taken",
    "contacto.elige_chat": "The share menu will open: choose the {x} chat to send the message with the photos.",
    "contacto.pegar_titulo": "Last step: paste the photo into WhatsApp",
    "contacto.pegar": "We have copied photo {n} of {total}. Paste it into the chat with Ctrl+V (⌘V on Mac) and send it.",
    "contacto.copiar_siguiente": "Copy next photo ({n} of {total})",
    "contacto.descargar_fotos": "Download photos",
    "contacto.copia_fallida": "The photo could not be copied: download it and attach it in the chat.",
    "contacto.abrir_whatsapp": "Open WhatsApp again",
    "contacto.copiada": "Photo copied",
    "contacto.msg_foto": "📷 Photo {n} – {x}",
    "contacto.msg_zona": "Room of interest",
    "galeria.renders": "Renders and plans",
    "galeria.todo": "All",
    "galeria.filtro": "Filter the gallery",
    "galeria.tipo_render": "Render / CGI",
    "galeria.tipo_foto": "Photo",
    "galeria.tipo_plano": "Plan",
    "galeria.autor": "Author: {x}",
    "galeria.anterior": "Previous image",
    "galeria.siguiente": "Next image",
    "galeria.n_de": "{n} of {total}",
    "galeria.ampliar": "Enlarge: {x}",
    "galeria.visor": "Image viewer",
    "marca.web": "Visit website",
  },

  fr: {
    "comun.cerrar": "Fermer", "comun.volver": "Retour", "comun.si": "Oui", "comun.no": "Non",
    "comun.pantalla_completa": "Plein écran", "comun.giroscopio": "Gyroscope", "comun.recentrar": "Recentrer",
    "comun.ayuda": "Aide", "comun.reintentar": "Réessayer", "comun.abrir_nueva": "s'ouvre dans un nouvel onglet",

    "modo.titulo": "Mode de visite", "modo.tour": "Visite 360", "modo.libre": "Mode libre 3D", "modo.maqueta": "Maquette 3D",

    "ayuda.titulo": "Commandes", "ayuda.mirar": "Faites glisser pour regarder autour",
    "ayuda.avanzar": "W A S D ou flèches : aller à la pièce devant, derrière ou sur les côtés", "ayuda.volver": "Maintenez W pour continuer · Q E tourner · PgPréc PgSuiv regarder en haut/bas",
    "ayuda.girar": "Clic : capturer la souris et regarder comme dans un jeu vidéo (Échap pour libérer)", "ayuda.zoom": "Molette ou pincement : zoom",
    "ayuda.flechas": "Touchez les flèches au sol, le plan ou la galerie", "ayuda.caminar": "W A S D ou flèches pour marcher · souris pour regarder",
    "ayuda.correr": "Maj courir · Espace sauter · Q E tourner", "ayuda.subir": "Sans sol (splat) : Espace monter · C descendre",
    "ayuda.capturar": "Cliquez pour capturer la souris (Échap pour libérer)",
    "ayuda.joystick": "Mobile : pouce gauche pour marcher, glissez à droite pour regarder",
    "ayuda.plano": "M afficher/masquer la carte · R radar ou plan · V changer de mode · 1-9 pièces · H aide", "ayuda.tocar_suelo": "Touchez le sol pour vous y rendre",

    "aviso.cargando": "Chargement…", "aviso.error_carga": "Impossible de charger {x}",
    "aviso.sin_tour": "tour.json introuvable. Affichage de la démo.", "aviso.sin_webgl": "Votre appareil ne prend pas en charge la visite 3D",
    "aviso.contexto_perdido": "Le contexte graphique a été perdu", "aviso.reintentar": "Réessayer",
    "aviso.clic_explorar": "Cliquez pour explorer",
    "aviso.libre_tactil": "Pouce gauche pour marcher · glissez à droite pour regarder",
    "aviso.libre_raton": "WASD ou flèches pour marcher · souris pour regarder · Espace sauter · Maj courir", "aviso.arrastra": "Faites glisser pour regarder",
    "aviso.estilo_no_disponible": "Ce style n'est pas disponible dans cette pièce",
    "aviso.sin_conexion": "Pas de connexion Internet", "aviso.giroscopio_denegado": "Autorisation de mouvement refusée",
    "aviso.cargando_modelo": "Chargement du modèle 3D… {x} %", "aviso.libre_no_disponible": "Le mode libre 3D n'est pas disponible pour ce bien",

    "medir.titulo": "Mesurer", "medir.distancia": "Distance", "medir.altura": "Hauteur", "medir.marcar": "Marquer le point",
    "medir.deshacer": "Annuler", "medir.borrar": "Effacer", "medir.cerrar": "Fermer",
    "medir.ayuda_a": "Visez le sol et marquez le point A", "medir.ayuda_b": "Marquez maintenant le point B",
    "medir.ayuda_altura_a": "Marquez le pied du mur (au sol)", "medir.ayuda_altura_b": "Marquez maintenant le point supérieur",
    "medir.precision": "Mesure indicative (±3 %)", "medir.suelo": "Visez le sol",
    "medir.punto_a": "Touchez le sol pour le point A", "medir.salir": "Terminer la mesure",

    "plano.planta": "Étage", "plano.ampliar": "Agrandir le plan", "plano.titulo": "Plan", "plano.reducir": "Réduire le plan",
    "plantas.titulo": "Étages", "plantas.cambiar": "Changer d'étage",

    "guion.iniciar": "Visite guidée", "guion.parar": "Arrêter la visite", "guion.pausar": "Mettre la visite guidée en pause",
    "guion.reanudar": "Reprendre", "guion.paso": "Étape {n} sur {total}", "guion.saltar": "Passer",

    "nav.ir_a": "Aller à {x}", "nav.metros": "{x} m", "galeria.titulo": "Pièces",

    "estilo.original": "Actuel", "estilo.actual": "Actuel", "estilo.nordico": "Nordique", "estilo.mediterraneo": "Méditerranéen",
    "estilo.industrial": "Industriel", "estilo.contemporaneo_minimalista": "Contemporain", "estilo.clasico": "Classique",
    "estilos.titulo": "Style de décoration", "estilos.no_disponible": "Style non disponible dans cette pièce",
    "estilos.ia": "Rendu par IA",

    "momento.titulo": "Moment de la journée", "momento.dia": "Jour", "momento.atardecer": "Coucher de soleil", "momento.noche": "Nuit",
    "momento.simulado": "(simulation)",

    "pintura.titulo": "Couleurs", "pintura.paredes": "Murs", "pintura.suelos": "Sols",
    "pintura.libre": "Couleur personnalisée", "pintura.restablecer": "Réinitialiser", "pintura.no_disponible": "Non disponible dans cette pièce",
    "comparar.titulo": "Comparer avant / après", "comparar.nota": "Original à gauche, proposition à droite",
    "personalizar.titulo": "Personnaliser",

    "ficha.titulo": "Fiche du bien", "ficha.pestana": "Fiche · prix", "ficha.abrir": "Ouvrir la fiche du bien",
    "ficha.cerrar": "Fermer la fiche", "ficha.referencia": "Réf. {x}", "ficha.venta": "À vendre", "ficha.alquiler": "À louer",
    "ficha.mes": "/mois", "ficha.precio_m2": "{x}/m²", "ficha.precio_consultar": "Prix sur demande",
    "ficha.datos": "Données clés", "ficha.sup_construida": "Surface construite", "ficha.sup_util": "Surface habitable", "ficha.sup_parcela": "Terrain",
    "ficha.habitacion": "chambre", "ficha.bano": "salle de bains", "ficha.habitaciones": "Chambres", "ficha.banos": "Salles de bains", "ficha.planta": "Étage", "ficha.ascensor": "Ascenseur",
    "ficha.sin_ascensor": "Sans ascenseur", "ficha.orientacion": "Orientation", "ficha.ano": "Année", "ficha.estado": "État",
    "ficha.garaje": "Garage", "ficha.trastero": "Cave", "ficha.terraza": "Terrasse", "ficha.piscina": "Piscine",
    "ficha.jardin": "Jardin", "ficha.calefaccion": "Chauffage", "ficha.aire": "Climatisation", "ficha.incluido": "Oui",
    "ficha.caracteristicas": "Caractéristiques", "ficha.descripcion": "Description", "ficha.leer_mas": "Lire la suite",
    "ficha.leer_menos": "Réduire", "ficha.gastos": "Charges", "ficha.comunidad": "Charges de copropriété", "ficha.ibi": "Taxe foncière (IBI)",
    "ficha.al_mes": "{x}/mois", "ficha.al_ano": "{x}/an", "ficha.documentos": "Documents", "ficha.ubicacion": "Emplacement",
    "ficha.zona_aprox": "Emplacement approximatif", "ficha.ver_mapa": "Voir sur la carte", "ficha.osm": "OpenStreetMap",
    "ficha.google": "Google Maps", "ficha.superficies": "Surfaces par pièce", "ficha.total_estancias": "Total des pièces",
    "ficha.superficie_nota": "Calculé sur le plan ; indicatif.",
    "ficha.aviso_ia": "Images de styles générées par IA, à titre indicatif",
    "ficha.aviso_proyecto": "Bien sur plan : images indicatives et non contractuelles",
    "ficha.agente": "Votre agent", "ficha.llamar": "Appeler", "ficha.email": "E-mail", "ficha.herramientas": "Outils",

    "tipo.piso": "Appartement", "tipo.casa": "Maison", "tipo.chalet": "Villa individuelle", "tipo.atico": "Attique", "tipo.duplex": "Duplex",
    "tipo.estudio": "Studio", "tipo.local": "Local commercial", "tipo.oficina": "Bureau", "tipo.terreno": "Terrain", "tipo.loft": "Loft",
    "tipo.adosado": "Maison mitoyenne", "tipo.villa": "Villa",

    "energia.titulo": "Certificat énergétique", "energia.consumo": "Consommation", "energia.emisiones": "Émissions",
    "energia.unidad_consumo": "kWh/m²·an", "energia.unidad_emisiones": "kg CO₂/m²·an", "energia.en_tramite": "En cours",
    "energia.letra": "Classe {x}", "energia.mas": "Plus efficace", "energia.menos": "Moins efficace",

    "contacto.boton": "Se renseigner sur ce logement", "contacto.corto": "Contacter", "contacto.titulo": "Se renseigner sur ce logement",
    "contacto.subtitulo": "Nous vous répondons dans les plus brefs délais.", "contacto.whatsapp": "Écrire sur WhatsApp",
    "contacto.nombre": "Nom", "contacto.telefono": "Téléphone", "contacto.pregunta": "Votre question",
    "contacto.pregunta_ph": "Écrivez votre question…", "contacto.sugerencias": "Questions rapides",
    "contacto.sug_disponible": "Est-il toujours disponible ?", "contacto.sug_visita": "Je souhaite le visiter",
    "contacto.sug_financiacion": "Un financement est-il possible ?",
    "contacto.acepto": "J'ai lu et j'accepte la", "contacto.politica": "politique de confidentialité",
    "contacto.rgpd": "Responsable du traitement : {x}. Finalité : répondre à votre demande. Vos données ne seront pas cédées à des tiers, sauf obligation légale. Vous pouvez exercer vos droits d'accès, de rectification et d'effacement comme indiqué dans la politique de confidentialité.",
    "contacto.enviar": "Envoyer la demande", "contacto.enviar_whatsapp": "Envoyer par WhatsApp", "contacto.enviando": "Envoi…",
    "contacto.exito": "Merci, {x}. Nous avons bien reçu votre demande et vous répondrons rapidement.",
    "contacto.exito_whatsapp": "WhatsApp est ouvert avec votre message : il ne reste qu'à l'envoyer.",
    "contacto.error": "Votre demande n'a pas pu être envoyée.", "contacto.sin_conexion": "Vous semblez hors ligne.",
    "contacto.alternativa": "Vous pouvez aussi l'envoyer par WhatsApp.", "contacto.otra": "Poser une autre question",
    "contacto.err_nombre": "Indiquez votre nom.",
    "contacto.err_telefono": "Indiquez un numéro valide (p. ex. +34 600 123 456).",
    "contacto.err_pregunta": "Écrivez votre question.", "contacto.err_privacidad": "Vous devez accepter la politique de confidentialité.",
    "contacto.msg_saludo": "Bonjour, {x}.", "contacto.msg_interes": "Le bien {x} m'intéresse.",
    "contacto.msg_nombre": "Nom", "contacto.msg_telefono": "Téléphone", "contacto.msg_pregunta": "Question",
    "contacto.msg_estancia": "Pièce", "contacto.msg_vista": "Vue",

    "hipoteca.titulo": "Simulateur de prêt", "hipoteca.precio": "Prix", "hipoteca.entrada": "Apport",
    "hipoteca.interes": "Taux annuel", "hipoteca.anos": "Durée", "hipoteca.anos_valor": "{x} ans",
    "hipoteca.cuota": "Mensualité", "hipoteca.financiado": "Montant emprunté", "hipoteca.intereses": "Intérêts totaux",
    "hipoteca.gastos": "Frais d'acquisition approximatifs (~10 % : droits de mutation ou TVA, notaire, registre et gestion) : {x}. Calcul indicatif, sans valeur d'offre.",

    "compartir.titulo": "Partager", "compartir.copiar": "Copier le lien", "compartir.copiado": "Lien copié",
    "compartir.whatsapp": "WhatsApp", "compartir.email": "E-mail", "compartir.mas": "Plus d'options",
    "compartir.qr": "Code QR", "compartir.qr_alt": "Code QR menant à cette vue", "compartir.descargar_qr": "Télécharger le QR",
    "compartir.enlace": "Lien vers cette vue", "compartir.mensaje": "Regardez ce bien : {x}",
    "compartir.qr_nota": "Scannez-le pour ouvrir cette même vue sur votre mobile.",

    "herramientas.titulo": "Outils", "idioma.titulo": "Langue",
    "ajustes.titulo": "Réglages", "ajustes.sens_raton": "Sensibilité de la souris", "ajustes.sens_tactil": "Sensibilité tactile",
    "ajustes.invertir_y": "Inverser l'axe vertical", "ajustes.reducir_movimiento": "Réduire les animations",
    "ajustes.reducir_nota": "Transitions en fondu, sans mouvement de caméra.", "ajustes.restablecer": "Réinitialiser",
    "marca.creado_con": "Créé avec {x}",
    "contacto.zona": "Sur quelle pièce ou zone porte votre question ?",
    "contacto.zona_general": "Général / tout le logement",
    "contacto.zona_otras": "Autres pièces",
    "contacto.fotos": "Photos de la vue",
    "contacto.fotos_nota": "Facultatif : ajoutez des photos de ce qui vous intéresse.",
    "contacto.hacer_foto": "Prendre une photo de cette vue",
    "contacto.n_fotos": "{x} photos",
    "contacto.una_foto": "1 photo",
    "contacto.quitar_foto": "Retirer la photo {x}",
    "contacto.foto_alt": "Photo {n} : {x}",
    "contacto.encuadra": "Cadrez la vue et appuyez sur Capturer",
    "contacto.capturar": "Capturer",
    "contacto.listo": "Terminé",
    "contacto.capturada": "Photo {x} ajoutée",
    "contacto.max_fotos": "{x} photos maximum",
    "contacto.err_captura": "Impossible de prendre la photo",
    "contacto.elige_chat": "Le menu de partage va s'ouvrir : choisissez la conversation de {x} pour envoyer le message avec les photos.",
    "contacto.pegar_titulo": "Dernière étape : collez la photo dans WhatsApp",
    "contacto.pegar": "Nous avons copié la photo {n} sur {total}. Collez-la dans la conversation avec Ctrl+V (⌘V sur Mac) et envoyez-la.",
    "contacto.copiar_siguiente": "Copier la photo suivante ({n} sur {total})",
    "contacto.descargar_fotos": "Télécharger les photos",
    "contacto.copia_fallida": "Impossible de copier la photo : téléchargez-la et joignez-la dans la conversation.",
    "contacto.abrir_whatsapp": "Rouvrir WhatsApp",
    "contacto.copiada": "Photo copiée",
    "contacto.msg_foto": "📷 Photo {n} – {x}",
    "contacto.msg_zona": "Pièce concernée",
    "galeria.renders": "Rendus et plans",
    "galeria.todo": "Tout",
    "galeria.filtro": "Filtrer la galerie",
    "galeria.tipo_render": "Rendu / image de synthèse",
    "galeria.tipo_foto": "Photo",
    "galeria.tipo_plano": "Plan",
    "galeria.autor": "Auteur : {x}",
    "galeria.anterior": "Image précédente",
    "galeria.siguiente": "Image suivante",
    "galeria.n_de": "{n} sur {total}",
    "galeria.ampliar": "Agrandir : {x}",
    "galeria.visor": "Visionneuse d'images",
    "marca.web": "Visiter le site",
  },

  de: {
    "comun.cerrar": "Schließen", "comun.volver": "Zurück", "comun.si": "Ja", "comun.no": "Nein",
    "comun.pantalla_completa": "Vollbild", "comun.giroscopio": "Gyroskop", "comun.recentrar": "Neu ausrichten",
    "comun.ayuda": "Hilfe", "comun.reintentar": "Erneut versuchen", "comun.abrir_nueva": "öffnet in einem neuen Tab",

    "modo.titulo": "Ansicht", "modo.tour": "360°-Rundgang", "modo.libre": "3D-Freier Modus", "modo.maqueta": "3D-Modell",

    "ayuda.titulo": "Steuerung", "ayuda.mirar": "Ziehen, um sich umzusehen",
    "ayuda.avanzar": "W A S D oder Pfeile: zum Raum vorne, hinten oder seitlich gehen", "ayuda.volver": "W gedrückt halten zum Weitergehen · Q E drehen · Bild↑ Bild↓ hoch/runter schauen",
    "ayuda.girar": "Klick: Maus fangen und wie in einem Videospiel umsehen (Esc zum Freigeben)", "ayuda.zoom": "Mausrad oder Zwei-Finger-Geste: Zoom",
    "ayuda.flechas": "Tippen Sie auf die Bodenpfeile, den Grundriss oder die Galerie", "ayuda.caminar": "W A S D oder Pfeile zum Gehen · Maus zum Umsehen",
    "ayuda.correr": "Umschalt rennen · Leertaste springen · Q E drehen", "ayuda.subir": "Ohne Boden (Splat): Leertaste hoch · C runter",
    "ayuda.capturar": "Klicken, um die Maus zu fangen (Esc zum Freigeben)",
    "ayuda.joystick": "Mobil: linker Daumen zum Gehen, rechts ziehen zum Umsehen",
    "ayuda.plano": "M Karte ein/aus · R Radar oder Grundriss · V Modus wechseln · 1-9 Räume · H Hilfe", "ayuda.tocar_suelo": "Auf den Boden tippen, um dorthin zu gehen",

    "aviso.cargando": "Wird geladen…", "aviso.error_carga": "{x} konnte nicht geladen werden",
    "aviso.sin_tour": "tour.json nicht gefunden. Die Demo wird angezeigt.", "aviso.sin_webgl": "Ihr Gerät unterstützt den 3D-Rundgang nicht",
    "aviso.contexto_perdido": "Der Grafikkontext ging verloren", "aviso.reintentar": "Erneut versuchen",
    "aviso.clic_explorar": "Zum Erkunden klicken",
    "aviso.libre_tactil": "Linker Daumen zum Gehen · rechts ziehen zum Umsehen",
    "aviso.libre_raton": "WASD oder Pfeile zum Gehen · Maus zum Umsehen · Leertaste springen · Umschalt rennen", "aviso.arrastra": "Zum Umsehen ziehen",
    "aviso.estilo_no_disponible": "Dieser Stil ist in diesem Raum nicht verfügbar",
    "aviso.sin_conexion": "Keine Internetverbindung", "aviso.giroscopio_denegado": "Bewegungszugriff verweigert",
    "aviso.cargando_modelo": "3D-Modell wird geladen… {x} %", "aviso.libre_no_disponible": "Der freie 3D-Modus ist für diese Immobilie nicht verfügbar",

    "medir.titulo": "Messen", "medir.distancia": "Abstand", "medir.altura": "Höhe", "medir.marcar": "Punkt setzen",
    "medir.deshacer": "Rückgängig", "medir.borrar": "Löschen", "medir.cerrar": "Schließen",
    "medir.ayuda_a": "Zielen Sie auf den Boden und setzen Sie Punkt A", "medir.ayuda_b": "Setzen Sie jetzt Punkt B",
    "medir.ayuda_altura_a": "Setzen Sie den Fußpunkt der Wand (am Boden)", "medir.ayuda_altura_b": "Setzen Sie jetzt den oberen Punkt",
    "medir.precision": "Ungefähre Messung (±3 %)", "medir.suelo": "Auf den Boden zielen",
    "medir.punto_a": "Tippen Sie auf den Boden für Punkt A", "medir.salir": "Messen beenden",

    "plano.planta": "Etage", "plano.ampliar": "Grundriss vergrößern", "plano.titulo": "Grundriss", "plano.reducir": "Grundriss verkleinern",
    "plantas.titulo": "Etagen", "plantas.cambiar": "Etage wechseln",

    "guion.iniciar": "Geführte Tour", "guion.parar": "Tour beenden", "guion.pausar": "Geführte Tour pausieren",
    "guion.reanudar": "Fortsetzen", "guion.paso": "Station {n} von {total}", "guion.saltar": "Überspringen",

    "nav.ir_a": "Zu {x} gehen", "nav.metros": "{x} m", "galeria.titulo": "Räume",

    "estilo.original": "Aktuell", "estilo.actual": "Aktuell", "estilo.nordico": "Nordisch", "estilo.mediterraneo": "Mediterran",
    "estilo.industrial": "Industrial", "estilo.contemporaneo_minimalista": "Zeitgenössisch", "estilo.clasico": "Klassisch",
    "estilos.titulo": "Einrichtungsstil", "estilos.no_disponible": "Stil in diesem Raum nicht verfügbar",
    "estilos.ia": "KI-Visualisierung",

    "momento.titulo": "Tageszeit", "momento.dia": "Tag", "momento.atardecer": "Abenddämmerung", "momento.noche": "Nacht",
    "momento.simulado": "(Simulation)",

    "pintura.titulo": "Farben", "pintura.paredes": "Wände", "pintura.suelos": "Böden",
    "pintura.libre": "Eigene Farbe", "pintura.restablecer": "Zurücksetzen", "pintura.no_disponible": "In diesem Raum nicht verfügbar",
    "comparar.titulo": "Vorher / Nachher vergleichen", "comparar.nota": "Original links, Vorschlag rechts",
    "personalizar.titulo": "Anpassen",

    "ficha.titulo": "Objektdaten", "ficha.pestana": "Exposé · Preis", "ficha.abrir": "Objektdaten öffnen",
    "ficha.cerrar": "Objektdaten schließen", "ficha.referencia": "Ref. {x}", "ficha.venta": "Zu verkaufen", "ficha.alquiler": "Zu vermieten",
    "ficha.mes": "/Monat", "ficha.precio_m2": "{x}/m²", "ficha.precio_consultar": "Preis auf Anfrage",
    "ficha.datos": "Eckdaten", "ficha.sup_construida": "Baufläche", "ficha.sup_util": "Wohnfläche", "ficha.sup_parcela": "Grundstück",
    "ficha.habitacion": "Schlafzimmer", "ficha.bano": "Badezimmer", "ficha.habitaciones": "Schlafzimmer", "ficha.banos": "Badezimmer", "ficha.planta": "Etage", "ficha.ascensor": "Aufzug",
    "ficha.sin_ascensor": "Kein Aufzug", "ficha.orientacion": "Ausrichtung", "ficha.ano": "Baujahr", "ficha.estado": "Zustand",
    "ficha.garaje": "Stellplatz", "ficha.trastero": "Abstellraum", "ficha.terraza": "Terrasse", "ficha.piscina": "Pool",
    "ficha.jardin": "Garten", "ficha.calefaccion": "Heizung", "ficha.aire": "Klimaanlage", "ficha.incluido": "Ja",
    "ficha.caracteristicas": "Ausstattung", "ficha.descripcion": "Beschreibung", "ficha.leer_mas": "Mehr lesen",
    "ficha.leer_menos": "Weniger anzeigen", "ficha.gastos": "Nebenkosten", "ficha.comunidad": "Hausgeld", "ficha.ibi": "Grundsteuer (IBI)",
    "ficha.al_mes": "{x}/Monat", "ficha.al_ano": "{x}/Jahr", "ficha.documentos": "Dokumente", "ficha.ubicacion": "Lage",
    "ficha.zona_aprox": "Ungefähre Lage", "ficha.ver_mapa": "Auf der Karte ansehen", "ficha.osm": "OpenStreetMap",
    "ficha.google": "Google Maps", "ficha.superficies": "Flächen pro Raum", "ficha.total_estancias": "Summe der Räume",
    "ficha.superficie_nota": "Aus dem Grundriss berechnet; Richtwert.",
    "ficha.aviso_ia": "Stilbilder mit KI erzeugt, unverbindlich",
    "ficha.aviso_proyecto": "Objekt in Planung: Bilder unverbindlich und nicht Vertragsbestandteil",
    "ficha.agente": "Ihr Makler", "ficha.llamar": "Anrufen", "ficha.email": "E-Mail", "ficha.herramientas": "Werkzeuge",

    "tipo.piso": "Wohnung", "tipo.casa": "Haus", "tipo.chalet": "Einfamilienhaus", "tipo.atico": "Penthouse", "tipo.duplex": "Maisonette",
    "tipo.estudio": "Studio", "tipo.local": "Gewerbefläche", "tipo.oficina": "Büro", "tipo.terreno": "Grundstück", "tipo.loft": "Loft",
    "tipo.adosado": "Reihenhaus", "tipo.villa": "Villa",

    "energia.titulo": "Energieausweis", "energia.consumo": "Verbrauch", "energia.emisiones": "Emissionen",
    "energia.unidad_consumo": "kWh/m²·Jahr", "energia.unidad_emisiones": "kg CO₂/m²·Jahr", "energia.en_tramite": "In Bearbeitung",
    "energia.letra": "Klasse {x}", "energia.mas": "Am effizientesten", "energia.menos": "Am wenigsten effizient",

    "contacto.boton": "Fragen zu dieser Immobilie", "contacto.corto": "Kontakt", "contacto.titulo": "Fragen zu dieser Immobilie",
    "contacto.subtitulo": "Wir antworten Ihnen so schnell wie möglich.", "contacto.whatsapp": "Per WhatsApp schreiben",
    "contacto.nombre": "Name", "contacto.telefono": "Telefon", "contacto.pregunta": "Ihre Frage",
    "contacto.pregunta_ph": "Schreiben Sie Ihre Frage…", "contacto.sugerencias": "Schnellfragen",
    "contacto.sug_disponible": "Ist sie noch verfügbar?", "contacto.sug_visita": "Ich möchte sie besichtigen",
    "contacto.sug_financiacion": "Ist eine Finanzierung möglich?",
    "contacto.acepto": "Ich habe die folgende Erklärung gelesen und akzeptiere sie:", "contacto.politica": "Datenschutzerklärung",
    "contacto.rgpd": "Verantwortlich: {x}. Zweck: Beantwortung Ihrer Anfrage. Ihre Daten werden nicht an Dritte weitergegeben, sofern keine gesetzliche Pflicht besteht. Ihre Rechte auf Auskunft, Berichtigung und Löschung können Sie wie in der Datenschutzerklärung beschrieben ausüben.",
    "contacto.enviar": "Anfrage senden", "contacto.enviar_whatsapp": "Per WhatsApp senden", "contacto.enviando": "Wird gesendet…",
    "contacto.exito": "Danke, {x}. Wir haben Ihre Anfrage erhalten und melden uns in Kürze.",
    "contacto.exito_whatsapp": "WhatsApp ist mit Ihrer Nachricht geöffnet: Sie müssen nur noch auf Senden tippen.",
    "contacto.error": "Ihre Anfrage konnte nicht gesendet werden.", "contacto.sin_conexion": "Sie scheinen offline zu sein.",
    "contacto.alternativa": "Sie können sie auch per WhatsApp senden.", "contacto.otra": "Weitere Frage stellen",
    "contacto.err_nombre": "Bitte geben Sie Ihren Namen ein.",
    "contacto.err_telefono": "Bitte geben Sie eine gültige Telefonnummer ein (z. B. +34 600 123 456).",
    "contacto.err_pregunta": "Bitte schreiben Sie Ihre Frage.", "contacto.err_privacidad": "Bitte akzeptieren Sie die Datenschutzerklärung.",
    "contacto.msg_saludo": "Hallo, {x}.", "contacto.msg_interes": "Ich interessiere mich für die Immobilie {x}.",
    "contacto.msg_nombre": "Name", "contacto.msg_telefono": "Telefon", "contacto.msg_pregunta": "Frage",
    "contacto.msg_estancia": "Raum", "contacto.msg_vista": "Ansicht",

    "hipoteca.titulo": "Hypothekenrechner", "hipoteca.precio": "Kaufpreis", "hipoteca.entrada": "Eigenkapital",
    "hipoteca.interes": "Jahreszins", "hipoteca.anos": "Laufzeit", "hipoteca.anos_valor": "{x} Jahre",
    "hipoteca.cuota": "Monatliche Rate", "hipoteca.financiado": "Darlehensbetrag", "hipoteca.intereses": "Zinsen gesamt",
    "hipoteca.gastos": "Ungefähre Kaufnebenkosten (~10 %: Grunderwerbsteuer oder MwSt., Notar, Grundbuch und Abwicklung): {x}. Unverbindliche Schätzung, kein Angebot.",

    "compartir.titulo": "Teilen", "compartir.copiar": "Link kopieren", "compartir.copiado": "Link kopiert",
    "compartir.whatsapp": "WhatsApp", "compartir.email": "E-Mail", "compartir.mas": "Weitere Optionen",
    "compartir.qr": "QR-Code", "compartir.qr_alt": "QR-Code mit dem Link zu dieser Ansicht", "compartir.descargar_qr": "QR herunterladen",
    "compartir.enlace": "Link zu dieser Ansicht", "compartir.mensaje": "Sieh dir diese Immobilie an: {x}",
    "compartir.qr_nota": "Scannen, um genau diese Ansicht auf dem Handy zu öffnen.",

    "herramientas.titulo": "Werkzeuge", "idioma.titulo": "Sprache",
    "ajustes.titulo": "Einstellungen", "ajustes.sens_raton": "Mausempfindlichkeit", "ajustes.sens_tactil": "Touch-Empfindlichkeit",
    "ajustes.invertir_y": "Vertikale Achse umkehren", "ajustes.reducir_movimiento": "Bewegung reduzieren",
    "ajustes.reducir_nota": "Überblendungen statt Kamerafahrten.", "ajustes.restablecer": "Zurücksetzen",
    "marca.creado_con": "Erstellt mit {x}",
    "contacto.zona": "Auf welchen Raum oder Bereich bezieht sich Ihre Frage?",
    "contacto.zona_general": "Allgemein / ganze Immobilie",
    "contacto.zona_otras": "Weitere Räume",
    "contacto.fotos": "Fotos der Ansicht",
    "contacto.fotos_nota": "Optional: Fügen Sie Fotos von dem hinzu, worauf sich Ihre Frage bezieht.",
    "contacto.hacer_foto": "Foto dieser Ansicht aufnehmen",
    "contacto.n_fotos": "{x} Fotos",
    "contacto.una_foto": "1 Foto",
    "contacto.quitar_foto": "Foto {x} entfernen",
    "contacto.foto_alt": "Foto {n}: {x}",
    "contacto.encuadra": "Ansicht ausrichten und auf Aufnehmen tippen",
    "contacto.capturar": "Aufnehmen",
    "contacto.listo": "Fertig",
    "contacto.capturada": "Foto {x} hinzugefügt",
    "contacto.max_fotos": "Maximal {x} Fotos",
    "contacto.err_captura": "Das Foto konnte nicht aufgenommen werden",
    "contacto.elige_chat": "Das Teilen-Menü öffnet sich: Wählen Sie den Chat von {x}, um die Nachricht mit den Fotos zu senden.",
    "contacto.pegar_titulo": "Letzter Schritt: Foto in WhatsApp einfügen",
    "contacto.pegar": "Foto {n} von {total} wurde kopiert. Fügen Sie es mit Strg+V (⌘V am Mac) in den Chat ein und senden Sie es.",
    "contacto.copiar_siguiente": "Nächstes Foto kopieren ({n} von {total})",
    "contacto.descargar_fotos": "Fotos herunterladen",
    "contacto.copia_fallida": "Das Foto konnte nicht kopiert werden: Laden Sie es herunter und hängen Sie es im Chat an.",
    "contacto.abrir_whatsapp": "WhatsApp erneut öffnen",
    "contacto.copiada": "Foto kopiert",
    "contacto.msg_foto": "📷 Foto {n} – {x}",
    "contacto.msg_zona": "Betreffender Raum",
    "galeria.renders": "Renderings und Pläne",
    "galeria.todo": "Alle",
    "galeria.filtro": "Galerie filtern",
    "galeria.tipo_render": "Rendering / Visualisierung",
    "galeria.tipo_foto": "Foto",
    "galeria.tipo_plano": "Plan",
    "galeria.autor": "Urheber: {x}",
    "galeria.anterior": "Vorheriges Bild",
    "galeria.siguiente": "Nächstes Bild",
    "galeria.n_de": "{n} von {total}",
    "galeria.ampliar": "Vergrößern: {x}",
    "galeria.visor": "Bildbetrachter",
    "marca.web": "Website besuchen",
  },
};

const LOCALES = { es: "es-ES", en: "en-GB", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT", ca: "ca-ES", nl: "nl-NL" };
const NOMBRES = { es: "Español", en: "English", fr: "Français", de: "Deutsch", it: "Italiano", pt: "Português", ca: "Català", nl: "Nederlands" };

let actual = "es";
const oyentes = new Set();

const base = (cod) => String(cod ?? "").toLowerCase().split(/[-_]/)[0];

export function idiomaActual() { return actual; }
export function localeActual() { return LOCALES[actual] ?? actual; }
export function nombreIdioma(cod) { return NOMBRES[cod] ?? String(cod).toUpperCase(); }

export function fijarIdioma(cod) {
  const c = base(cod);
  if (!diccionario[c] || c === actual) return actual;
  actual = c;
  try { document.documentElement.lang = c; } catch {}
  for (const fn of oyentes) { try { fn(c); } catch (e) { console.error(e); } }
  return actual;
}

export function alCambiarIdioma(fn) { oyentes.add(fn); return () => oyentes.delete(fn); }

export function tr(clave, vars) {
  let s = diccionario[actual]?.[clave] ?? diccionario.es[clave] ?? clave;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

export function resolverTexto(valor) {
  if (valor == null) return "";
  if (typeof valor !== "object") return String(valor);
  if (valor[actual] != null) return String(valor[actual]);
  if (valor.es != null) return String(valor.es);
  const primero = Object.values(valor).find((v) => v != null);
  return primero == null ? "" : String(primero);
}

export function detectarIdioma(tour = {}) {
  const ofrecidos = (tour.idiomas?.length ? tour.idiomas : Object.keys(diccionario)).map(base);
  const valido = (c) => c && diccionario[c] && ofrecidos.includes(c);
  let param = null;
  try { param = base(new URLSearchParams(location.search).get("lang")); } catch {}
  if (diccionario[param]) return param;
  const delTour = base(tour.idioma);
  if (valido(delTour)) return delTour;
  for (const n of (typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [])) {
    if (valido(base(n))) return base(n);
  }
  return valido("es") ? "es" : ofrecidos.find((c) => diccionario[c]) ?? "es";
}
