import { useEffect, useMemo, useState } from "react"

function formatPublishedDate(value) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function WatchSpotlight({
  busyComment = false,
  busyDelete = false,
  busyReaction = false,
  canGoWatchBack = false,
  canGoWatchForward = false,
  commentDraft = "",
  comments = [],
  currentUserId,
  formatViews,
  isAuthed,
  onCommentSubmit = () => {},
  onDeleteVideo = () => {},
  onEditVideo = () => {},
  onToggleSubscription = () => {},
  isSubscribedToOwner = false,
  busySubscription = false,
  onToggleVideoDislike = () => {},
  onToggleVideoLike = () => {},
  onWatchBack = () => {},
  onWatchForward = () => {},
  selectedVideo,
  setCommentDraft = () => {}
}) {
  const [showFullDescription, setShowFullDescription] = useState(false)

  useEffect(() => {
    setShowFullDescription(false)
  }, [selectedVideo?._id])

  const publishedDate = useMemo(
    () => formatPublishedDate(selectedVideo?.createdAt),
    [selectedVideo?.createdAt]
  )

  if (!selectedVideo) return null

  const fullDescription = selectedVideo.description || "No description added."
  const shouldTruncate = fullDescription.length > 220
  const displayDescription = shouldTruncate && !showFullDescription
    ? `${fullDescription.slice(0, 220).trimEnd()}...`
    : fullDescription
  const owner = selectedVideo.owner || {}
  const commentCount = selectedVideo.commentsCount ?? comments.length
  const isOwner = Boolean(currentUserId && owner._id && currentUserId === owner._id)

  const ownerInitial = (owner.username || owner.fullName || "u").charAt(0).toUpperCase()

  return (
    <section className="watch-spotlight">
      <div className="player-wrap">
        <video controls src={selectedVideo.videoFile} poster={selectedVideo.thumbnail || undefined} />
      </div>
      <div className="watch-meta">
        <h2>{selectedVideo.title}</h2>

        <div className="watch-stats-row">
          <p>
            {formatViews(selectedVideo.views)} views {publishedDate ? `· ${publishedDate}` : ""}
          </p>
          <div className="watch-actions">
            <button
              type="button"
              className="watch-action-btn"
              onClick={onWatchBack}
              disabled={!canGoWatchBack || busyReaction || busyDelete}
            >
              Back
            </button>
            <button
              type="button"
              className="watch-action-btn"
              onClick={onWatchForward}
              disabled={!canGoWatchForward || busyReaction || busyDelete}
            >
              Forward
            </button>
            <button
              type="button"
              className={`watch-action-btn ${selectedVideo.isLiked ? "active like" : ""}`}
              onClick={onToggleVideoLike}
              disabled={busyReaction}
            >
              Like {formatViews(selectedVideo.likesCount || 0)}
            </button>
            <button
              type="button"
              className={`watch-action-btn ${selectedVideo.isDisliked ? "active dislike" : ""}`}
              onClick={onToggleVideoDislike}
              disabled={busyReaction}
            >
              Dislike {formatViews(selectedVideo.dislikesCount || 0)}
            </button>

            {isOwner ? (
              <>
                <button
                  type="button"
                  className="watch-action-btn"
                  onClick={() => onEditVideo(selectedVideo)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="watch-action-btn danger"
                  onClick={() => onDeleteVideo(selectedVideo._id)}
                  disabled={busyDelete}
                >
                  {busyDelete ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="watch-owner-row">
          {owner.avatar ? (
            <img className="watch-owner-avatar" src={owner.avatar} alt={owner.fullName || owner.username || "Creator"} />
          ) : (
            <div className="watch-owner-avatar watch-owner-fallback">{ownerInitial}</div>
          )}

          <div className="watch-owner-copy">
            <strong>{owner.fullName || "Unknown creator"}</strong>
            <span>@{owner.username || "unknown"}</span>
          </div>

          {!isOwner ? (
            <button
              type="button"
              className={`primary-btn watch-subscribe-btn ${isSubscribedToOwner ? "subscribed" : ""}`}
              onClick={onToggleSubscription}
              disabled={busySubscription}
            >
              {busySubscription ? "Working..." : isSubscribedToOwner ? "Subscribed" : "Subscribe"}
            </button>
          ) : null}
        </div>

        <div className="watch-description-box">
          <p>{displayDescription}</p>
          {shouldTruncate ? (
            <button
              type="button"
              className="tiny-link"
              onClick={() => setShowFullDescription((prev) => !prev)}
            >
              {showFullDescription ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>

        <section className="watch-comments">
          <h3>{formatViews(commentCount)} Comments</h3>

          {isAuthed ? (
            <form className="watch-comment-form" onSubmit={onCommentSubmit}>
              <textarea
                rows={3}
                placeholder="Add a comment"
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
              />
              <button type="submit" className="primary-btn" disabled={busyComment || !commentDraft.trim()}>
                {busyComment ? "Posting..." : "Comment"}
              </button>
            </form>
          ) : (
            <p className="muted-note">Sign in to like/dislike and comment on this video.</p>
          )}

          <div className="comment-list">
            {comments.length ? (
              comments.map((comment) => {
                const commentOwner = comment.owner || {}
                const commentInitial = (commentOwner.username || commentOwner.fullName || "u").charAt(0).toUpperCase()

                return (
                  <article className="comment-item" key={comment._id}>
                    {commentOwner.avatar ? (
                      <img
                        className="comment-avatar"
                        src={commentOwner.avatar}
                        alt={commentOwner.fullName || commentOwner.username || "Viewer"}
                      />
                    ) : (
                      <div className="comment-avatar comment-avatar-fallback">{commentInitial}</div>
                    )}

                    <div className="comment-body">
                      <strong>
                        {commentOwner.fullName || "Unknown"} <span>@{commentOwner.username || "unknown"}</span>
                      </strong>
                      <p>{comment.comment}</p>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="muted-note">No comments yet. Start the conversation.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default WatchSpotlight
