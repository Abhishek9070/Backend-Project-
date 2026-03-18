import { useCallback, useEffect, useMemo, useState } from "react"
import { getUserProfile, loginUser, logoutUser, registerUser } from "../../api/auth"
import { authStorage } from "../../api/client"
import { fetchChannelStats, fetchChannelVideos } from "../../api/dashboard"
import { fetchLikedVideos, fetchMyPlaylists, fetchWatchHistory } from "../../api/library"
import { fetchSubscribedChannels } from "../../api/subscriptions"
import { fetchVideoById, fetchVideos, fetchVideosByOwner, uploadVideo } from "../../api/videos"

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

const protectedSections = new Set(["subscriptions", "profile", "history", "playlists", "liked", "dashboard"])

function dedupeVideos(items) {
  const map = new Map()
  for (const item of items || []) {
    if (item?._id && !map.has(item._id)) map.set(item._id, item)
  }
  return Array.from(map.values())
}

export function useHomeController() {
  const [mode, setMode] = useState("login")
  const [activeSection, setActiveSection] = useState("home")
  const [sectionTitle, setSectionTitle] = useState("Home")
  const [activeChip, setActiveChip] = useState("All")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const [token, setToken] = useState(() => authStorage.getToken() || "")
  const [user, setUser] = useState(() => authStorage.getUser())
  const [profile, setProfile] = useState(null)

  const [registerForm, setRegisterForm] = useState(defaultRegister)
  const [loginForm, setLoginForm] = useState(defaultLogin)
  const [uploadForm, setUploadForm] = useState(defaultUpload)

  const [videos, setVideos] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [subscribedChannels, setSubscribedChannels] = useState([])
  const [channelProfile, setChannelProfile] = useState(null)

  const [search, setSearch] = useState("")
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [status, setStatus] = useState("")
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [busyAuth, setBusyAuth] = useState(false)
  const [busyUpload, setBusyUpload] = useState(false)

  const isAuthed = useMemo(() => Boolean(token), [token])

  const clearSectionData = useCallback(() => {
    setDashboardStats(null)
    setPlaylists([])
    setSubscribedChannels([])
    setChannelProfile(null)
  }, [])

  const loadVideos = useCallback(async (query = "") => {
    setLoadingFeed(true)
    try {
      const response = await fetchVideos(query)
      setVideos(response?.data?.items || [])
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoadingFeed(false)
    }
  }, [])

  const loadProfile = useCallback(async () => {
    if (!isAuthed || !user?.username) {
      setProfile(null)
      return
    }

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

  const requireAuth = useCallback((message) => {
    setStatus(message)
    setMode("login")
    setShowAuthModal(true)
  }, [])

  const onRegisterSubmit = useCallback(async (event) => {
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
  }, [registerForm])

  const onLoginSubmit = useCallback(async (event) => {
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
  }, [loginForm])

  const onLogout = useCallback(async () => {
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
      setShowUploadModal(false)
      setShowAuthModal(false)
      setSectionTitle("Home")
      setActiveSection("home")
      clearSectionData()
      loadVideos(search)
    }
  }, [clearSectionData, loadVideos, search, token])

  const openChannelProfile = useCallback(async ({ username, ownerId, title }) => {
    if (!username) return

    if (!isAuthed || !token) {
      requireAuth("Sign in to view channel pages")
      return
    }

    setLoadingFeed(true)
    setStatus("")
    setActiveSection("channel")
    setSectionTitle(title || `@${username}`)
    clearSectionData()

    try {
      const profileResponse = await getUserProfile(username, token)
      setChannelProfile(profileResponse?.data || null)

      if (ownerId) {
        const videosResponse = await fetchVideosByOwner(ownerId)
        setVideos(videosResponse?.data?.items || [])
      } else {
        setVideos([])
      }
    } catch (error) {
      setStatus(error.message)
      setVideos([])
    } finally {
      setLoadingFeed(false)
    }
  }, [clearSectionData, isAuthed, requireAuth, token])

  const runSectionLoad = useCallback(async (section) => {
    if (protectedSections.has(section) && (!isAuthed || !token)) {
      requireAuth("Please sign in to access this section")
      return
    }

    setLoadingFeed(true)
    setStatus("")
    setSelectedVideo(null)
    setActiveSection(section)
    clearSectionData()

    try {
      if (section === "home") {
        setSectionTitle("Home")
        setActiveChip("All")
        setSearch("")
        await loadVideos("")
        return
      }

      if (section === "shorts") {
        setSectionTitle("Shorts")
        setStatus("Shorts view is coming soon. Showing latest videos for now.")
        await loadVideos("")
        return
      }

      if (section === "subscriptions") {
        setSectionTitle("Subscriptions")
        const channelsResponse = await fetchSubscribedChannels(token)
        const channels = channelsResponse?.data || []
        setSubscribedChannels(channels)

        if (!channels.length) {
          setVideos([])
          return
        }

        const ownerIds = channels.map((item) => item?.channel?._id).filter(Boolean)
        const ownerVideoResponses = await Promise.all(ownerIds.map((ownerId) => fetchVideosByOwner(ownerId)))
        const ownerVideos = ownerVideoResponses.flatMap((res) => res?.data?.items || [])
        setVideos(dedupeVideos(ownerVideos))
        return
      }

      if (section === "profile") {
        setSectionTitle("Your profile")
        if (!user?.username) {
          setVideos([])
          return
        }

        const profileResponse = await getUserProfile(user.username, token)
        setChannelProfile(profileResponse?.data || null)

        if (user?._id) {
          const ownerVideos = await fetchVideosByOwner(user._id)
          setVideos(ownerVideos?.data?.items || [])
        } else {
          setVideos([])
        }
        return
      }

      if (section === "history") {
        setSectionTitle("Watch history")
        const historyResponse = await fetchWatchHistory(token)
        setVideos(historyResponse?.data || [])
        return
      }

      if (section === "playlists") {
        setSectionTitle("Your playlists")
        const playlistsResponse = await fetchMyPlaylists(token)
        setPlaylists(playlistsResponse?.data || [])
        setVideos([])
        return
      }

      if (section === "liked") {
        setSectionTitle("Liked videos")
        const likedResponse = await fetchLikedVideos(token)
        setVideos(likedResponse?.data || [])
        return
      }

      if (section === "dashboard") {
        setSectionTitle("Dashboard")
        const [statsResponse, videosResponse] = await Promise.all([
          fetchChannelStats(token),
          fetchChannelVideos(token)
        ])
        setDashboardStats(statsResponse?.data || null)
        setVideos(videosResponse?.data || [])
      }
    } catch (error) {
      setStatus(error.message)
    } finally {
      setLoadingFeed(false)
    }
  }, [clearSectionData, isAuthed, loadVideos, requireAuth, token, user])

  const onNavSelect = useCallback(async (section) => {
    await runSectionLoad(section)
  }, [runSectionLoad])

  const onSearchSubmit = useCallback(async (event) => {
    event.preventDefault()
    setActiveChip("All")
    setActiveSection("home")
    setSectionTitle(search ? `Search: ${search}` : "Home")
    clearSectionData()
    await loadVideos(search)
  }, [clearSectionData, loadVideos, search])

  const onCategorySelect = useCallback(async (chip) => {
    setActiveChip(chip)
    const query = chip === "All" ? "" : chip
    setSearch(query)
    setActiveSection("home")
    setSectionTitle(chip === "All" ? "Home" : `Category: ${chip}`)
    clearSectionData()
    await loadVideos(query)
  }, [clearSectionData, loadVideos])

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

  const onUploadSubmit = useCallback(async (event) => {
    event.preventDefault()
    setBusyUpload(true)
    setStatus("")

    try {
      if (!isAuthed || !token) {
        throw new Error("Please sign in before uploading")
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
      setActiveSection("home")
      setSectionTitle("Home")
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyUpload(false)
    }
  }, [isAuthed, loadVideos, search, token, uploadForm])

  const onOwnerClick = useCallback(async (owner) => {
    if (!owner?.username) return
    await openChannelProfile({
      username: owner.username,
      ownerId: owner._id,
      title: `Channel: @${owner.username}`
    })
  }, [openChannelProfile])

  const openAuthModal = useCallback((targetMode = "login") => {
    setMode(targetMode)
    setShowAuthModal(true)
  }, [])

  const closeAuthModal = useCallback(() => setShowAuthModal(false), [])

  const openUploadModal = useCallback(() => {
    if (!isAuthed) {
      requireAuth("Please sign in before uploading")
      return
    }
    setShowUploadModal(true)
  }, [isAuthed, requireAuth])

  const closeUploadModal = useCallback(() => setShowUploadModal(false), [])

  const toggleAuthMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"))
  }, [])

  const channelHandle = profile?.username || user?.username || "guest"
  const channelName = profile?.fullName || user?.fullName || "Guest"
  const channelInitials = channelName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  const formatViews = useCallback((count) => new Intl.NumberFormat("en-US").format(count || 0), [])

  return {
    activeSection,
    activeChip,
    busyAuth,
    busyUpload,
    categorySearch: search,
    channelHandle,
    channelInitials,
    channelName,
    channelProfile,
    closeAuthModal,
    closeUploadModal,
    dashboardStats,
    formatViews,
    isAuthed,
    loadingDetails,
    loadingFeed,
    loginForm,
    mode,
    onCategorySelect,
    onLoginSubmit,
    onLogout,
    onNavSelect,
    onOwnerClick,
    onRegisterSubmit,
    onSearchSubmit,
    onUploadSubmit,
    openAuthModal,
    openUploadModal,
    playlists,
    profile,
    registerForm,
    search,
    sectionTitle,
    selectedVideo,
    setLoginForm,
    setRegisterForm,
    setSearch,
    setUploadForm,
    showAuthModal,
    showUploadModal,
    status,
    subscribedChannels,
    toggleAuthMode,
    uploadForm,
    videos,
    loadVideoById
  }
}
