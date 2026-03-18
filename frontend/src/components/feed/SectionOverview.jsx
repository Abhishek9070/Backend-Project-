function SectionOverview({
  channelProfile,
  dashboardStats,
  formatViews,
  onOpenChannel,
  playlists,
  sectionTitle,
  subscribedChannels
}) {
  return (
    <>
      <section className="section-head">
        <h2>{sectionTitle}</h2>
      </section>

      {channelProfile ? (
        <section className="profile-banner">
          <div className="profile-avatar-wrap">
            {channelProfile.avatar ? (
              <img src={channelProfile.avatar} alt={channelProfile.fullName} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-fallback">{(channelProfile.username || "g").charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div>
            <h3>{channelProfile.fullName}</h3>
            <p>@{channelProfile.username}</p>
            <p>
              {formatViews(channelProfile.subscriberCount)} subscribers · {formatViews(channelProfile.channelSubscribedToCount)} subscribed
            </p>
          </div>
        </section>
      ) : null}

      {dashboardStats ? (
        <section className="stats-grid">
          <article className="stat-card">
            <span>Total Videos</span>
            <strong>{formatViews(dashboardStats.totalVideos)}</strong>
          </article>
          <article className="stat-card">
            <span>Total Views</span>
            <strong>{formatViews(dashboardStats.totalViews)}</strong>
          </article>
          <article className="stat-card">
            <span>Subscribers</span>
            <strong>{formatViews(dashboardStats.totalSubscribers)}</strong>
          </article>
          <article className="stat-card">
            <span>Total Likes</span>
            <strong>{formatViews(dashboardStats.totalLikes)}</strong>
          </article>
        </section>
      ) : null}

      {subscribedChannels?.length ? (
        <section className="channels-strip">
          {subscribedChannels.map((item) => (
            <button
              key={item._id || item.channel?._id}
              className="channel-pill"
              type="button"
              onClick={() => onOpenChannel(item.channel)}
            >
              <div className="mini-avatar">{(item.channel?.username || "c").charAt(0).toUpperCase()}</div>
              <span>{item.channel?.fullName || item.channel?.username || "Channel"}</span>
            </button>
          ))}
        </section>
      ) : null}

      {playlists?.length ? (
        <section className="playlist-grid">
          {playlists.map((playlist) => (
            <article key={playlist._id} className="playlist-card">
              <h3>{playlist.name}</h3>
              <p>{playlist.description}</p>
              <small>{formatViews(playlist.video?.length || 0)} videos</small>
            </article>
          ))}
        </section>
      ) : null}
    </>
  )
}

export default SectionOverview
