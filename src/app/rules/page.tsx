// src/app/rules/page.tsx
export default function RulesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          🥧 Judging & Rules
        </h2>
        <p className="text-neutral-600 mt-2">
          Bake bravely. Judge kindly
        </p>
      </div>

      {/* How Voting Works + Submission Guidelines */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">🗳️ How Voting Works</h3>
          <ul className="mt-3 space-y-2 text-neutral-700">
            <li>• Each attendee gets <strong>one active vote per category</strong>.</li>
            <li>• You can change your vote until the hosts close voting.</li>
            <li>• Live tallies are shown on the <span className="badge">Home</span> page.</li>
            <li>• Tie breaker: coin flip 🪙 or mini taste-off 🍽️.</li>
          </ul>
          <div className="mt-4 text-xs text-neutral-500">
            Tip: Have guests open <span className="badge">/vote</span> (QR on the Admin page).
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">📸 Submission Guidelines</h3>
          <ul className="mt-3 space-y-2 text-neutral-700">
            <li>• One pie per person/team.</li>
            <li>• Upload a clear photo and a short description (ingredients, story, allergens).</li>
            <li>• <strong>No store-bought pies</strong> 🙅‍♂️—all styles welcome: sweet, savory, hand-pies, tarts.</li>
          </ul>
          <div className="mt-4 rounded-2xl border bg-amber-50 p-3 text-sm">
            📷 Pro tip: Natural light = more votes.
          </div>
        </div>
      </section>

     

      {/* Judging Categories */}
      <section className="card p-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">🏆 Judging Categories</h3>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-4">
            <div className="font-semibold flex items-center gap-2">✨ PieZaz</div>
            <p className="text-sm text-neutral-700 mt-1">
              The essence—does it have that wow factor? Is it special, memorable, iconic?
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="font-semibold flex items-center gap-2">😋 Taste</div>
            <p className="text-sm text-neutral-700 mt-1">
              Balanced flavor & texture. Do you want another slice… or the whole thing?
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="font-semibold flex items-center gap-2">🎨 Best Presentation</div>
            <p className="text-sm text-neutral-700 mt-1">
              Originality, design, seasonal flair, and plate appeal. Camera-ready counts.
            </p>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          Want more categories? Edit them in <code>src/lib/config.ts</code> and they’ll appear in Vote & Tally automatically.
        </p>
      </section>

      {/* Footer note */}
      <p className="text-sm text-neutral-600">
        Customize anything here to match your party vibes. Add or remove sections freely.
      </p>
    </div>
  )
}
