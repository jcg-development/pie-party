'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, PrimaryButton, SecondaryButton } from '@/components/ui'
import { CATEGORIES, Category } from '@/lib/config'
import { ensureAnonAuth, auth } from '@/lib/firebase'
import { getSettings, listPies, saveVote, getAllVotes } from '@/lib/db'

export default function VotePage() {
  const [pies, setPies] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [myVotes, setMyVotes] = useState<Record<string,string>>({
    'PieZaz-sweet':'', 'Taste-sweet':'', 'Presentation-sweet':'',
    'PieZaz-savory':'', 'Taste-savory':'', 'Presentation-savory':''
  })
  const [settings, setSettings] = useState<{votingOpen:boolean}>({ votingOpen: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const user = await ensureAnonAuth()
      const [p, v, s] = await Promise.all([listPies(), getAllVotes(), getSettings()])
      setPies(p); setVotes(v); setSettings(s); setLoading(false)
      const mine = v.find((x:any)=> x.id === user.uid) || {}
      setMyVotes({
        'PieZaz-sweet': mine['PieZaz-sweet'] || '',
        'Taste-sweet': mine['Taste-sweet'] || '',
        'Presentation-sweet': mine['Presentation-sweet'] || '',
        'PieZaz-savory': mine['PieZaz-savory'] || '',
        'Taste-savory': mine['Taste-savory'] || '',
        'Presentation-savory': mine['Presentation-savory'] || ''
      })
    })()
  }, [])

  const sweetPies = useMemo(() => pies.filter(p => p.type === 'sweet'), [pies])
  const savoryPies = useMemo(() => pies.filter(p => p.type === 'savory'), [pies])

  const tallies = useMemo(() => {
    const t: Record<string, Record<string, number>> = {
      'PieZaz-sweet': {}, 'Taste-sweet': {}, 'Presentation-sweet': {},
      'PieZaz-savory': {}, 'Taste-savory': {}, 'Presentation-savory': {}
    }
    votes.forEach((v:any) => {
      CATEGORIES.forEach(cat => {
        const sweetKey = `${cat}-sweet`
        const savoryKey = `${cat}-savory`
        if (v[sweetKey]) t[sweetKey][v[sweetKey]] = (t[sweetKey][v[sweetKey]] || 0) + 1
        if (v[savoryKey]) t[savoryKey][v[savoryKey]] = (t[savoryKey][v[savoryKey]] || 0) + 1
      })
    })
    return t
  }, [votes])

  async function cast(cat: Category, pieType: 'sweet' | 'savory', pieId: string) {
    if (!settings.votingOpen) { alert('Voting is currently closed'); return }
    const uid = auth.currentUser?.uid
    if (!uid) { alert('Not signed in'); return }
    const voteKey = `${cat}-${pieType}`
    await saveVote(uid, pieId, voteKey as any)
    setMyVotes(prev => ({ ...prev, [voteKey]: pieId }))
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
        <div className="space-y-8">
          {/* Sweet Pies Section */}
          <div>
            <div className="mb-6 p-4 rounded-lg bg-amber-50 border-2 border-amber-200">
              <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                🥧 Sweet Pies
              </h3>
              <p className="text-sm text-amber-700 mt-1">Vote for your favorites in each category</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {CATEGORIES.map((cat, idx) => (
                <div key={`sweet-${cat}`} className="space-y-4">
                  <div className="rounded-lg p-4 bg-amber-100 border-2 border-amber-300">
                    <h4 className="font-bold text-lg text-amber-900">{cat}</h4>
                    <p className="text-xs text-amber-700 mt-1">Sweet pies only</p>
                  </div>
                  
                  <div className="space-y-3">
                    {sweetPies.map(p => {
                      const voteKey = `${cat}-sweet`
                      return (
                        <div 
                          key={p.id} 
                          className={`card overflow-hidden transition-all ${
                            myVotes[voteKey]===p.id ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="p-3 border-b bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold text-sm">{p.name}</div>
                              {myVotes[voteKey]===p.id && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">✓ Your Vote</span>}
                            </div>
                            <div className="text-xs text-neutral-600">by {p.baker}</div>
                            <div className="text-xs text-neutral-500 mt-1">{tallies[voteKey][p.id]||0} votes</div>
                          </div>
                          <div className="p-3 space-y-2">
                            {p.photoURL ? (
                              <img src={p.photoURL} className="w-full h-32 object-cover rounded-lg" alt={p.name} />
                            ) : (
                              <div className="h-32 bg-neutral-100 rounded-lg grid place-items-center text-neutral-400 text-xs">No photo</div>
                            )}
                            <PrimaryButton 
                              onClick={()=>cast(cat, 'sweet', p.id)} 
                              className="w-full text-sm py-2"
                            >
                              {myVotes[voteKey]===p.id ? '✓ Voted' : 'Vote'}
                            </PrimaryButton>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Savory Pies Section */}
          <div>
            <div className="mb-6 p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                🧀 Savory Pies
              </h3>
              <p className="text-sm text-purple-700 mt-1">Vote for your favorites in each category</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {CATEGORIES.map((cat, idx) => (
                <div key={`savory-${cat}`} className="space-y-4">
                  <div className="rounded-lg p-4 bg-purple-100 border-2 border-purple-300">
                    <h4 className="font-bold text-lg text-purple-900">{cat}</h4>
                    <p className="text-xs text-purple-700 mt-1">Savory pies only</p>
                  </div>
                  
                  <div className="space-y-3">
                    {savoryPies.map(p => {
                      const voteKey = `${cat}-savory`
                      return (
                        <div 
                          key={p.id} 
                          className={`card overflow-hidden transition-all ${
                            myVotes[voteKey]===p.id ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="p-3 border-b bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold text-sm">{p.name}</div>
                              {myVotes[voteKey]===p.id && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">✓ Your Vote</span>}
                            </div>
                            <div className="text-xs text-neutral-600">by {p.baker}</div>
                            <div className="text-xs text-neutral-500 mt-1">{tallies[voteKey][p.id]||0} votes</div>
                          </div>
                          <div className="p-3 space-y-2">
                            {p.photoURL ? (
                              <img src={p.photoURL} className="w-full h-32 object-cover rounded-lg" alt={p.name} />
                            ) : (
                              <div className="h-32 bg-neutral-100 rounded-lg grid place-items-center text-neutral-400 text-xs">No photo</div>
                            )}
                            <PrimaryButton 
                              onClick={()=>cast(cat, 'savory', p.id)} 
                              className="w-full text-sm py-2"
                            >
                              {myVotes[voteKey]===p.id ? '✓ Voted' : 'Vote'}
                            </PrimaryButton>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-neutral-500 text-center">
        You get 6 total votes: 3 for sweet pies (one per category) and 3 for savory pies (one per category). You can change your votes anytime while voting is open.
      </p>
    </section>
  )
}
