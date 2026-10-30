import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';

// Badges compactos con las características del árbol. El contenedor no tiene
// fondo: solo los chips y el botón para ocultarlos/mostrarlos.
export function TreeBadges({ items }: { items: string[] }) {
  const [visible, setVisible] = React.useState(true);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {visible &&
        items.map((item) => (
          <Badge
            key={item}
            variant="outline"
            className="h-5 border-border/70 bg-transparent px-1.5 text-[10px] font-normal text-muted-foreground"
          >
            {item}
          </Badge>
        ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setVisible((v) => !v)}
        title={visible ? 'Ocultar características' : 'Mostrar características'}
        aria-label={visible ? 'Ocultar características' : 'Mostrar características'}
        className="h-5 gap-1 rounded-full px-1.5 text-[10px] text-muted-foreground"
      >
        {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        {visible ? 'Ocultar' : 'Mostrar características'}
      </Button>
    </div>
  );
}
