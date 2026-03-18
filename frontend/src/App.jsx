import { useCallback, useEffect, useMemo, useState } from "react"
import { authStorage } from "./api/client"
import { getUserProfile, loginUser, logoutUser, registerUser } from "./api/auth"
import { fetchVideoById, fetchVideos, uploadVideo } from "./api/videos"

const defaultRegister = {
  username: "",
  fullName: "",
  email: "",
  password: "",
  avatar: null,
  coverImage: null
}

const defaultLogin = {
  username: "",
  email: "",
  password: ""
}

const defaultUpload = {
  title: "",
  description: "",
  videoFile: null,
  thumbnail: null
}

const categoryChips = [
  "All",
  "Music",
  "Gaming",
  "Live",
  "News",
  "Podcasts",
  "Coding",
  "Design",
  "Cricket",
  "Cooking"
]

const sidebarPrimary = ["Home", "Shorts", "Subscriptions"]
const sidebarLibrary = ["You", "History", "Playlists", "Liked videos", "Watch later"]

function App() {
  const [mode, setMode] = useState("login")
  const [activeChip, setActiveChip] = useState("All")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [token, setToken] = useState(() => authStorage.getToken() || "")
  const [user, setUser] = useState(() => authStorage.getUser())
  const [registerForm, setRegisterForm] = useState(defaultRegister)
  const [loginForm, setLoginForm] = useState(defaultLogin)
  const [uploadForm, setUploadForm] = useState(defaultUpload)
  const [videos, setVideos] = useState([])
  const [search, setSearch] = useState("")
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [status, setStatus] = useState("")
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [busyAuth, setBusyAuth] = useState(false)
  const [busyUpload, setBusyUpload] = useState(false)
  const [profile, setProfile] = useState(null)

  const isAuthed = useMemo(() => Boolean(token), [token])

  const loadVideos = useCallback(
    async (query = "") => {
      setLoadingFeed(true)
      try {
        const response = await fetchVideos(query)
        setVideos(response?.data?.items || [])
      } catch (error) {
        setStatus(error.message)
      } finally {
        setLoadingFeed(false)
      }
    },
    [setVideos]
  )

  const loadVideoById = useCallback(async (videoId) => {
    if (!videoId) return
    setLoadingDetails(true)
    try {
      const response = await fetchVideoById(videoId)
      setSelectedVideo(response?.data || null)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  const loadProfile = useCallback(async () => {
    if (!isAuthed || !user?.username) return

    try {
      const response = await getUserProfile(user.username, token)
      setProfile(response?.data || null)
    } catch {
      setProfile(null)
    }
  }, [isAuthed, token, user])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const onRegisterSubmit = async (event) => {
    event.preventDefault()
    setBusyAuth(true)
    setStatus("")

    try {
      const payload = new FormData()
      payload.append("username", registerForm.username)
      payload.append("fullName", registerForm.fullName)
      payload.append("email", registerForm.email)
      payload.append("password", registerForm.password)

      if (registerForm.avatar) payload.append("avatar", registerForm.avatar)
      if (registerForm.coverImage) payload.append("coverImage", registerForm.coverImage)

      const response = await registerUser(payload)
      setStatus(response?.message || "Registration successful, please login.")
      setRegisterForm(defaultRegister)
      setMode("login")
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyAuth(false)
    }
  }

  const onLoginSubmit = async (event) => {
    event.preventDefault()
    setBusyAuth(true)
    setStatus("")

    try {
      const body = {
        password: loginForm.password
      }

      if (loginForm.username.trim()) body.username = loginForm.username.trim()
      if (loginForm.email.trim()) body.email = loginForm.email.trim()

      const response = await loginUser(body)
      const accessToken = response?.data?.accessToken
      const userDetails = response?.data?.userDetails

      if (!accessToken || !userDetails) {
        throw new Error("Login succeeded but token or user data is missing")
      }

      authStorage.setToken(accessToken)
      authStorage.setUser(userDetails)
      setToken(accessToken)
      setUser(userDetails)
      setStatus("Logged in successfully")
      setLoginForm(defaultLogin)
      setShowAuthModal(false)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyAuth(false)
    }
  }

  const onLogout = async () => {
    setStatus("")
    try {
      if (token) {
        await logoutUser(token)
      }
    } catch {
      setStatus("Session cleared locally")
    } finally {
      authStorage.clearToken()
      authStorage.clearUser()
      setToken("")
      setUser(null)
      setProfile(null)
      setSelectedVideo(null)
    }
  }

  const onUploadSubmit = async (event) => {
    event.preventDefault()
    setBusyUpload(true)
    setStatus("")

    try {
      if (!isAuthed) {
        throw new Error("Please login before uploading")
      }

      const formData = new FormData()
      formData.append("title", uploadForm.title)
      formData.append("description", uploadForm.description)

      if (uploadForm.videoFile) formData.append("videoFile", uploadForm.videoFile)
      if (uploadForm.thumbnail) formData.append("thumbnail", uploadForm.thumbnail)

      const response = await uploadVideo(formData, token)
      setStatus(response?.message || "Video uploaded")
      setUploadForm(defaultUpload)
      setShowUploadModal(false)
      await loadVideos(search)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyUpload(false)
    }
  }

  const onSearchSubmit = async (event) => {
    event.preventDefault()
    setActiveChip("All")
    await loadVideos(search)
  }

  const onCategorySelect = useCallback(
    async (chip) => {
      setActiveChip(chip)
      const query = chip === "All" ? "" : chip
      setSearch(query)
      await loadVideos(query)
    },
    [loadVideos]
  )

  const channelHandle = profile?.username || user?.username || "guest"
  const channelName = profile?.fullName || user?.fullName || "Guest"
  const channelInitials = channelName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const formatViews = (count) => new Intl.NumberFormat("en-US").format(count || 0)

  return (
    <div className="yt-shell">
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
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
          />
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
              <button type="button" className="ghost-btn" onClick={() => setShowUploadModal(true)}>
                Upload
              </button>
              <button type="button" className="ghost-btn" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setMode("login")
                setShowAuthModal(true)
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="yt-layout">
        <aside className="yt-sidebar">
          <nav>
            {sidebarPrimary.map((item) => (
              <button key={item} type="button" className="side-link">
                <span className="side-icon">●</span>
                <span>{item}</span>
              </button>
            ))}
          </nav>

          <div className="side-divider" />

          <nav>
            {sidebarLibrary.map((item) => (
              <button key={item} type="button" className="side-link">
                <span className="side-icon">■</span>
                <span>{item}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="yt-content">
          <section className="chip-row" aria-label="Categories">
            {categoryChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`chip ${activeChip === chip ? "active" : ""}`}
                onClick={() => onCategorySelect(chip)}
              >
                {chip}
              </button>
            ))}
          </section>

          {status ? <p className="status-line">{status}</p> : null}

          {selectedVideo ? (
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
          ) : null}

          {loadingFeed ? <p className="loading-note">Loading videos...</p> : null}

          <section className="video-grid">
            {videos.map((video) => (
              <article key={video._id} className="video-card">
                <button
                  className="video-thumb"
                  type="button"
                  onClick={() => loadVideoById(video._id)}
                  aria-label={`Open ${video.title}`}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} />
                  ) : (
                    <div className="thumb-fallback">No thumbnail</div>
                  )}
                  <span className="duration-pill">{Math.round(video.duration || 0)}s</span>
                </button>

                <div className="video-info">
                  <div className="mini-avatar">{(video.owner?.username || "g").charAt(0).toUpperCase()}</div>
                  <div>
                    <h3>{video.title}</h3>
                    <p>{video.owner?.fullName || "Unknown creator"}</p>
                    <p>{formatViews(video.views)} views</p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {!loadingFeed && videos.length === 0 ? (
            <p className="loading-note">No videos found. Try a different search.</p>
          ) : null}

          {loadingDetails ? <p className="loading-note">Loading selected video...</p> : null}
        </main>
      </div>

      {showAuthModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowAuthModal(false)}>
          <article className="panel modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
              <button
                type="button"
                className="tiny-link"
                onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
              >
                {mode === "login" ? "Need an account?" : "Already registered?"}
              </button>
            </div>

            {mode === "register" ? (
              <form className="stack" onSubmit={onRegisterSubmit}>
                <input
                  value={registerForm.username}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="Username"
                  required
                />
                <input
                  value={registerForm.fullName}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  placeholder="Full Name"
                  required
                />
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="Email"
                  required
                />
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Password"
                  required
                />

                <label className="file-input">
                  Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        avatar: event.target.files?.[0] || null
                      }))
                    }
                    required
                  />
                </label>

                <label className="file-input">
                  Cover Image (optional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setRegisterForm((prev) => ({
                        ...prev,
                        coverImage: event.target.files?.[0] || null
                      }))
                    }
                  />
                </label>

                <button className="primary-btn" disabled={busyAuth} type="submit">
                  {busyAuth ? "Creating..." : "Create account"}
                </button>
              </form>
            ) : (
              <form className="stack" onSubmit={onLoginSubmit}>
                <input
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="Username"
                />
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="Email"
                />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Password"
                  required
                />
                <button className="primary-btn" disabled={busyAuth} type="submit">
                  {busyAuth ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}
          </article>
        </div>
      ) : null}

      {showUploadModal ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowUploadModal(false)}>
          <article className="panel modal-shell" onClick={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <h2>Upload</h2>
              <button type="button" className="tiny-link" onClick={() => setShowUploadModal(false)}>
                Close
              </button>
            </div>

            <form className="stack" onSubmit={onUploadSubmit}>
              <input
                value={uploadForm.title}
                onChange={(event) => setUploadForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Video title"
                required
              />
              <textarea
                value={uploadForm.description}
                onChange={(event) =>
                  setUploadForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Description"
                rows={3}
                required
              />
              <label className="file-input">
                Video file
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      videoFile: event.target.files?.[0] || null
                    }))
                  }
                  required
                />
              </label>
              <label className="file-input">
                Thumbnail
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      thumbnail: event.target.files?.[0] || null
                    }))
                  }
                />
              </label>
              <button className="primary-btn" disabled={busyUpload || !isAuthed} type="submit">
                {busyUpload ? "Uploading..." : "Upload"}
              </button>
            </form>
          </article>
        </div>
      ) : null}
    </div>
  )
}

export default App
