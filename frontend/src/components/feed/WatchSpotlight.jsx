function WatchSpotlight({ formatViews, selectedVideo }) {
  if (!selectedVideo) return null

  return (
    <section className="watch-spotlight">
      <div className="player-wrap">
        <video controls src={selectedVideo.videoFile} poster={selectedVideo.thumbnail || undefined} />
      </div>
      <div className="watch-meta">
        <h2>{selectedVideo.title}</h2>
        <p>{selectedVideo.description}</p>
        <p>
          {formatViews(selectedVideo.views)} views · by {selectedVideo.owner?.fullName || "Unknown"} (@
          {selectedVideo.owner?.username || "unknown"})
        </p>
      </div>
    </section>
  )
}

export default WatchSpotlight
