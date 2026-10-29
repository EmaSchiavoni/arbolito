import * as React from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import {
  EmailIcon,
  EmailShareButton,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from 'react-share';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { toast } from './ui/use-toast';
import { trackOutbound } from '../analytics';
import { LONG_URL_WARNING } from '../share/codec';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
}

const SOCIALS = [
  { id: 'whatsapp', label: 'WhatsApp', Button: WhatsappShareButton, Icon: WhatsappIcon },
  { id: 'telegram', label: 'Telegram', Button: TelegramShareButton, Icon: TelegramIcon },
  { id: 'x', label: 'X', Button: XShareButton, Icon: XIcon },
  { id: 'email', label: 'Correo', Button: EmailShareButton, Icon: EmailIcon },
] as const;

// Alternativa a la hoja nativa: copiar el enlace o abrir una red social.
export function ShareDialog({ open, onOpenChange, url }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleOpen(next: boolean) {
    if (!next) setCopied(false);
    onOpenChange(next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ description: 'Enlace copiado.' });
    } catch {
      // Fallback para navegadores sin Clipboard API.
      const input = inputRef.current;
      if (!input) return;
      input.select();
      const ok = document.execCommand('copy');
      setCopied(ok);
      toast({ description: ok ? 'Enlace copiado.' : 'No se pudo copiar el enlace.' });
    }
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

        <div className="grid grid-cols-4 gap-2">
          {SOCIALS.map(({ id, label, Button: SocialButton, Icon }) => (
            <SocialButton
              key={id}
              url={url}
              title="Árbol compartido · Arbolito"
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => trackOutbound(id, 'share_dialog')}
            >
              <Icon size={34} />
              {label}
            </SocialButton>
          ))}
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Link2 className="mt-0.5 size-3.5 shrink-0" />
          El enlace funciona sin cuenta. Si el árbol cambia después de compartirlo, el enlace conserva esta versión.
        </p>
      </DialogContent>
    </Dialog>
  );
}
