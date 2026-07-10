import { useChannel, useChatAndLinksWithPersistence } from './shared/hooks'
import { LinksPanel, DismissedLinksPanel } from './features/links'

export default function App() {
  const {
    username,
    setUsername,
    channel,
    isLoading,
    errorMessage,
    hasEverConnected,
    fetchChannel,
    disconnect
  } = useChannel()

  const { linkMap, dismissedMap, clearAllLinks, removeLink } = useChatAndLinksWithPersistence(channel)

  return (
    <div className="flex flex-col h-full w-full text-white font-sans text-sm">
      {/* Header - Native Kick Style */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-[#53FC18]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="text-sm font-bold text-white">Kick Links</h2>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {/* Connection Form */}
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void fetchChannel()
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#8B9199]">KULLANICI ADI</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded bg-[#0B0E0F] text-white text-sm outline-none placeholder:text-[#535A62] border border-[#24272C] px-3 py-2 focus:border-[#53FC18] transition-colors"
                placeholder="yayıncı adını girin..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!username.trim() || isLoading}
                className="rounded bg-[#53FC18] px-4 py-2 text-sm font-semibold text-black hover:bg-[#46e012] disabled:opacity-50 disabled:bg-[#34373C] disabled:text-[#8B9199] transition-colors flex-shrink-0"
              >
                {isLoading ? '...' : 'Bağlan'}
              </button>
            </div>
          </div>

          {hasEverConnected && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-[#8B9199]">BAĞLANTI DURUMU</span>
              <button
                type="button"
                onClick={() => channel ? disconnect() : void fetchChannel()}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-all duration-300 focus:outline-none ${
                  channel ? 'bg-[#53FC18]' : 'bg-[#34373C]'
                }`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                  channel ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
          )}
        </form>

        {errorMessage && (
          <div className="rounded border border-red-500/50 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {channel && !errorMessage && (
          <div className="flex flex-col gap-4">
            <LinksPanel linkMap={linkMap} onRemoveLink={removeLink} onClearAllLinks={clearAllLinks} />
            <DismissedLinksPanel dismissedMap={dismissedMap} />
          </div>
        )}

        {!channel && !isLoading && !errorMessage && (
          <div className="text-center p-4 text-[#8B9199] text-sm">
            Canlı yayından linkleri yakalamak için bağlanın.
          </div>
        )}
      </main>
    </div>
  )
}
