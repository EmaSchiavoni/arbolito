import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export type Mode = 'auto' | 'manual';

export const MODES: Mode[] = ['auto', 'manual'];

export interface ModeDefinition {
  label: string;
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType>;
}

export interface PlaygroundDefinition {
  id: string;
  title: string;
  short: string;
  description: string;
  modes: Record<Mode, ModeDefinition>;
}
