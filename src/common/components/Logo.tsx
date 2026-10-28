// Imagotipo del proyecto: mark del favicon + "Arbol" en monoespaciada.
// El SVG usa currentColor para acompañar el tema claro/oscuro de la app.
export function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-2" aria-label="Arbol">
      <svg viewBox="0 0 256 256" className="size-9" aria-hidden="true" fill="currentColor">
        <path d="M128 187.9a72 72 0 0 0 8 4.6V232a8 8 0 0 1-16 0v-39.5a72 72 0 0 0 8-4.6m70.1-125.3a76 76 0 0 0-140.2 0A72 72 0 0 0 16 127.8 72.4 72.4 0 0 0 86.1 200a72 72 0 0 0 33.9-7.5v-35.6l-43.6-21.7a8 8 0 1 1 7.2-14.4l36.4 18.3V88a8 8 0 0 1 16 0v27l36.4-18.2a8 8 0 1 1 7.2 14.4L136 132.9v59.6a72 72 0 0 0 32 7.5h1.9a72.4 72.4 0 0 0 70.1-72.2 72 72 0 0 0-41.9-65.2"/>
      </svg>
      <span className="font-mono text-xl font-bold tracking-tight">Arbolito</span>
    </div>
  );
}
