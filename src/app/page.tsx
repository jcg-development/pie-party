'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, PrimaryButton, SecondaryButton } from '@/components/ui'
import Link from 'next/link'
import { getSettings } from '@/lib/db'

export default function HomePage() {
  const [votingOpen, setVotingOpen] = useState<boolean>(true)

  useEffect(() => { (async () => {
    try { const s = await getSettings(); setVotingOpen(!!s.votingOpen) } catch {}
  })() }, [])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="grid gap-6 md:grid-cols-[1.1fr_.9fr] items-stretch">
        <div className="card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🥧</span>
            <span className="badge">Pie Party 2025</span>
            <span className="pill"> December 6th</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Welcome to the Pie Party <span className="text-pp-crust" style={{color:'var(--pp-crust)'}}>&amp; Competition</span>!
          </h1>
          <p className="mt-4 text-neutral-700 max-w-prose">
            Bake your best, admire your peers, and cast a vote for your favorite. Upload a photo and description,
            browse entries, and see live results as votes come in.
          </p>

          <ul className="mt-5 space-y-2 text-neutral-800">
            <li className="flex items-start gap-2"><span className="pill">📸</span><span>Submit a pie with photo &amp; blurb</span></li>
            <li className="flex items-start gap-2"><span className="pill">🗳️</span><span>One vote per category (changeable while open)</span></li>
            <li className="flex items-start gap-2"><span className="pill">🏆</span><span>Past champions in the Winners Gallery</span></li>
            <li className="flex items-start gap-2"><span className="pill">📏</span><span>Clear judging rules to keep things fair</span></li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/submit" className="btn btn-primary">Submit a Pie</Link>
            <Link href="/vote" className="btn btn-secondary">{votingOpen ? 'Go Vote' : 'See Tally'}</Link>
          </div>
        </div>

        {/* Crown / Tip */}
        <div className="card p-6 bg-white/85">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              👑 This Year’s Crown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-neutral-700">
              Encourage friends to vote and let the best pie win! 
            </p>
            <div className="rounded-2xl border p-4 bg-amber-50/80">
              <div className="text-sm"><strong>Tip:</strong> Photos help votes! Natural light makes your pie irresistible.</div>
            </div>
            <div className="flex gap-2 pt-1">
              <Link href="/winners" className="btn btn-secondary">Winners Gallery</Link>
              <Link href="/rsvp" className="btn btn-secondary">RSVP</Link>
            </div>
          </CardContent>
        </div>
      </section>

      {/* Event Timeline */}
      <section className="card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🕐 Event Timeline 
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 text-right">
              <div className="font-bold text-lg">5:00 PM</div>
            </div>
            <div className="flex-1 pb-8 border-l-2 border-amber-200 pl-6 relative">
              <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white"></div>
              <div className="font-semibold text-neutral-900">Doors & Pie Check-In</div>
              <p className="text-sm text-neutral-600 mt-1">Arrive with your pie and get checked in</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 text-right">
              <div className="font-bold text-lg">6:15 PM</div>
            </div>
            <div className="flex-1 pb-8 border-l-2 border-purple-200 pl-6 relative">
              <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-purple-400 border-2 border-white"></div>
              <div className="font-semibold text-neutral-900">Tasting & Voting Opens</div>
              <p className="text-sm text-neutral-600 mt-1">Sample the pies and cast your votes</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 text-right">
              <div className="font-bold text-lg">7:30 PM</div>
            </div>
            <div className="flex-1 pl-6 relative">
              <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-red-400 border-2 border-white"></div>
              <div className="font-semibold text-neutral-900">Voting Closes</div>
              <p className="text-sm text-neutral-600 mt-1">Final votes tallied and winner announced!</p>
            </div>
          </div>
        </CardContent>
      </section>

      {/* Scoring Info */}
      <section className="card">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🏆 How Winners Are Chosen
            <span className="badge">{votingOpen ? 'Voting Open' : 'Voting Closed'}</span>
          </CardTitle>
          <Link href="/vote" className="btn btn-secondary">{votingOpen ? 'Vote Now' : 'View Results'}</Link>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="text-neutral-700">
            Winners are determined by <strong>combined totals</strong> across all three voting categories.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border-2 border-amber-200 p-4 bg-amber-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🥧</span>
                <div className="font-bold text-amber-900">Sweet Pie Winner</div>
              </div>
              <p className="text-sm text-amber-700">
                The sweet pie with the most combined votes across PieZaz, Taste, and Presentation wins!
              </p>
            </div>
            <div className="rounded-xl border-2 border-purple-200 p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🧀</span>
                <div className="font-bold text-purple-900">Savory Pie Winner</div>
              </div>
              <p className="text-sm text-purple-700">
                The savory pie with the most combined votes across PieZaz, Taste, and Presentation wins!
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="text-sm text-blue-900">
              <strong>Example:</strong> If a pie gets 4 PieZaz votes, 5 Taste votes, and 2 Presentation votes, 
              their total score is <strong>11 votes</strong>. The pie with the highest combined total in each category (sweet/savory) wins!
            </div>
          </div>
        </CardContent>
      </section>

      <p className="text-center text-sm text-neutral-500">Please bake responsibly.</p>
    </div>
  )
}
