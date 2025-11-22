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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Vote for Your Favorites</h3>
        <span className="badge">{settings.votingOpen ? 'Voting Open' : 'Voting Closed'}</span>
      </div>
      {loading ? <p>Loading pies…</p> : (
        <div className="space-y-6">
          {CATEGORIES.map(cat => (
            <Card key={cat}>
              <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pies.map(p => (
                    <div key={p.id} className={`card overflow-hidden ${myVotes[cat]===p.id ? 'ring-2 ring-emerald-500' : ''}`}>
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{p.name}</div>
                          <span className="badge">{tallies[cat][p.id]||0} votes</span>
                        </div>
                        <div className="text-sm text-neutral-600">by {p.baker}</div>
                      </div>
                      <div className="p-4 space-y-3">
                        {p.photoURL ? <img src={p.photoURL} className="w-full h-48 object-cover rounded-xl" /> : <div className="h-48 bg-neutral-100 rounded-xl" />}
                        <p className="text-sm text-neutral-700 line-clamp-3">{p.description}</p>
                        <PrimaryButton onClick={()=>cast(cat, p.id)} className="w-full">{myVotes[cat]===p.id?'Your Vote':'Vote'}</PrimaryButton>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-neutral-500">One active vote per attendee per category (tied to your device). You can change your vote during the event.</p>
    </section>
  )
}
