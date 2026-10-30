import * as React from 'react';
import { trackUi } from '@/common/analytics';
import { toast } from '@/common/components/ui/use-toast';
import { copyText } from '@/common/lib/clipboard';
import type { Mode } from '@/common/playground';
import { buildShareQuery } from '@/common/share/codec';
import { attemptNativeShare } from '@/common/share/native';
import type { PlaygroundShareAdapter } from '@/common/share/types';

interface ShareActionsArgs {
  playgroundId: string;
  mode: Mode;
  share?: {
    adapter: PlaygroundShareAdapter;
    state: unknown;
  };
  canShare: boolean;
}

export function useShareActions({ playgroundId, mode, share, canShare }: ShareActionsArgs) {
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);

  // Todo el camino hasta acá es síncrono: la API nativa exige conservar la
  // activación de usuario que disparó el click.
  function resolveShareUrl(): string | null {
    if (!share || !canShare) return null;
    const data = share.adapter.serialize(mode, share.state);
    if (!data) {
      toast({ description: 'No se pudo preparar el árbol para compartirlo.' });
      return null;
    }
    const query = buildShareQuery({ tree: playgroundId, mode, ...data });
    if (!query) {
      toast({ description: 'El árbol es demasiado grande para compartirlo por enlace.' });
      return null;
    }
    return `${window.location.origin}${window.location.pathname}?${query}`;
  }

  function openShareFallback(url: string) {
    setShareUrl(url);
    setShareOpen(true);
  }

  async function launchShare() {
    const url = resolveShareUrl();
    if (!url) return;
    trackUi('share', { playground: playgroundId, mode });
    const { outcome, elapsedMs } = await attemptNativeShare({
      url,
      title: 'Árbol compartido · Arbolito',
      text: 'Mirá este árbol en Arbolito.',
    });
    trackUi('share_result', { playground: playgroundId, mode, outcome, ms: msBucket(elapsedMs) });
    // Compartido o cancelado por el usuario: no hace falta decir nada.
    if (outcome === 'shared' || outcome === 'cancelled') return;
    // Sin pistas para el usuario: si en realidad pudo compartir, cierra el
    // diálogo y listo.
    openShareFallback(url);
  }

  async function copyShareLink() {
    const url = resolveShareUrl();
    if (!url) return;
    const ok = await copyText(url);
    trackUi('share_copy', { playground: playgroundId, mode, ok });
    toast({ description: ok ? 'Enlace copiado.' : 'No se pudo copiar el enlace.' });
  }

  return { shareOpen, setShareOpen, shareUrl, launchShare, copyShareLink };
}

function msBucket(ms: number): string {
  if (ms < 1000) return 'lt1s';
  if (ms < 5000) return '1-5s';
  return 'gt5s';
}
