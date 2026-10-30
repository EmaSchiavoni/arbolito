// Intento de compartir con la hoja nativa del sistema.
//
// `navigator.share` no informa si el usuario completó el envío: solo resuelve
// o rechaza. En algunos escritorios (Windows) la hoja abre y se cierra sola
// resolviendo la promesa, así que no hay forma de confirmarlo. Acá se estima
// con tres señales baratas: tiempo hasta resolver, nombre del error y si la
// página perdió el foco durante el intento. Si el resultado parece inviable,
// la UI muestra la alternativa de copiar el enlace.

import { canNativeShare, shareNative, type NativeShareData } from 'react-share';

export type NativeShareOutcome = 'shared' | 'cancelled' | 'unlikely' | 'failed' | 'unsupported' | 'skipped';

export interface NativeShareResult {
  outcome: NativeShareOutcome;
  elapsedMs: number;
}

/** Una hoja que se cierra antes de esto casi seguro no llegó a mostrarse. */
const ABORT_SUSPICIOUS_MS = 1000;
/** Resolver antes de esto es demasiado rápido para un envío real. */
const RESOLVE_SUSPICIOUS_MS = 1500;
/** En la franja siguiente, la falta de foco delata que no hubo hoja real. */
const RESOLVE_DOUBTFUL_MS = 2500;
/** Intentos sospechosos antes de dejar de usar la API nativa en esta sesión. */
const SUSPICIONS_BEFORE_SKIP = 2;
/** Para contar como sospecha "definitiva" (desactiva la API) el intento debe ser muy corto. */
const STRIKE_MS = 1000;

let suspicions = 0;
let unreliable = false;

/** Clasificación pura para poder verificarla sin tocar el navegador. */
export function classifyNativeShare({
  errorName,
  elapsedMs,
  lostFocus,
}: {
  errorName?: string;
  elapsedMs: number;
  lostFocus: boolean;
}): NativeShareOutcome {
  if (errorName) {
    if (errorName === 'AbortError') return elapsedMs < ABORT_SUSPICIOUS_MS ? 'unlikely' : 'cancelled';
    return 'failed';
  }
  // La hoja de Windows puede robar el foco y aun así cerrarse sola, así que
  // el tiempo manda y la pérdida de foco solo desempata en la zona dudosa.
  if (elapsedMs < RESOLVE_SUSPICIOUS_MS) return 'unlikely';
  if (elapsedMs < RESOLVE_DOUBTFUL_MS && !lostFocus) return 'unlikely';
  return 'shared';
}

function noteSuspicion() {
  if (unreliable) return;
  suspicions += 1;
  if (suspicions >= SUSPICIONS_BEFORE_SKIP) unreliable = true;
}

/**
 * Llama a la API nativa midiendo el intento. La llamada a `shareNative` ocurre
 * de forma síncrona antes del primer `await` para conservar la activación de
 * usuario que exige el navegador.
 */
export async function attemptNativeShare(data: NativeShareData): Promise<NativeShareResult> {
  if (unreliable) return { outcome: 'skipped', elapsedMs: 0 };
  if (!canNativeShare(data)) return { outcome: 'unsupported', elapsedMs: 0 };

  let lostFocus = false;
  const markFocusLost = () => {
    lostFocus = true;
  };
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') lostFocus = true;
  };
  window.addEventListener('blur', markFocusLost);
  document.addEventListener('visibilitychange', onVisibility);

  const startedAt = performance.now();
  let errorName: string | undefined;
  try {
    await shareNative(data);
  } catch (error) {
    if (error instanceof DOMException || error instanceof Error) errorName = error.name;
    else errorName = 'Error';
  } finally {
    window.removeEventListener('blur', markFocusLost);
    document.removeEventListener('visibilitychange', onVisibility);
  }

  const elapsedMs = Math.round(performance.now() - startedAt);
  const outcome = classifyNativeShare({ errorName, elapsedMs, lostFocus });
  // Solo los fallos claros desactivan la API: un resultado dudoso abre el
  // diálogo pero no penaliza a los dispositivos donde el nativo funciona.
  if (outcome === 'failed' || (outcome === 'unlikely' && elapsedMs < STRIKE_MS)) noteSuspicion();
  return { outcome, elapsedMs };
}
