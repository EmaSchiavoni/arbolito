import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Collapsible, CollapsibleTrigger } from './ui/collapsible';
import { useIsOverflowing } from '../lib/use-is-overflowing';
import { cn } from '../lib/utils';

interface HeaderBadgesProps {
  children: React.ReactNode;
  align: 'start' | 'end';
}

// Fila de badges del header. En desktop se alinean a la derecha; en mobile, a
// la izquierda y se recortan a una fila con un botón para expandir/plegar.
export function HeaderBadges({ children, align }: HeaderBadgesProps) {
  const [expanded, setExpanded] = React.useState(false);
  const { ref, overflowing } = useIsOverflowing<HTMLDivElement>();
  const justify = align === 'end' ? cn('justify-end', 'max-sm:justify-start') : '';

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      className={cn('flex min-w-0 items-center gap-2', align === 'end' ? 'w-full flex-1 justify-end' : 'max-w-full')}
    >
      <div
        ref={ref}
        className={cn(
          'flex min-w-0 items-center gap-2 [&>*]:shrink-0 [&>*]:whitespace-nowrap',
          align === 'end' && 'flex-1',
          expanded ? 'flex-wrap' : 'max-sm:flex-nowrap max-sm:overflow-hidden sm:flex-wrap',
          justify,
        )}
      >
        {children}
      </div>
      {(expanded || overflowing) && (
        <CollapsibleTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="pointer-events-auto shrink-0 px-2 sm:hidden"
            title={expanded ? 'Ver menos' : 'Ver más'}
          >
            {expanded ? (
              <>
                <ChevronLeft />
                Ver menos
              </>
            ) : (
              <>
                Ver más
                <ChevronRight />
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
}
