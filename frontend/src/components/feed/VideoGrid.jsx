function VideoCard({ currentUserId, formatViews, onDeleteVideo, onOpenVideo, onOwnerClick, onPrefetchVideo, video }) {
  const isOwner = Boolean(currentUserId && video.owner?._id && currentUserId === video.owner._id)

  return (
    <article className="video-card">
      <button
        className="video-thumb"
        type="button"
        onClick={() => onOpenVideo(video._id)}
        onFocus={() => onPrefetchVideo?.(video._id)}
        onMouseEnter={() => onPrefetchVideo?.(video._id)}
        aria-label={`Open ${video.title}`}
      >
        {video.thumbnail ? <img src={video.thumbnail} alt={video.title} /> : <div className="thumb-fallback">No thumbnail</div>}
        <span className="duration-pill">{Math.round(video.duration || 0)}s</span>
      </button>

      <div className="video-info">
        <div className="mini-avatar">{(video.owner?.username || "g").charAt(0).toUpperCase()}</div>
        <div>
          <h3>{video.title}</h3>
          <button type="button" className="owner-link" onClick={() => onOwnerClick(video.owner)}>
            {video.owner?.fullName || "Unknown creator"}
          </button>

          <div className="video-card-row">
            <p>{formatViews(video.views)} views</p>
            {isOwner ? (
              <button type="button" className="danger-link-btn" onClick={() => onDeleteVideo(video._id)}>
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function VideoGrid({ currentUserId, formatViews, onDeleteVideo, onOpenVideo, onOwnerClick, onPrefetchVideo, videos }) {
  if (!videos.length) return null

  return (
    <section className="video-grid">
      {videos.map((video) => (
        <VideoCard
          key={video._id}
          currentUserId={currentUserId}
          formatViews={formatViews}
          onDeleteVideo={onDeleteVideo}
          onOpenVideo={onOpenVideo}
          onOwnerClick={onOwnerClick}
          onPrefetchVideo={onPrefetchVideo}
          video={video}
        />
      ))}
    </section>
  )
}

export default VideoGrid
