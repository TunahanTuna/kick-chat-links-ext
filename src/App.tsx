import { useChannel, useChatAndLinksWithPersistence } from './shared/hooks'
import { LinksPanel, DismissedLinksPanel } from './features/links'

export default function App() {
  const {
    username,
    setUsername,
    channel,
    isLoading,
    errorMessage,
    fetchChannel
  } = useChannel()

  const { linkMap, dismissedMap, clearAllLinks, removeLink } = useChatAndLinksWithPersistence(channel)

  return (
    <div className="flex flex-col h-full w-full bg-theme-secondary text-white rounded-md overflow-hidden font-sans text-sm">
      {/* Header - Native Kick Style */}
      <header
        className="flex-shrink-0 h-[52px] pl-[21px] pr-[14px] flex items-center justify-between border-b"
        style={{ borderBottomColor: '#3A3D3E' }}
      >
        <div className="flex items-center gap-2.5">
          <svg className="h-[18px] w-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h2 className="text-[15px] font-semibold text-white">Kick Links</h2>
        </div>
        
        {window.location.protocol !== 'chrome-extension:' && (
          <button
            onClick={() => {
              const width = 450;
              const height = 700;
              const left = (window.screen.width / 2) - (width / 2);
              const top = (window.screen.height / 2) - (height / 2);
              const channelParam = username ? `?channel=${username}` : '';
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const baseUrl = (window as any).chrome?.runtime?.getURL('index.html') || 'index.html';
              window.open(
                baseUrl + channelParam,
                'KickChatLinksPopout',
                `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
              );
            }}
            className="p-1.5 rounded hover:bg-[#3A3D3E] transition-colors text-[#8B9199] hover:text-white"
            title="Popout"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3v6a1 1 0 0 1-2 0V5.414l-8.293 8.293a1 1 0 1 1-1.414-1.414L17.586 4H15a1 1 0 0 1 0-2h6a1 1 0 0 1 1 1z" />
              <path d="M19 14a1 1 0 0 1 2 0v5a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h5a1 1 0 0 1 0 2H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-5z" />
            </svg>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col px-5 pt-6 pb-4 overflow-hidden relative min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col gap-6">
          {/* Connection Form */}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!isLoading && !channel) {
                void fetchChannel()
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#8B9199]">BAĞLI KANAL</label>
              <input
                className={`w-full rounded bg-[#0B0E0F] text-[#8B9199] text-sm outline-none px-3 py-2 transition-colors ${isLoading || !!channel ? 'cursor-not-allowed opacity-80' : 'focus:ring-1 focus:ring-[#53FC18]'
                  }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Yayıncı adını girin..."
                disabled={isLoading || !!channel}
                spellCheck={false}
              />
            </div>
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
        </div>
      </main>
    </div>
  )
}
