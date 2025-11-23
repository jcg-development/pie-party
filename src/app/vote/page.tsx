'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, PrimaryButton, SecondaryButton } from '@/components/ui'
import { CATEGORIES, Category } from '@/lib/config'
import { ensureAnonAuth, auth } from '@/lib/firebase'
import { getSettings, listPies, saveVote, getAllVotes } from '@/lib/db'

export default function VotePage() {
  const [pies, setPies] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [myVotes, setMyVotes] = useState<Record<Category,string>>({ 'PieZaz':'', 'Taste':'', 'Presentation':''})
  const [settings, setSettings] = useState<{votingOpen:boolean}>({ votingOpen: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const user = await ensureAnonAuth()
      const [p, v, s] = await Promise.all([listPies(), getAllVotes(), getSettings()])
      setPies(p); setVotes(v); setSettings(s); setLoading(false)
      const mine = v.find((x:any)=> x.id === user.uid) || {}
      setMyVotes({
        'PieZaz': mine['PieZaz'] || '',
        'Taste': mine['Taste'] || '',
        'Presentation': mine['Presentation'] || ''
      })
    })()
  }, [])

  const tallies = useMemo(() => {
    const t: Record<Category, Record<string, number>> = {
      'PieZaz': {}, 'Taste': {}, 'Presentation': {}
    }
    votes.forEach((v:any) => {
      CATEGORIES.forEach(cat => {
        const pid = v[cat]
        if (pid) t[cat][pid] = (t[cat][pid] || 0) + 1
      })
    })
    return t
  }, [votes])

  async function cast(cat: Category, pieId: string) {
    if (!settings.votingOpen) { alert('Voting is currently closed'); return }
    const uid = auth.currentUser?.uid
    if (!uid) { alert('Not signed in'); return }
    await saveVote(uid, pieId, cat)
    setMyVotes(prev => ({ ...prev, [cat]: pieId }))
    // refresh tallies
    const v = await getAllVotes()
    setVotes(v)
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Vote for Your Favorites</h3>
        <span className="badge">{settings.votingOpen ? 'Voting Open' : 'Voting Closed'}</span>
      </div>

      {/* Category Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🏆 Voting Categories</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border-2 border-zinc-200 bg-white p-4">
            <div className="font-bold text-lg flex items-center gap-2 text-zinc-900">✨ PieZaz</div>
            <p className="text-sm text-zinc-600 mt-2">
              The essence—does it have that wow factor? Is it special, memorable, iconic?
            </p>
          </div>
          <div className="rounded-lg border-2 border-zinc-200 bg-white p-4">
            <div className="font-bold text-lg flex items-center gap-2 text-zinc-900">😋 Taste</div>
            <p className="text-sm text-zinc-600 mt-2">
              Balanced flavor & texture. Do you want another slice… or the whole thing?
            </p>
          </div>
          <div className="rounded-lg border-2 border-zinc-200 bg-white p-4">
            <div className="font-bold text-lg flex items-center gap-2 text-zinc-900">🎨 Presentation</div>
            <p className="text-sm text-zinc-600 mt-2">
              Originality, design, seasonal flair, and plate appeal. Camera-ready counts.
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? <p>Loading pies…</p> : (
        <div className="grid md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat, idx) => (
            <div key={cat} className="space-y-4">
              <div className="rounded-lg p-4 bg-zinc-900 border-2 border-zinc-800">
                <h4 className="font-bold text-lg text-white">{cat}</h4>
                <p className="text-xs text-zinc-400 mt-1">Cast your vote below</p>
              </div>
              
              <div className="space-y-3">
                {pies.map(p => (
                  <div 
                    key={p.id} 
                    className={`card overflow-hidden transition-all ${
                      myVotes[cat]===p.id ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'
                    }`}
                  >
                    <div className="p-3 border-b bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm">{p.name}</div>
                        {myVotes[cat]===p.id && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">✓ Your Vote</span>}
                      </div>
                      <div className="text-xs text-neutral-600">by {p.baker}</div>
                      <div className="text-xs text-neutral-500 mt-1">{tallies[cat][p.id]||0} votes</div>
                    </div>
                    <div className="p-3 space-y-2">
                      {p.photoURL ? (
                        <img src={p.photoURL} className="w-full h-32 object-cover rounded-lg" alt={p.name} />
                      ) : (
                        <div className="h-32 bg-neutral-100 rounded-lg grid place-items-center text-neutral-400 text-xs">No photo</div>
                      )}
                      <PrimaryButton 
                        onClick={()=>cast(cat, p.id)} 
                        className="w-full text-sm py-2"
                      >
                        {myVotes[cat]===p.id ? '✓ Voted' : 'Vote'}
                      </PrimaryButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-neutral-500 text-center">
        One vote per category. You can change your vote anytime while voting is open.
      </p>
    </section>
  )
}
