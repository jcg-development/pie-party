'use client'
import React, { useEffect, useState } from 'react'
import { ensureAnonAuth } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

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
  const [notes, setNotes] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const u = await ensureAnonAuth()
        console.log('[RSVP] signed in as', u.uid)
        setReady(true)
      } catch (e) {
        console.error('[RSVP] auth failed:', e)
        alert('Could not sign you in. Check Anonymous Auth in Firebase is enabled.')
      }
    })()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ready) { alert('Still connecting… try again.'); return }
    if (!name.trim()) { alert('Please enter your name.'); return }

    setLoading(true)
    console.log('[RSVP] attempting write…')
    try {
      const ref = await withTimeout(addDoc(collection(db, 'rsvps'), {
        name: name.trim(),
        email: email.trim() || null,
        guests: Number(guests) || 1,
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
      <div className="card p-6">
        <h3 className="text-xl font-semibold">Thanks! You&apos;re on the list.</h3>
        <p className="text-sm text-neutral-600 mt-2">We&apos;ll see you at the party 🎉</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid md:grid-cols-2 gap-4 card p-6">
      <div className="space-y-3">
        <input className="input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="input" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="number" min={1} max={10} value={guests} onChange={e=>setGuests(parseInt(e.target.value||'1'))} />
      </div>
      <div className="space-y-3">
        <textarea className="textarea" placeholder="Dietary notes or questions" rows={6} value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="btn btn-primary w-full" disabled={!ready || loading}>
          {loading ? 'Saving RSVP…' : (!ready ? 'Connecting…' : 'RSVP')}
        </button>
        {!ready && <p className="text-xs text-amber-700">Signing you in anonymously…</p>}
        <p className="text-xs text-neutral-500">
          If this hangs, open DevTools → Console to see the exact error. Some networks block WebSockets—our config forces HTTP long-polling.
        </p>
      </div>
    </form>
  )
}

