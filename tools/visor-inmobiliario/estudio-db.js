// Autoguardado del Estudio en IndexedDB: proyectos (tour + metadatos) y archivos (blobs de imágenes).
const NOMBRE = "estudio-visor-inmobiliario";
let dbp = null;

function abrir() {
  if (dbp) return dbp;
  dbp = new Promise((ok, mal) => {
    let req;
    try { req = indexedDB.open(NOMBRE, 1); } catch (e) { return mal(e); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("proyectos")) db.createObjectStore("proyectos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("archivos")) {
        const s = db.createObjectStore("archivos", { keyPath: "clave" });
        s.createIndex("proyecto", "proyecto");
      }
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => mal(req.error);
    req.onblocked = () => mal(new Error("Base de datos bloqueada por otra pestaña"));
  });
  dbp.catch(() => { dbp = null; });
  return dbp;
}

function tx(almacenes, modo, fn) {
  return abrir().then((db) => new Promise((ok, mal) => {
    const t = db.transaction(almacenes, modo);
    let r;
    Promise.resolve(fn(t)).then((v) => { r = v; });
    t.oncomplete = () => ok(r);
    t.onerror = () => mal(t.error);
    t.onabort = () => mal(t.error ?? new Error("Transacción abortada"));
  }));
}
const req2p = (req) => new Promise((ok, mal) => { req.onsuccess = () => ok(req.result); req.onerror = () => mal(req.error); });

export const db = {
  async listar() {
    return tx(["proyectos"], "readonly", (t) => req2p(t.objectStore("proyectos").getAll()))
      .then((l) => l.map(({ id, nombre, actualizado, miniatura, nFotos }) => ({ id, nombre, actualizado, miniatura, nFotos }))
        .sort((a, b) => b.actualizado - a.actualizado));
  },
  async guardarProyecto(p) { return tx(["proyectos"], "readwrite", (t) => { t.objectStore("proyectos").put(p); }); },
  async cargarProyecto(id) { return tx(["proyectos"], "readonly", (t) => req2p(t.objectStore("proyectos").get(id))); },
  async guardarArchivo(proyecto, ruta, blob) {
    return tx(["archivos"], "readwrite", (t) => { t.objectStore("archivos").put({ clave: proyecto + "::" + ruta, proyecto, ruta, blob }); });
  },
  async borrarArchivo(proyecto, ruta) { return tx(["archivos"], "readwrite", (t) => { t.objectStore("archivos").delete(proyecto + "::" + ruta); }); },
  async archivos(proyecto) {
    const filas = await tx(["archivos"], "readonly", (t) => req2p(t.objectStore("archivos").index("proyecto").getAll(proyecto)));
    return new Map(filas.map((f) => [f.ruta, f.blob]));
  },
  async borrarProyecto(id) {
    return tx(["proyectos", "archivos"], "readwrite", (t) => {
      t.objectStore("proyectos").delete(id);
      const idx = t.objectStore("archivos").index("proyecto");
      idx.openKeyCursor(IDBKeyRange.only(id)).onsuccess = (e) => {
        const c = e.target.result;
        if (c) { t.objectStore("archivos").delete(c.primaryKey); c.continue(); }
      };
    });
  },
  async espacio() {
    try { const e = await navigator.storage?.estimate?.(); return e ?? null; } catch { return null; }
  },
  async persistir() { try { return await navigator.storage?.persist?.(); } catch { return false; } },
};
