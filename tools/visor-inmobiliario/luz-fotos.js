// La luz sobre las fotos 360 (sombreadores del recorrido y de la maqueta con fotos): proyección equirectangular, el sol de
// la barra que entra por las ventanas de la estancia y el tono de cada momento del día. Solo GLSL (cadenas).
// Las fotos se tratan como lo que son, una sola vista desde la cámara: la estancia es su polígono del plano (muros relativos
// a la cámara, hasta 16) y las ventanas, lo más claro de la foto donde el rayo hacia el sol cruza el muro.
export const GLSL_LUZ_FOTOS = /* glsl */ `
  uniform vec3 solDir, solFotoDir, solKA, solKF; // sol de ahora y el de la hora de la foto (dirección, fuerza y color)
  const float PI = 3.141592653589793;
  const vec3 LUM = vec3(0.2126, 0.7152, 0.0722);
  vec2 uvDe(vec3 d, float yaw) {
    float h = atan(d.x, -d.z) - yaw;
    return vec2(fract(0.5 + h / (2.0 * PI)), 0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI);
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
  // foto qué hay donde cruza el muro: si es una ventana (lo más claro de la foto), entra el sol. 0-1.
  float leDa(vec3 P, vec3 n, vec3 s, vec4 muros[16], float nMuros, vec2 altos, sampler2D tex, float yaw) {
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
    float Lw = dot(texture2D(tex, uvDe(normalize(W), yaw)).rgb, LUM);
    return smoothstep(0.7, 0.92, Lw) * cosn;
  }
  // El sol de la barra en el punto P (relativo a la cámara de la foto): recibe el sol de ahora si entra por una ventana y
  // pierde el de la hora de la foto (que la foto ya traía). A la hora de la foto la imagen queda igual; lo que la foto tenía
  // quemado (blanco) se quita a medias, para no dejar una mancha oscura.
  vec3 relucirEn(vec3 c, vec3 P, vec3 n, vec4 muros[16], float nMuros, vec2 altos, sampler2D tex, float yaw) {
    float ahora = solKA.r > 0.0 ? leDa(P, n, solDir, muros, nMuros, altos, tex, yaw) : 0.0;
    float antes = solKF.r > 0.0 ? leDa(P, n, solFotoDir, muros, nMuros, altos, tex, yaw) : 0.0;
    float quemado = smoothstep(0.9, 1.0, dot(c, LUM));
    vec3 r = (vec3(1.0) + solKA * ahora) / (vec3(1.0) + solKF * antes * (1.0 - 0.5 * quemado));
    vec3 c2 = c * r;
    // hombro de las altas luces solo donde el sol suma: la mancha se satura con suavidad y lo demás queda como en la foto
    vec3 hombro = max(0.85 + 0.15 * (1.0 - exp(-(c2 - 0.85) / 0.15)), c);
    return mix(c2, hombro, step(0.85, c2) * step(1.0001, r));
  }
  // El tono de un momento sobre la foto: cálido al alba y al ocaso (sim.x) y la noche (sim.y) con las luces de casa
  // encendidas, como una foto de crepúsculo: el interior cálido y más tenue, lo muy claro a media altura (las ventanas) pasa
  // a cielo de noche y lo muy claro del techo (las lámparas), a un resplandor cálido. alto: cuánto mira al techo (0-1).
  vec3 simular(vec3 c, float alto, vec2 sim) {
    float L = dot(c, LUM);
    if (sim.x > 0.0) c = mix(c, c * vec3(1.06, 0.80, 0.60) * 0.78, sim.x);
    if (sim.y > 0.0) {
      float claro = smoothstep(0.82, 0.97, L);
      vec3 interior = c * vec3(0.58, 0.45, 0.32);
      vec3 cielo = vec3(0.025, 0.045, 0.1) + c * vec3(0.03, 0.04, 0.07);
      vec3 lampara = vec3(1.0, 0.78, 0.52) * (0.55 + 0.45 * L);
      c = mix(c, mix(interior, mix(cielo, lampara, alto), claro), sim.y);
    }
    return c;
  }
`;
