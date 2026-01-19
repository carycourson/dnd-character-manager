export type ViewName = 'list' | 'create' | 'sheet';

interface NavigationProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  hasCharacters?: boolean;
}

export function Navigation({ currentView, onNavigate, hasCharacters = false }: NavigationProps) {
  const navItems: { view: ViewName; label: string; disabled?: boolean }[] = [
    { view: 'list', label: 'Characters' },
    { view: 'create', label: 'Create New' },
    { view: 'sheet', label: 'Character Sheet', disabled: !hasCharacters },
  ];

  return (
    <nav className="bg-parchment-200 border-b border-parchment-400">
      <div className="max-w-6xl mx-auto px-4">
        <ul className="flex gap-1">
          {navItems.map(({ view, label, disabled }) => (
            <li key={view}>
              <button
                onClick={() => !disabled && onNavigate(view)}
                disabled={disabled}
                className={`
                  px-4 py-2 font-display text-sm transition-colors
                  border-b-2 -mb-[2px]
                  ${currentView === view
                    ? 'border-gold-500 text-ink-900 bg-parchment-100'
                    : disabled
                      ? 'border-transparent text-ink-400 cursor-not-allowed'
                      : 'border-transparent text-ink-600 hover:text-ink-800 hover:bg-parchment-100'
                  }
                `}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
