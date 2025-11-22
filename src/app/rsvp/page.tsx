'use client'
import React, { useEffect, useState } from 'react'
import { ensureAnonAuth } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getPieTypeCounts } from '@/lib/db'
import { PIE_TYPE_CAPS } from '@/lib/config'

function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(v => { clearTimeout(t); resolve(v) })
     .catch(e => { clearTimeout(t); reject(e) })
  })
}

export default function RSVPPage() {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [guests, setGuests] = useState(1)
  const [pieType, setPieType] = useState<'sweet' | 'savory'>('sweet')
  const [notes, setNotes] = useState('')
  
  const [pieCounts, setPieCounts] = useState({ sweet: 0, savory: 0 })
  const [loadingCounts, setLoadingCounts] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const u = await ensureAnonAuth()
        console.log('[RSVP] signed in as', u.uid)
        setReady(true)
        
        // Load current pie counts
        const counts = await getPieTypeCounts()
        setPieCounts(counts)
        setLoadingCounts(false)
      } catch (e) {
        console.error('[RSVP] auth failed:', e)
        alert('Could not sign you in. Check Anonymous Auth in Firebase is enabled.')
        setLoadingCounts(false)
      }
    })()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready) { alert('Still connecting… try again.'); return }
    if (!name.trim()) { alert('Please enter your name.'); return }

    // Check pie type cap
    const currentCount = pieCounts[pieType]
    const cap = PIE_TYPE_CAPS[pieType]
    
    if (currentCount >= cap) {
      alert(
        `Sorry! We've reached the limit of ${cap} ${pieType} pies.\n\n` +
        `Please contact the host to request an exception, or choose the other pie type.`
      )
      return
    }

    setLoading(true)
    console.log('[RSVP] attempting write…')
    try {
      const ref = await withTimeout(addDoc(collection(db, 'rsvps'), {
        name: name.trim(),
        email: email.trim() || null,
        guests: Number(guests) || 1,
        pieType,
        notes: notes.trim() || null,
        createdAt: serverTimestamp(),
      }))
      console.log('[RSVP] saved doc id:', ref.id)
      setDone(true)
    } catch (err: any) {
      console.error('[RSVP] write error:', err)
      let msg = 'Could not save RSVP.'
      if (err?.code === 'permission-denied') msg = 'Permission denied. Check Firestore rules.'
      else if (err?.message === 'timeout') msg = 'Network stalled. Try disabling adblock/VPN and refresh.'
      else if (err?.message?.includes('offline') || err?.code === 'failed-precondition') msg = 'Client appears offline. See notes below.'
      alert(`${msg}\n\nDetails: ${err?.code || err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="card p-6 space-y-3">
        <h3 className="text-xl font-semibold">Thanks! You&apos;re on the list.</h3>
        <p className="text-sm text-neutral-600">We&apos;ll see you at the party 🎉</p>
        <p className="text-sm text-neutral-600">
          You&apos;re bringing a <span className="font-semibold">{pieType}</span> pie!
        </p>
      </div>
    )
  }

  const sweetRemaining = PIE_TYPE_CAPS.sweet - pieCounts.sweet
  const savoryRemaining = PIE_TYPE_CAPS.savory - pieCounts.savory

  return (
    <div className="space-y-4">
      {/* Pie Type Availability */}
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Pie Availability</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="font-medium">🥧 Sweet Pies</span>
            <span className={sweetRemaining > 5 ? 'text-green-700' : sweetRemaining > 0 ? 'text-amber-700' : 'text-red-700'}>
              {sweetRemaining} / {PIE_TYPE_CAPS.sweet} left
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
            <span className="font-medium">🧀 Savory Pies</span>
            <span className={savoryRemaining > 5 ? 'text-green-700' : savoryRemaining > 0 ? 'text-amber-700' : 'text-red-700'}>
              {savoryRemaining} / {PIE_TYPE_CAPS.savory} left
            </span>
          </div>
        </div>
      </div>

      {/* RSVP Form */}
      <form onSubmit={submit} className="card p-6 space-y-4">
        <h2 className="text-xl font-semibold">RSVP for the Party</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Your Name *</label>
              <input 
                className="input" 
                placeholder="Enter your name" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email (optional)</label>
              <input 
                className="input" 
                type="email"
                placeholder="your@email.com" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Number of Guests</label>
              <input 
                className="input" 
                type="number" 
                min={1} 
                max={10} 
                value={guests} 
                onChange={e=>setGuests(parseInt(e.target.value||'1'))} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pie Type You&apos;ll Bring *</label>
              <div className="space-y-2">
                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition ${
                  pieType === 'sweet' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${sweetRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="radio" 
                    name="pieType" 
                    value="sweet" 
                    checked={pieType === 'sweet'}
                    onChange={e => setPieType('sweet')}
                    disabled={sweetRemaining <= 0}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">🥧 Sweet Pie</div>
                    <div className="text-xs text-neutral-600">
                      {sweetRemaining > 0 ? `${sweetRemaining} spots left` : 'FULL - Contact host for exception'}
                    </div>
                  </div>
                </label>
                
                <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition ${
                  pieType === 'savory' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${savoryRemaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input 
                    type="radio" 
                    name="pieType" 
                    value="savory" 
                    checked={pieType === 'savory'}
                    onChange={e => setPieType('savory')}
                    disabled={savoryRemaining <= 0}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">🧀 Savory Pie</div>
                    <div className="text-xs text-neutral-600">
                      {savoryRemaining > 0 ? `${savoryRemaining} spots left` : 'FULL - Contact host for exception'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Notes or Dietary Restrictions</label>
              <textarea 
                className="textarea" 
                placeholder="Any questions or dietary notes?" 
                rows={10} 
                value={notes} 
                onChange={e=>setNotes(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <button className="btn btn-primary w-full" disabled={!ready || loading || loadingCounts}>
          {loading ? 'Saving RSVP…' : (!ready ? 'Connecting…' : loadingCounts ? 'Loading…' : 'Submit RSVP')}
        </button>
        
        {!ready && <p className="text-xs text-amber-700">Signing you in anonymously…</p>}
        
        <p className="text-xs text-neutral-500">
          * Required fields. If a pie type is full, please contact the host to request an exception.
        </p>
      </form>
    </div>
  )
}
