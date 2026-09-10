'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { HiCheck, HiClipboard } from 'react-icons/hi'

interface CopyNameProps {
  firstName: string
  lastName: string
  className?: string
  showIcon?: boolean
}

// One click copies the full "First Last" name to the clipboard — so John can
// paste it straight into LinkedIn search without drag-selecting text.
export default function CopyName({ firstName, lastName, className, showIcon = false }: CopyNameProps) {
  const [copied, setCopied] = useState(false)
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim()

  const handleCopy = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (!fullName) return
    navigator.clipboard.writeText(fullName)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy "${fullName}"`}
      className={`inline-flex items-center gap-1.5 min-w-0 text-left ${className ?? ''}`}
    >
      <span className="truncate">{fullName}</span>
      {copied ? (
        <HiCheck className="text-terracotta text-sm flex-shrink-0" />
      ) : (
        <HiClipboard
          className={`text-stone-light text-sm flex-shrink-0 transition-opacity ${
            showIcon ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
      )}
    </button>
  )
}
