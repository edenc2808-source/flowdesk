'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">⚠️</div>
      <div className="text-center">
        <p className="font-semibold text-slate-800">Something went wrong</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
