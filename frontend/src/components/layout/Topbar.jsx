function Topbar({
  channelHandle,
  channelInitials,
  channelName,
  isAuthed,
  onLogout,
  onOpenAuth,
  onOpenProfile,
  onOpenUpload,
  onSearchSubmit,
  search,
  setSearch
}) {
  return (
    <header className="yt-topbar">
      <div className="brand-row">
        <button className="icon-btn" type="button" aria-label="Menu">
          ≡
        </button>
        <div className="brand-mark" aria-hidden>
          ▶
        </div>
        <h1>MyTube</h1>
      </div>

      <form className="search-row" onSubmit={onSearchSubmit}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
        <button type="submit">Search</button>
      </form>

      <div className="account-row">
        {isAuthed ? (
          <>
            <div className="avatar-pill" title={`@${channelHandle}`}>
              {channelInitials || "G"}
            </div>
            <div className="account-meta">
              <strong>{channelName}</strong>
              <span>@{channelHandle}</span>
            </div>
            <button type="button" className="ghost-btn" onClick={onOpenProfile}>
              Profile
            </button>
            <button type="button" className="ghost-btn" onClick={onOpenUpload}>
              Upload
            </button>
            <button type="button" className="ghost-btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button type="button" className="ghost-btn" onClick={onOpenAuth}>
            Sign in
          </button>
        )}
      </div>
    </header>
  )
}

export default Topbar
