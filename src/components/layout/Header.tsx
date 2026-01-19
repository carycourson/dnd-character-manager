interface HeaderProps {
  title?: string;
}

export function Header({ title = "D&D 5E Character Manager" }: HeaderProps) {
  return (
    <header className="bg-ink-800 text-parchment-100 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Dragon emoji as placeholder - can replace with SVG icon later */}
          <span className="text-2xl">🐉</span>
          <h1 className="text-xl font-display font-bold text-gold-400">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
