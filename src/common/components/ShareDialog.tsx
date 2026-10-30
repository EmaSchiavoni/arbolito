import * as React from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import {
  EmailIcon,
  EmailShareButton,
  NativeShareIcon,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  canNativeShare,
} from 'react-share';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from './ui/use-toast';
import { trackOutbound } from '../analytics';
import { copyText } from '../lib/clipboard';
import { LONG_URL_WARNING } from '../share/codec';
import { attemptNativeShare } from '../share/native';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
}

const SOCIALS = [
  { id: 'whatsapp', label: 'WhatsApp', Button: WhatsappShareButton, Icon: WhatsappIcon },
  { id: 'telegram', label: 'Telegram', Button: TelegramShareButton, Icon: TelegramIcon },
  { id: 'email', label: 'Correo', Button: EmailShareButton, Icon: EmailIcon },
] as const;

const SOCIAL_CLASS =
  'flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800';

const NATIVE_SHARE = {
  title: 'Árbol compartido · Arbolito',
  text: 'Mirá este árbol en Arbolito.',
};

// Alternativa a la hoja nativa: copiar el enlace o abrir una red social.
export function ShareDialog({ open, onOpenChange, url }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const canShareNative = canNativeShare({ url, ...NATIVE_SHARE });

  function handleOpen(next: boolean) {
    if (!next) setCopied(false);
    onOpenChange(next);
  }

  async function copy() {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      toast({ description: 'Enlace copiado.' });
      return;
    }
    // Sin portapapeles disponible al menos dejamos el enlace seleccionado.
    inputRef.current?.select();
    setCopied(false);
    toast({ description: 'No se pudo copiar el enlace.' });
  }

  // En desktop "Más" puede fallar como la hoja del sistema; no importa:
  // el usuario ya está en el diálogo con el enlace a mano.
  async function shareWithSystem() {
    const { outcome } = await attemptNativeShare({ url, ...NATIVE_SHARE });
    if (outcome === 'shared') handleOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir árbol</DialogTitle>
          <DialogDescription>
            El enlace incluye el árbol comprimido. Quien lo abra podrá verlo y guardarlo como propio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            readOnly
            value={url}
            aria-label="Enlace para compartir"
            className="h-9 font-mono text-xs"
            onFocus={(e) => e.target.select()}
          />
          <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copiar enlace">
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        {url.length > LONG_URL_WARNING && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            El enlace es largo. Algunas aplicaciones de mensajería podrían cortarlo; si pasa, probá copiarlo y pegarlo.
          </p>
        )}

        <div className={canShareNative ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'}>
          {SOCIALS.map(({ id, label, Button: SocialButton, Icon }) => (
            <SocialButton
              key={id}
              url={url}
              title="Árbol compartido · Arbolito"
              className={SOCIAL_CLASS}
              onClick={() => trackOutbound(id, 'share_dialog')}
            >
              <Icon size={34} />
              {label}
            </SocialButton>
          ))}
          {canShareNative && (
            <button type="button" onClick={shareWithSystem} className={SOCIAL_CLASS}>
              <NativeShareIcon size={34} />
              Más
            </button>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Link2 className="mt-0.5 size-3.5 shrink-0" />
          El enlace funciona sin cuenta. Si el árbol cambia después de compartirlo, el enlace conserva esta versión.
        </p>
      </DialogContent>
    </Dialog>
  );
}
