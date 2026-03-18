function VideoCard({ formatViews, onOpenVideo, onOwnerClick, video }) {
  return (
    <article className="video-card">
      <button
        className="video-thumb"
        type="button"
        onClick={() => onOpenVideo(video._id)}
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
          <p>{formatViews(video.views)} views</p>
        </div>
      </div>
    </article>
  )
}

function VideoGrid({ formatViews, onOpenVideo, onOwnerClick, videos }) {
  if (!videos.length) return null

  return (
    <section className="video-grid">
      {videos.map((video) => (
        <VideoCard
          key={video._id}
          formatViews={formatViews}
          onOpenVideo={onOpenVideo}
          onOwnerClick={onOwnerClick}
          video={video}
        />
      ))}
    </section>
  )
}

export default VideoGrid
