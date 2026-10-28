import { lazy } from 'react';
import { GitBranch, Network, PencilRuler } from 'lucide-react';
import type { PlaygroundDefinition } from '../common/playground';

const BTreeAuto = lazy(() => import('../playgrounds/btree/ui/AutoPlayground').then((m) => ({ default: m.AutoPlayground })));
const BTreeManual = lazy(() => import('../playgrounds/btree/ui/ManualPlayground').then((m) => ({ default: m.ManualPlayground })));
const AvlAuto = lazy(() => import('../playgrounds/avl/ui/AutoPlayground').then((m) => ({ default: m.AutoPlayground })));
const AvlManual = lazy(() => import('../playgrounds/avl/ui/ManualPlayground').then((m) => ({ default: m.ManualPlayground })));

// Única fuente de verdad para la navegación y las rutas: agregar un
// playground es sumar una entrada a este arreglo.
export const PLAYGROUNDS: PlaygroundDefinition[] = [
  {
    id: 'btree',
    title: 'Árbol B',
    short: 'B',
    description: 'Inserción, eliminación y búsqueda con divisiones, préstamos y fusiones.',
    modes: {
      auto: { label: 'Automático', icon: Network, component: BTreeAuto },
      manual: { label: 'Manual', icon: PencilRuler, component: BTreeManual },
    },
  },
  {
    id: 'avl',
    title: 'Árbol AVL',
    short: 'AVL',
    description: 'Árbol binario de búsqueda balanceado con rotaciones simples y dobles.',
    modes: {
      auto: { label: 'Automático', icon: GitBranch, component: AvlAuto },
      manual: { label: 'Manual', icon: PencilRuler, component: AvlManual },
    },
  },
];

export function getPlayground(id: string | undefined): PlaygroundDefinition | null {
  return PLAYGROUNDS.find((p) => p.id === id) ?? null;
}
