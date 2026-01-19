function App() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          D&D 5E Character Manager
        </h1>
        <p className="text-lg text-ink-600 mb-8">
          Foundation ready. Tailwind is working!
        </p>
        
        {/* Test our custom theme colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-parchment-200 rounded-lg border border-parchment-400">
            <h2 className="font-display text-xl mb-2">Parchment Theme</h2>
            <p className="text-ink-700">This box uses our custom parchment colors.</p>
          </div>
          
          <div className="p-4 bg-ink-800 rounded-lg text-parchment-100">
            <h2 className="font-display text-xl mb-2">Ink Theme</h2>
            <p className="text-parchment-300">Dark mode styling option.</p>
          </div>
          
          <div className="p-4 bg-gold-100 rounded-lg border border-gold-400">
            <h2 className="font-display text-xl text-gold-800 mb-2">Gold Accent</h2>
            <p className="text-gold-700">For highlights and special elements.</p>
          </div>
          
          <div className="p-4 bg-blood-100 rounded-lg border border-blood-300">
            <h2 className="font-display text-xl text-blood-700 mb-2">Blood Red</h2>
            <p className="text-blood-600">For HP, damage, and warnings.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
