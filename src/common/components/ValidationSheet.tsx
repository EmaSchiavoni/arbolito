import { Badge } from '@/common/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/common/components/ui/sheet';
import type { ValidationResult } from '@/common/validate/graph';

interface ValidationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ValidationResult | null;
  successMessage: string;
  errorHint: string;
}

export function ValidationSheet({ open, onOpenChange, result, successMessage, errorHint }: ValidationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70dvh] overflow-auto rounded-t-3xl sm:mx-auto sm:w-full sm:max-w-lg sm:rounded-3xl">
        <SheetHeader>
          <SheetTitle>Resultado de la validación</SheetTitle>
        </SheetHeader>
        <div className="mt-3">
          {!result ? null : result.valid ? (
            <div className="flex items-center gap-2">
              <Badge variant="ok">válido</Badge>
              <p className="text-sm text-muted-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="error">{result.issues.length} errores</Badge>
                <p className="text-sm text-muted-foreground">{errorHint}</p>
              </div>
              <ul className="space-y-1.5">
                {result.issues.map((it, i) => (
                  <li key={i} className="rounded-2xl border border-red-200 px-3 py-2 text-sm text-muted-foreground dark:border-red-900">
                    · {it.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
