const BASE = (process.env.REACT_APP_API_URL || "/api/v1").replace(/\/$/, "");
export async function api(path, body, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort);
  }
  const timeout = setTimeout(abort, 20000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        [
          data.error?.message || "Permintaan gagal",
          ...Object.values(data.error?.fields || {}),
        ].join(" ? "),
      );
    return data;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error(
        "Permintaan dibatalkan atau melebihi 20 detik. Coba lagi.",
      );
    if (e instanceof TypeError || e instanceof SyntaxError)
      throw new Error(
        "Backend belum dapat dihubungi. Jalankan FastAPI dan periksa konfigurasi API.",
      );
    throw e;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
export const listPlaces = (signal) => api("/places", undefined, signal);
