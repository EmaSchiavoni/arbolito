import { Reveal } from '@/landing/components/Reveal';
import { TiltCard } from '@/landing/components/TiltCard';
import { AvlArt, BTreeArt, NaryArt, RotationArt } from '@/landing/TreeArt';

const CARDS = [
  {
    label: 'Árbol B',
    tag: null,
    text: 'Nodos con varias claves y punteros, divisiones al superar el orden p y todas las hojas al mismo nivel.',
    art: <BTreeArt className="h-44 w-full" />,
  },
  {
    label: 'Árbol AVL',
    tag: null,
    text: 'Árbol binario de búsqueda balanceado. Cada nodo muestra altura y factor de balance; las rotaciones restablecen el equilibrio.',
    art: <AvlArt className="h-44 w-full" />,
  },
  {
    label: 'N-ario',
    tag: 'previsto',
    text: 'Estructura con más de dos hijos por nodo. La arquitectura permite incorporarla como un nuevo playground.',
    art: <NaryArt className="h-44 w-full" />,
  },
  {
    label: 'Rotaciones',
    tag: 'concepto',
    text: 'Rotaciones simples y dobles que reordenan subárboles y restablecen el factor de balance tras una inserción o eliminación.',
    art: <RotationArt className="h-44 w-full" />,
  },
];

export function StructuresSection() {
  return (
    <section id="tipos" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-24 sm:py-28">
      <Reveal>
        <h2 className="max-w-4xl font-display text-4xl leading-[1.02] tracking-[-0.05em] sm:text-6xl">
          Estructuras y conceptos
          <br />
          <span className="font-thin">del playground.</span>
        </h2>
      </Reveal>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card, index) => (
          <TiltCard key={card.label} delay={index * 80}>
            <div className="landing-card group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/50 p-5 backdrop-blur-sm transition-colors hover:bg-card/80">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-foreground/[0.035] to-transparent" />
              <div className="relative flex items-center justify-between gap-3 font-display text-[9px] uppercase tracking-[0.22em]">
                <span className="text-muted-foreground">{card.label}</span>
                {card.tag && <span className="text-muted-foreground">[{card.tag}]</span>}
              </div>
              <div className="relative mt-2">{card.art}</div>
              <p className="relative mt-auto pt-3 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
