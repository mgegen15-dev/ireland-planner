import { useState } from 'react'
import { useUrlScraper } from '../hooks/useUrlScraper'
import { Link2, Loader2, AlertCircle, Sparkles } from 'lucide-react'

export default function UrlImport({ onData, placeholder }) {
  const [url, setUrl] = useState('')
  const { scrapeUrl, loading, error } = useUrlScraper()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    try {
      const data = await scrapeUrl(url.trim())
      onData(data)
      setUrl('')
    } catch {
      // error is already set in the hook
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="url"
            className="input-field pl-9 pr-3"
            placeholder={placeholder || "Paste a URL to auto-fill details..."}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Fetching...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Auto-Fill
            </>
          )}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  )
}
