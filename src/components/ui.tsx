import React from 'react'

/* -------------------- Card Components -------------------- */
export function Card({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHeader({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>
}

export function CardTitle({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>
}

export function CardContent({
  children,
  className = '',
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={`p-4 ${className}`}>{children}</div>
}

/* -------------------- Buttons -------------------- */
export function Button({
  children,
  onClick,
  className = '',
  disabled,
  type,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export const PrimaryButton = (props: any) => (
  <Button {...props} className={`btn-primary ${props.className || ''}`} />
)

export const SecondaryButton = (props: any) => (
  <Button {...props} className={`btn-secondary ${props.className || ''}`} />
)


