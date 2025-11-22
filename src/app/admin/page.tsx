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
  listRSVPs,
  deleteRSVP,
  listWinners,
  deleteWinner,
  type RSVP,
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
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [settings, setSettingsState] = useState<{ votingOpen: boolean; submissionsOpen: boolean }>({ votingOpen: true, submissionsOpen: false })

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
    const [p, v, r, w, s] = await Promise.all([listPies(), getAllVotes(), listRSVPs(), listWinners(), getSettings()])
    setPies(p); setVotes(v); setRsvps(r); setWinners(w); setSettingsState(s)
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

  function exportRSVPsCSV() {
    const rows = rsvps.map((r) => ({
      name: r.name,
      email: r.email || '',
      guests: r.guests,
      pieType: r.pieType,
      notes: r.notes || '',
      createdAt: r.createdAt?.toDate().toISOString() || '',
    }))
    downloadCSV(`rsvps-${Date.now()}.csv`, rows)
  }

  async function toggleVoting() {
    const next = !settings.votingOpen
    await setSettings({ votingOpen: next })
    setSettingsState({ ...settings, votingOpen: next })
  }

  async function toggleSubmissions() {
    const next = !settings.submissionsOpen
    await setSettings({ submissionsOpen: next })
    setSettingsState({ ...settings, submissionsOpen: next })
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
          <span className="badge">{settings.submissionsOpen ? 'Submissions Open' : 'Submissions Closed'}</span>
          <PrimaryButton onClick={toggleSubmissions}>{settings.submissionsOpen ? 'Close Submissions' : 'Open Submissions'}</PrimaryButton>
          <span className="badge">{settings.votingOpen ? 'Voting Open' : 'Voting Closed'}</span>
          <PrimaryButton onClick={toggleVoting}>{settings.votingOpen ? 'Close Voting' : 'Open Voting'}</PrimaryButton>
          <SecondaryButton onClick={load}>Refresh Data</SecondaryButton>
          <SecondaryButton onClick={exportPiesCSV}>Export Pies CSV</SecondaryButton>
          <SecondaryButton onClick={exportVotesCSV}>Export Votes CSV</SecondaryButton>
          <SecondaryButton onClick={exportRSVPsCSV}>Export RSVPs CSV</SecondaryButton>
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
            await load()
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

      {/* RSVPs List */}
      <Card>
        <CardHeader>
          <CardTitle>RSVPs ({rsvps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rsvps.length === 0 ? (
            <p className="text-sm text-neutral-600">No RSVPs yet.</p>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{rsvps.reduce((sum, r) => sum + r.guests, 0)}</div>
                  <div className="text-xs text-blue-700">Total Guests</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-2xl font-bold text-amber-900">{rsvps.filter(r => r.pieType === 'sweet').length}</div>
                  <div className="text-xs text-amber-700">Sweet Pies</div>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">{rsvps.filter(r => r.pieType === 'savory').length}</div>
                  <div className="text-xs text-purple-700">Savory Pies</div>
                </div>
              </div>

              {/* RSVP Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Guests</th>
                      <th className="py-2 pr-3">Pie Type</th>
                      <th className="py-2 pr-3">Notes</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.map((r: RSVP) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 pr-3 font-medium">{r.name}</td>
                        <td className="py-2 pr-3 text-neutral-600">{r.email || '—'}</td>
                        <td className="py-2 pr-3">{r.guests}</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.pieType === 'sweet' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {r.pieType === 'sweet' ? '🥧 Sweet' : '🧀 Savory'}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-neutral-600 text-xs max-w-xs truncate">{r.notes || '—'}</td>
                        <td className="py-2 pr-3">
                          <button
                            className="btn btn-secondary !border-red-300 !text-red-700 hover:bg-red-50 text-xs"
                            onClick={async () => {
                              const yes = confirm(`Delete RSVP for "${r.name}"?`)
                              if (!yes) return
                              try {
                                await deleteRSVP(r.id)
                                await load()
                                alert('RSVP deleted.')
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Winners */}
      <Card>
        <CardHeader>
          <CardTitle>Past Winners ({winners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length === 0 ? (
            <p className="text-sm text-neutral-600">No past winners yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Year</th>
                    <th className="py-2 pr-3">Pie</th>
                    <th className="py-2 pr-3">Baker</th>
                    <th className="py-2 pr-3">Photo</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((w: any) => (
                    <tr key={w.id} className="border-b">
                      <td className="py-2 pr-3 font-medium">{w.year}</td>
                      <td className="py-2 pr-3">{w.title}</td>
                      <td className="py-2 pr-3">{w.baker}</td>
                      <td className="py-2 pr-3">
                        {w.photoURL ? (
                          <a className="underline" href={w.photoURL} target="_blank">view</a>
                        ) : (
                          <span className="text-red-600">missing</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          className="btn btn-secondary !border-red-300 !text-red-700 hover:bg-red-50 text-xs"
                          onClick={async () => {
                            const yes = confirm(`Delete winner "${w.title}" from ${w.year}?`)
                            if (!yes) return
                            try {
                              await deleteWinner(w.id)
                              await load()
                              alert('Winner deleted.')
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
