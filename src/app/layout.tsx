import './globals.css'
import React from 'react'

import { Quicksand, Inter } from 'next/font/google'
const display = Quicksand({ subsets:['latin'], weight:['400','600','700'] })
const text = Inter({ subsets:['latin'] })


export const metadata = {
  title: 'Pie Party',
  description: 'Bake • Share • Vote • Crown the Champion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-amber-50 to-white text-neutral-900">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b">
          <div className="container-narrow py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🥧</span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Pie Party {new Date().getFullYear()}</h1>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <a className="navlink" href="/">Home</a>
              <a className="navlink" href="/rsvp">RSVP</a>
              <a className="navlink" href="/rules">Rules</a>
              <a className="navlink" href="/submit">Submit</a>
              <a className="navlink" href="/vote">Vote</a>
              <a className="navlink" href="/winners">Winners</a>
              <a className="navlink" href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        <main className="container-narrow py-6">{children}</main>
        <footer className="py-10 text-center text-sm text-neutral-500">
          Please bake responsibly.
        </footer>
      </body>
    </html>
  )
}
