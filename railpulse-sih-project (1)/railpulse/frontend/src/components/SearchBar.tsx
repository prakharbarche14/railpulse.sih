import { Search } from 'lucide-react'
import { useState } from 'react'

export function SearchBar({
  onSearch,
  placeholder = 'Search by train number, name, station, or type…',
  autoFocus = false,
}: {
  onSearch: (q: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(value.trim())
      }}
      className="relative w-full"
    >
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onSearch(e.target.value.trim())
        }}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-soft outline-none ring-rail-400 transition focus:ring-2"
      />
    </form>
  )
}
