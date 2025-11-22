'use client'

import React, { useEffect, useState } from 'react'
import { auth, db, ensureAnonAuth } from '@/lib/firebase'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle, PrimaryButton, SecondaryButton } from '@/components/ui'
import { CATEGORIES } from '@/lib/config'
import {
  getAllVotes,
  listPies,
  markWinner,
  setSettings,
  getSettings,
  deletePieDoc,
  cleanupVotesForPie,
} from '@/lib/db'
import { deletePieImage } from '@/lib/storage'
import { downloadCSV } from '@/lib/csv'
import QRCode from 'qrcode.react'

const ADMIN_PASSPHRASE = process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default function AdminPage() {
  const [authd, setAuthd] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [pies, setPies] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [settings, setSettingsState] = useState<{ votingOpen: boolean }>({ votingOpen: true })

  // Admin banner
  const [adminStatus, setAdminStatus] = useState<'unknown' | 'yes' | 'no'>('unknown')
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => { (async () => { await ensureAnonAuth() })() }, [])

  async function checkAdmin() {
    const currentUid = auth.currentUser?.uid || null
    setUid(currentUid)
    if (!currentUid) { setAdminStatus('no'); return }
    try {
      const snap = await getDoc(doc(db, 'admins', currentUid))
      setAdminStatus(snap.exists() ? 'yes' : 'no')
    } catch (e) {
      // If rules block read somehow, don't crash UI
      setAdminStatus('no')
    }
  }

  async function selfEnrollAdmin() {
    await ensureAnonAuth()
    const currentUid = auth.currentUser?.uid
    if (!currentUid) throw new Error('No UID (auth not ready)')
    // Create or merge your own admin doc; rules above allow this
    await setDoc(doc(db, 'admins', currentUid), {
      role: 'admin',
      addedAt: serverTimestamp(),
    }, { merge: true })
  }

  async function selfUnenrollAdmin() {
    const currentUid = auth.currentUser?.uid
    if (!currentUid) return
    await deleteDoc(doc(db, 'admins', currentUid))
  }

  async function load() {
    const [p, v, s] = await Promise.all([listPies(), getAllVotes(), getSettings()])
    setPies(p); setVotes(v); setSettingsState(s)
    await checkAdmin()
  }

  function exportVotesCSV() {
    const rows: any[] = []
    votes.forEach((v) => { CATEGORIES.forEach((cat) => rows.push({ userId: v.id, category: cat, pieId: v[cat] || '' })) })
    downloadCSV(`votes-${Date.now()}.csv`, rows)
  }

  function exportPiesCSV() {
    const rows = pies.map((p) => ({
      id: p.id, name: p.name, baker: p.baker, type: p.type || 'unspecified',
      description: p.description, photoURL: p.photoURL, photoPath: p.photoPath || '',
    }))
    downloadCSV(`pies-${Date.now()}.csv`, rows)
  }

  async function toggleVoting() {
    const next = !settings.votingOpen
    await setSettings({ votingOpen: next })
    setSettingsState({ votingOpen: next })
  }

  if (!authd) {
    return (
      <div className="card p-6 space-y-3">
        <div className="font-semibold">Admin Access</div>
        <input className="input" placeholder="Passphrase" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
        <PrimaryButton
          onClick={async () => {
            if ((phrase || '').trim() !== ADMIN_PASSPHRASE) { alert('Incorrect passphrase'); return }
            try {
              await selfEnrollAdmin()     // ⬅️ write admins/{uid}
              setAuthd(true)
              await load()                // pulls data + sets admin banner
            } catch (e: any) {
              console.error('Unlock/self-enroll failed:', e)
              alert(`Could not enroll admin. ${e?.code || e?.message || e}`)
            }
          }}
        >
          Unlock
        </PrimaryButton>
        <p className="text-xs text-neutral-500">
          Set <code>NEXT_PUBLIC_ADMIN_PASSPHRASE</code> in <code>.env.local</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin banner */}
      <p className="text-xs text-neutral-500">
        UID: {uid || '—'} • Admin: {adminStatus}
        {adminStatus === 'yes' && (
          <button className="ml-2 underline" onClick={async () => { await selfUnenrollAdmin(); await checkAdmin() }}>
            (remove on this device)
          </button>
        )}
      </p>

      {/* Controls */}
      <Card>
        <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          <span className="badge">{settings.votingOpen ? 'Voting Open' : 'Voting Closed'}</span>
          <PrimaryButton onClick={toggleVoting}>{settings.votingOpen ? 'Close Voting' : 'Open Voting'}</PrimaryButton>
          <SecondaryButton onClick={load}>Refresh Data</SecondaryButton>
          <SecondaryButton onClick={exportPiesCSV}>Export Pies CSV</SecondaryButton>
          <SecondaryButton onClick={exportVotesCSV}>Export Votes CSV</SecondaryButton>
        </CardContent>
      </Card>

      {/* Mark Winner */}
      <Card>
        <CardHeader><CardTitle>Mark Winner</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <input className="input" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
          <select className="select" id="winnerPie">
            <option value="">Select Pie…</option>
            {pies.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.baker}</option>)}
          </select>
          <PrimaryButton onClick={async () => {
            const sel = (document.getElementById('winnerPie') as HTMLSelectElement).value
            const pie = pies.find((p) => p.id === sel)
            if (!pie) { alert('Choose a pie'); return }
            await markWinner(year, pie)
            alert('Winner saved')
          }}>
            Save Winner
          </PrimaryButton>
          <div className="text-xs text-neutral-500">Adds an entry to the public gallery.</div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader><CardTitle>QR Code — Share Voting Link</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="card p-3"><QRCode value={`${siteUrl}/vote`} size={160} /></div>
          <div>
            <div className="text-sm text-neutral-700 mb-1">Guests can scan this to go straight to the Vote page.</div>
            <code className="text-xs bg-neutral-100 px-2 py-1 rounded">{siteUrl}/vote</code>
          </div>
        </CardContent>
      </Card>

      {/* Manage Pies (Delete) */}
      <Card>
        <CardHeader><CardTitle>Manage Pies</CardTitle></CardHeader>
        <CardContent>
          {pies.length === 0 ? (
            <p className="text-sm text-neutral-600">No pies submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Pie</th><th className="py-2 pr-3">Baker</th><th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Photo</th><th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pies.map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2 pr-3">{p.name}</td>
                      <td className="py-2 pr-3">{p.baker}</td>
                      <td className="py-2 pr-3">{p.type || 'unspecified'}</td>
                      <td className="py-2 pr-3">{p.photoURL ? <a className="underline" href={p.photoURL} target="_blank">view</a> : '—'}</td>
                      <td className="py-2 pr-3">
                        <button
                          className="btn btn-secondary !border-red-300 !text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            const yes = confirm(`Delete "${p.name}" by ${p.baker}"? This removes the photo and clears votes.`)
                            if (!yes) return
                            try {
                              await deletePieDoc(p.id) // admin-only by rules
                              try { await deletePieImage({ path: p.photoPath, url: p.photoURL }) }
                              catch (se: any) {
                                if (se?.code === 'storage/object-not-found') console.warn('Storage file already gone; continuing.')
                                else console.warn('Storage delete warning:', se?.code || se?.message || se)
                              }
                              await cleanupVotesForPie(p.id, CATEGORIES)
                              await load()
                              alert('Pie deleted.')
                            } catch (e: any) {
                              console.error('Delete failed', e)
                              alert(`Delete failed.\n\nDetails: ${e?.code || e?.message || e}`)
                            }
                          }}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



