// La luz sobre las fotos 360 (sombreadores del recorrido y de la maqueta con fotos): proyección equirectangular, el sol de
// la barra que entra por las ventanas de la estancia y el tono de cada momento del día. Solo GLSL (cadenas).
// Las fotos se tratan como lo que son, una sola vista desde la cámara: la estancia es su polígono del plano (muros relativos
// a la cámara, hasta 16). Las ventanas son el canal B de la máscara de la foto si la trae (`mascara`); si no, lo muy claro,
// neutro y grande de la foto: lo claro y cálido es luz de casa (lámparas, apliques) y una lámpara es una mancha pequeña.
export const GLSL_LUZ_FOTOS = /* glsl */ `
  uniform vec3 solDir, solFotoDir, solKA, solKF; // sol de ahora y el de la hora de la foto (dirección, fuerza y color)
  uniform float solCubierto; // 1: fotos con el cielo cubierto (tour.sol.cielo): sin manchas de sol que quitar
  const float PI = 3.141592653589793;
  const vec3 LUM = vec3(0.2126, 0.7152, 0.0722);
  vec2 uvDe(vec3 d, float yaw) {
    float h = atan(d.x, -d.z) - yaw;
    return vec2(fract(0.5 + h / (2.0 * PI)), 0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI);
  }
  // Cuánto es luz de bombilla un color claro (0-1): la luz de día es neutra o fría; la de casa, cálida.
  float calidez(vec3 c, float L) { return smoothstep(0.12, 0.3, (c.r - c.b) / max(L, 0.02)); }
  // Cuánto es ventana (cristal con la luz de fuera) el punto uv de la foto (0-1): la máscara si la hay; si no, lo muy
  // claro, neutro y grande (seis muestras a ~2° alrededor: una lámpara o un reflejo no llegan).
  float ventanaEn(sampler2D tex, vec2 uv, sampler2D masc, float hayMasc) {
    if (hayMasc > 0.5) return texture2D(masc, uv).b;
    vec3 c = texture2D(tex, uv).rgb;
    float L = dot(c, LUM), g = 0.0;
    for (int i = 0; i < 6; i++) {
      float a = float(i) * 1.0472;
      g += dot(texture2D(tex, uv + vec2(cos(a) * 0.006, sin(a) * 0.012)).rgb, LUM);
    }
    return smoothstep(0.7, 0.92, L) * smoothstep(0.62, 0.85, g / 6.0) * (1.0 - calidez(c, L));
  }
  // Ventana y luz de casa en el punto uv de la foto, para la noche: (ventana, lámpara) 0-1. Lámpara: muy claro y más que lo
  // que lo rodea (una lámpara, un aplique; no una pared clara) o muy claro y cálido, y que no sea ventana.
  vec2 focos(sampler2D tex, vec2 uv, sampler2D masc, float hayMasc) {
    vec3 c = texture2D(tex, uv).rgb;
    float L = dot(c, LUM), g = 0.0;
    for (int i = 0; i < 6; i++) {
      float a = float(i) * 1.0472;
      g += dot(texture2D(tex, uv + vec2(cos(a) * 0.006, sin(a) * 0.012)).rgb, LUM);
    }
    g /= 6.0;
    float vent = hayMasc > 0.5 ? texture2D(masc, uv).b : smoothstep(0.7, 0.92, L) * smoothstep(0.62, 0.85, g) * (1.0 - calidez(c, L));
    float lamp = smoothstep(0.86, 0.98, L) * max(smoothstep(0.04, 0.14, L - g), calidez(c, L)) * (1.0 - vent);
    return vec2(vent, lamp);
  }
  // Rayo horizontal o + r·t contra el muro a→b (relativos a la cámara): t, o -1 si no lo corta.
  float cortaMuro(vec2 o, vec2 r, vec4 m) {
    vec2 e = m.zw - m.xy, a = m.xy - o;
    float den = r.x * e.y - r.y * e.x;
    if (abs(den) < 1e-6) return -1.0;
    float t = (a.x * e.y - a.y * e.x) / den, u = (a.x * r.y - a.y * r.x) / den;
    return u >= 0.0 && u <= 1.0 ? t : -1.0;
  }
  // El punto de la estancia que se ve desde la cámara en la dirección d (suelo, techo o muro): distancia y normal.
  float superficie(vec3 d, vec4 muros[16], float nMuros, vec2 altos, out vec3 n) {
    float t = 1e5; n = vec3(0.0);
    if (d.y < -1e-3) { t = altos.x / -d.y; n = vec3(0.0, 1.0, 0.0); }
    if (d.y > 1e-3) { t = (altos.y - altos.x) / d.y; n = vec3(0.0, -1.0, 0.0); }
    for (int i = 0; i < 16; i++) {
      if (float(i) >= nMuros) break;
      float tm = cortaMuro(vec2(0.0), d.xz, muros[i]);
      if (tm > 1e-3 && tm < t) {
        t = tm;
        vec2 e = muros[i].zw - muros[i].xy;
        n = normalize(vec3(-e.y, 0.0, e.x));
        if (dot(n.xz, d.xz) > 0.0) n = -n;
      }
    }
    return t;
  }
  // ¿Le da el sol (dirección s) al punto P de la estancia, con normal n? Sale de la estancia hacia el sol y mira en la
  // foto qué hay donde cruza el muro: si es una ventana, entra el sol. 0-1.
  float leDa(vec3 P, vec3 n, vec3 s, vec4 muros[16], float nMuros, vec2 altos, sampler2D tex, float yaw, sampler2D masc, float hayMasc) {
    float cosn = dot(n, s);
    if (cosn <= 0.0 || s.y <= 0.0) return 0.0;
    float tW = 1e5;
    for (int i = 0; i < 16; i++) {
      if (float(i) >= nMuros) break;
      float t = cortaMuro(P.xz, s.xz, muros[i]);
      if (t > 0.02 && t < tW) tW = t;
    }
    if (tW > 9e4) return 0.0;
    vec3 W = P + s * tW;
    float y = W.y + altos.x; // altura del cruce sobre el suelo
    if (y < 0.05 || y > altos.y - 0.05) return 0.0; // por debajo del suelo o tapado por el techo
    return ventanaEn(tex, uvDe(normalize(W), yaw), masc, hayMasc) * cosn;
  }
  // El sol de la barra en el punto P (relativo a la cámara de la foto): recibe el sol de ahora si entra por una ventana y
  // pierde el de la hora de la foto (que la foto ya traía). A la hora de la foto la imagen queda igual; lo que la foto tenía
  // quemado (blanco) se quita a medias, para no dejar una mancha oscura. Con el cielo cubierto la foto no trae manchas de
  // sol: solo se suma el sol que entra donde a la hora de la foto no entraba (nada se oscurece).
  vec3 relucirEn(vec3 c, vec3 P, vec3 n, vec4 muros[16], float nMuros, vec2 altos, sampler2D tex, float yaw, sampler2D masc, float hayMasc) {
    float ahora = solKA.r > 0.0 ? leDa(P, n, solDir, muros, nMuros, altos, tex, yaw, masc, hayMasc) : 0.0;
    float antes = solKF.r > 0.0 ? leDa(P, n, solFotoDir, muros, nMuros, altos, tex, yaw, masc, hayMasc) : 0.0;
    float quemado = smoothstep(0.9, 1.0, dot(c, LUM));
    vec3 r = solCubierto > 0.5 ? vec3(1.0) + max(solKA * ahora - solKF * antes, vec3(0.0))
      : (vec3(1.0) + solKA * ahora) / (vec3(1.0) + solKF * antes * (1.0 - 0.5 * quemado));
    vec3 c2 = c * r;
    // hombro de las altas luces solo donde el sol suma: la mancha se satura con suavidad y lo demás queda como en la foto
    vec3 hombro = max(0.85 + 0.15 * (1.0 - exp(-(c2 - 0.85) / 0.15)), c);
    return mix(c2, hombro, step(0.85, c2) * step(1.0001, r));
  }
  // El tono de un momento sobre la foto: cálido al alba y al ocaso (sim.x) y la noche (sim.y), como una foto de crepúsculo.
  // f = (ventana, lámpara) de focos(). Dentro: por las ventanas se ve lo de fuera a oscuras, las lámparas siguen
  // encendidas y el resto queda cálido y más tenue. Fuera (ext = 1): el cielo (lo claro sobre el horizonte) pasa a cielo de
  // noche, lo demás a la luz de la luna y las ventanas de la casa se encienden. dy: altura de la dirección de la vista (-1 a 1).
  vec3 simular(vec3 c, float dy, vec2 sim, vec2 f, float ext) {
    float L = dot(c, LUM);
    if (sim.x > 0.0) c = mix(c, c * vec3(1.06, 0.80, 0.60) * 0.78, sim.x);
    if (sim.y > 0.0) {
      vec3 noche;
      if (ext > 0.5) {
        float cielo = smoothstep(0.55, 0.85, L) * smoothstep(-0.02, 0.12, dy) * (1.0 - f.x);
        vec3 boveda = mix(vec3(0.06, 0.09, 0.18), vec3(0.012, 0.018, 0.045), clamp(dy * 1.4, 0.0, 1.0)) + c * vec3(0.02, 0.03, 0.05);
        vec3 luna = c * vec3(0.1, 0.12, 0.18) + vec3(0.004, 0.006, 0.012);
        vec3 dentro = vec3(1.0, 0.7, 0.36) * (0.45 + 0.7 * L);
        noche = mix(mix(luna, boveda, cielo), dentro, f.x);
      } else {
        // (en lineal) lo que la foto ya tenía alumbrado por bombillas (claro y cálido) sigue casi igual; lo demás, a media luz
        vec3 interior = c * mix(vec3(0.3, 0.22, 0.14), vec3(0.78, 0.66, 0.5), calidez(c, L) * smoothstep(0.3, 0.7, L));
        // lámparas: si en la foto ya son cálidas, tal cual; las blancas (pantallas quemadas), un resplandor cálido
        vec3 lampara = mix(vec3(1.0, 0.8, 0.55) * (0.6 + 0.4 * L), c, calidez(c, L));
        vec3 fuera = c * vec3(0.02, 0.03, 0.06) + vec3(0.005, 0.008, 0.02);
        noche = mix(mix(interior, lampara, f.y), fuera, f.x);
      }
      c = mix(c, noche, sim.y);
    }
    return c;
  }
`;
