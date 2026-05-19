import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clearSession, selectToken, selectUser, setSession } from "../../store/slices/authSlice"
import {
  resetAppState,
  selectActiveSection,
  selectSearchQuery,
  selectSectionTitle,
  selectStatusMessage,
  setActiveSection,
  setSearchQuery,
  setSectionTitle as setSectionTitleAction,
  setStatusMessage
} from "../../store/slices/appSlice"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { getUserProfile, loginUser, logoutUser, registerUser } from "../../api/auth"
import { authStorage } from "../../api/client"
import { createVideoComment, fetchVideoComments } from "../../api/comments"
import { fetchChannelStats, fetchChannelVideos } from "../../api/dashboard"
import { fetchLikedVideos, fetchMyPlaylists, fetchWatchHistory } from "../../api/library"
import { toggleVideoDislikeReaction, toggleVideoLikeReaction } from "../../api/reactions"
import { fetchSubscribedChannels, toggleSubscription } from "../../api/subscriptions"
import { deleteVideoById, fetchVideoById, fetchVideos, fetchVideosByOwner, updateVideoById, uploadVideo } from "../../api/videos"

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
const VIDEO_BUNDLE_CACHE_TTL_MS = 1000 * 60 * 2

function dedupeVideos(items) {
  const map = new Map()
  for (const item of items || []) {
    if (item?._id && !map.has(item._id)) map.set(item._id, item)
  }
  return Array.from(map.values())
}

export function useHomeController() {
  const dispatch = useAppDispatch()

  const [mode, setMode] = useState("login")
  const [activeChip, setActiveChip] = useState("All")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const activeSection = useAppSelector(selectActiveSection)
  const sectionTitle = useAppSelector(selectSectionTitle)
  const search = useAppSelector(selectSearchQuery)
  const status = useAppSelector(selectStatusMessage)
  const token = useAppSelector(selectToken)
  const user = useAppSelector(selectUser)

  const [profile, setProfile] = useState(null)

  const [registerForm, setRegisterForm] = useState(defaultRegister)
  const [loginForm, setLoginForm] = useState(defaultLogin)
  const [uploadForm, setUploadForm] = useState(defaultUpload)
  const [editVideoForm, setEditVideoForm] = useState({
    title: "",
    description: "",
    thumbnail: null
  })

  const [videos, setVideos] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [subscribedChannels, setSubscribedChannels] = useState([])
  const [channelProfile, setChannelProfile] = useState(null)

  const [selectedVideo, setSelectedVideo] = useState(null)
  const [videoComments, setVideoComments] = useState([])
  const [commentDraft, setCommentDraft] = useState("")
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [busyComment, setBusyComment] = useState(false)
  const [busyDelete, setBusyDelete] = useState(false)
  const [busyReaction, setBusyReaction] = useState(false)
  const [busyAuth, setBusyAuth] = useState(false)
  const [busyUpload, setBusyUpload] = useState(false)
  const [busyEdit, setBusyEdit] = useState(false)
  const [busySubscription, setBusySubscription] = useState(false)
  const [canGoWatchBack, setCanGoWatchBack] = useState(false)
  const [canGoWatchForward, setCanGoWatchForward] = useState(false)

  const isAuthed = useMemo(() => Boolean(user), [user])
  const setStatus = useCallback((value) => {
    dispatch(setStatusMessage(value))
  }, [dispatch])

  const setSearch = useCallback((value) => {
    dispatch(setSearchQuery(value))
  }, [dispatch])

  const setSectionTitle = useCallback((value) => {
    dispatch(setSectionTitleAction(value))
  }, [dispatch])

  const setAppActiveSection = useCallback((value) => {
    dispatch(setActiveSection(value))
  }, [dispatch])

  const watchStackRef = useRef([])
  const watchIndexRef = useRef(-1)
  const videoBundleCacheRef = useRef(new Map())
  const pendingVideoBundleRef = useRef(new Map())
  const hasBootstrappedSectionRef = useRef(false)

  const getCachedVideoBundle = useCallback((videoId) => {
    if (!videoId) return null

    const cachedEntry = videoBundleCacheRef.current.get(videoId)
    if (!cachedEntry) return null

    const isFresh = Date.now() - cachedEntry.cachedAt <= VIDEO_BUNDLE_CACHE_TTL_MS
    return isFresh ? cachedEntry : null
  }, [])

  const cacheVideoBundle = useCallback((videoId, bundle) => {
    if (!videoId || !bundle?.video) return

    videoBundleCacheRef.current.set(videoId, {
      video: bundle.video,
      comments: bundle.comments || [],
      cachedAt: Date.now()
    })
  }, [])

  const fetchVideoBundle = useCallback(async (videoId, options = {}) => {
    const { forceRefresh = false } = options
    if (!videoId) return null

    if (!forceRefresh) {
      const cachedBundle = getCachedVideoBundle(videoId)
      if (cachedBundle) return cachedBundle

      const pendingBundleRequest = pendingVideoBundleRef.current.get(videoId)
      if (pendingBundleRequest) return pendingBundleRequest
    }

    const bundlePromise = Promise.all([
      fetchVideoById(videoId, token || undefined),
      fetchVideoComments(videoId)
    ])
      .then(([videoResponse, commentsResponse]) => {
        const bundle = {
          video: videoResponse?.data || null,
          comments: commentsResponse?.data || []
        }

        cacheVideoBundle(videoId, bundle)
        return getCachedVideoBundle(videoId)
      })
      .finally(() => {
        pendingVideoBundleRef.current.delete(videoId)
      })

    pendingVideoBundleRef.current.set(videoId, bundlePromise)

    return bundlePromise
  }, [cacheVideoBundle, getCachedVideoBundle, token])

  useEffect(() => {
    videoBundleCacheRef.current.clear()
    pendingVideoBundleRef.current.clear()
  }, [token])

  const syncWatchNavigationState = useCallback(() => {
    const currentIndex = watchIndexRef.current
    const total = watchStackRef.current.length

    setCanGoWatchBack(currentIndex > 0)
    setCanGoWatchForward(currentIndex >= 0 && currentIndex < total - 1)
  }, [])

  const clearWatchSelection = useCallback(() => {
    setSelectedVideo(null)
    setVideoComments([])
    setCommentDraft("")
    setShowEditModal(false)

    watchStackRef.current = []
    watchIndexRef.current = -1
    syncWatchNavigationState()
  }, [syncWatchNavigationState])

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
  }, [setStatus])

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
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!isAuthed || !token) {
      setSubscribedChannels([])
      return
    }

    let isMounted = true

    const loadSubscriptions = async () => {
      try {
        const response = await fetchSubscribedChannels(token)
        if (isMounted) {
          setSubscribedChannels(response?.data || [])
        }
      } catch {
        if (isMounted) {
          setSubscribedChannels([])
        }
      }
    }

    void loadSubscriptions()

    return () => {
      isMounted = false
    }
  }, [isAuthed, token])

  const requireAuth = useCallback((message) => {
    setStatus(message)
    setMode("login")
    setShowAuthModal(true)
  }, [setStatus])

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
  }, [registerForm, setStatus])

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
      const userDetails = response?.data?.userDetails

      if (!userDetails) {
        throw new Error("Login succeeded but user data is missing")
      }

      // Rely on httpOnly cookies for authentication; store only non-sensitive user details client-side
      authStorage.setUser(userDetails)
      dispatch(setSession({ token: "", user: userDetails }))
      setStatus("Logged in successfully")
      setLoginForm(defaultLogin)
      setShowAuthModal(false)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyAuth(false)
    }
  }, [dispatch, loginForm, setStatus])

  const onLogout = useCallback(async () => {
    setStatus("")
      try {
      await logoutUser()
    } catch {
      setStatus("Session cleared locally")
    } finally {
      authStorage.clearToken()
      authStorage.clearUser()
      dispatch(clearSession())
      dispatch(resetAppState())
      setProfile(null)
      clearWatchSelection()
      setShowUploadModal(false)
      setShowAuthModal(false)
      clearSectionData()
      loadVideos(search)
    }
  }, [clearSectionData, clearWatchSelection, dispatch, loadVideos, search, setStatus, token])

  const openChannelProfile = useCallback(async ({ username, ownerId, title }) => {
    if (!username) return

    if (!isAuthed || !token) {
      requireAuth("Sign in to view channel pages")
      return
    }

    setLoadingFeed(true)
    setStatus("")
    setAppActiveSection("channel")
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
  }, [clearSectionData, isAuthed, requireAuth, setAppActiveSection, setSectionTitle, setStatus, token])

  const runSectionLoad = useCallback(async (section) => {
    if (protectedSections.has(section) && (!isAuthed || !token)) {
      requireAuth("Please sign in to access this section")
      return
    }

    setLoadingFeed(true)
    setStatus("")
    clearWatchSelection()
    setAppActiveSection(section)
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
  }, [
    clearSectionData,
    clearWatchSelection,
    isAuthed,
    loadVideos,
    requireAuth,
    setAppActiveSection,
    setSearch,
    setSectionTitle,
    setStatus,
    token,
    user
  ])

  const onNavSelect = useCallback(async (section) => {
    await runSectionLoad(section)
  }, [runSectionLoad])

  useEffect(() => {
    if (hasBootstrappedSectionRef.current) return

    hasBootstrappedSectionRef.current = true
    void runSectionLoad(activeSection || "home")
  }, [activeSection, runSectionLoad])

  const onSearchSubmit = useCallback(async (event) => {
    event.preventDefault()
    setActiveChip("All")
    setAppActiveSection("home")
    setSectionTitle(search ? `Search: ${search}` : "Home")
    clearSectionData()
    await loadVideos(search)
  }, [clearSectionData, loadVideos, search, setAppActiveSection, setSectionTitle])

  const onCategorySelect = useCallback(async (chip) => {
    setActiveChip(chip)
    const query = chip === "All" ? "" : chip
    setSearch(query)
    setAppActiveSection("home")
    setSectionTitle(chip === "All" ? "Home" : `Category: ${chip}`)
    clearSectionData()
    await loadVideos(query)
  }, [clearSectionData, loadVideos, setAppActiveSection, setSearch, setSectionTitle])

  const loadVideoById = useCallback(async (videoId, options = {}) => {
    const { forceRefresh = false, updateNavigation = true } = options

    if (!videoId) return
    setStatus("")

    const hasCachedBundle = Boolean(!forceRefresh && getCachedVideoBundle(videoId))

    if (!hasCachedBundle) {
      setLoadingDetails(true)
    }

    try {
      const bundle = await fetchVideoBundle(videoId, { forceRefresh })

      if (!bundle?.video) {
        throw new Error("Unable to load video details")
      }

      setSelectedVideo(bundle.video)
      setVideoComments(bundle.comments || [])
      setCommentDraft("")

      if (updateNavigation) {
        const truncatedStack = watchStackRef.current.slice(0, watchIndexRef.current + 1)

        if (truncatedStack[truncatedStack.length - 1] !== videoId) {
          truncatedStack.push(videoId)
        }

        watchStackRef.current = truncatedStack
        watchIndexRef.current = watchStackRef.current.lastIndexOf(videoId)
      }

      syncWatchNavigationState()

      return true
    } catch (error) {
      setStatus(error.message)
      return false
    } finally {
      setLoadingDetails(false)
    }
  }, [fetchVideoBundle, getCachedVideoBundle, syncWatchNavigationState])

  const prefetchVideoById = useCallback(async (videoId) => {
    if (!videoId || selectedVideo?._id === videoId) return

    try {
      await fetchVideoBundle(videoId)
    } catch {
      // Ignore prefetch failures; the explicit open action will handle errors.
    }
  }, [fetchVideoBundle, selectedVideo?._id])

  const onWatchBack = useCallback(async () => {
    if (watchIndexRef.current <= 0) return

    const previousIndex = watchIndexRef.current
    const nextIndex = previousIndex - 1
    const targetVideoId = watchStackRef.current[nextIndex]

    if (!targetVideoId) return

    watchIndexRef.current = nextIndex
    syncWatchNavigationState()

    const loaded = await loadVideoById(targetVideoId, { updateNavigation: false })

    if (!loaded) {
      watchIndexRef.current = previousIndex
      syncWatchNavigationState()
    }
  }, [loadVideoById, syncWatchNavigationState])

  const onWatchForward = useCallback(async () => {
    if (watchIndexRef.current >= watchStackRef.current.length - 1) return

    const previousIndex = watchIndexRef.current
    const nextIndex = previousIndex + 1
    const targetVideoId = watchStackRef.current[nextIndex]

    if (!targetVideoId) return

    watchIndexRef.current = nextIndex
    syncWatchNavigationState()

    const loaded = await loadVideoById(targetVideoId, { updateNavigation: false })

    if (!loaded) {
      watchIndexRef.current = previousIndex
      syncWatchNavigationState()
    }
  }, [loadVideoById, syncWatchNavigationState])

  const onDeleteVideo = useCallback(async (videoId) => {
    const targetVideoId = videoId || selectedVideo?._id
    if (!targetVideoId) return

    if (!isAuthed || !token) {
      requireAuth("Please sign in before deleting videos")
      return
    }

    const selectedVideoOwnerId = selectedVideo?._id === targetVideoId
      ? selectedVideo?.owner?._id
      : null
    const listVideoOwnerId = videos.find((video) => video?._id === targetVideoId)?.owner?._id
    const ownerId = selectedVideoOwnerId || listVideoOwnerId

    if (ownerId && ownerId !== user?._id) {
      setStatus("You can only delete your own videos")
      return
    }

    setBusyDelete(true)
    setStatus("")

    try {
      const response = await deleteVideoById(targetVideoId, token)

      setVideos((prev) => prev.filter((video) => video._id !== targetVideoId))
      videoBundleCacheRef.current.delete(targetVideoId)
      pendingVideoBundleRef.current.delete(targetVideoId)

      watchStackRef.current = watchStackRef.current.filter((id) => id !== targetVideoId)
      watchIndexRef.current = watchStackRef.current.length - 1
      syncWatchNavigationState()

      if (selectedVideo?._id === targetVideoId) {
        const fallbackVideoId = watchStackRef.current[watchIndexRef.current]

        if (fallbackVideoId) {
          await loadVideoById(fallbackVideoId, { updateNavigation: false })
        } else {
          clearWatchSelection()
        }
      }

      setStatus(response?.message || "Video deleted successfully")
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyDelete(false)
    }
  }, [clearWatchSelection, isAuthed, loadVideoById, requireAuth, selectedVideo, syncWatchNavigationState, token, user?._id, videos])

  const onToggleVideoLike = useCallback(async () => {
    if (!selectedVideo?._id) return

    if (!isAuthed || !token) {
      requireAuth("Please sign in to like or dislike videos")
      return
    }

    setBusyReaction(true)
    setStatus("")

    try {
      const response = await toggleVideoLikeReaction(selectedVideo._id, token)
      const payload = response?.data || {}

      setSelectedVideo((prev) => {
        if (!prev) return prev

        const nextVideo = {
          ...prev,
          isLiked: Boolean(payload.liked),
          isDisliked: Boolean(payload.disliked),
          likesCount: payload.likesCount ?? prev.likesCount ?? 0,
          dislikesCount: payload.dislikesCount ?? prev.dislikesCount ?? 0
        }

        const cachedBundle = videoBundleCacheRef.current.get(prev._id)
        if (cachedBundle) {
          cacheVideoBundle(prev._id, {
            video: nextVideo,
            comments: cachedBundle.comments
          })
        }

        return nextVideo
      })
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyReaction(false)
    }
  }, [cacheVideoBundle, isAuthed, requireAuth, selectedVideo, token])

  const onToggleVideoDislike = useCallback(async () => {
    if (!selectedVideo?._id) return

    if (!isAuthed || !token) {
      requireAuth("Please sign in to like or dislike videos")
      return
    }

    setBusyReaction(true)
    setStatus("")

    try {
      const response = await toggleVideoDislikeReaction(selectedVideo._id, token)
      const payload = response?.data || {}

      setSelectedVideo((prev) => {
        if (!prev) return prev

        const nextVideo = {
          ...prev,
          isLiked: Boolean(payload.liked),
          isDisliked: Boolean(payload.disliked),
          likesCount: payload.likesCount ?? prev.likesCount ?? 0,
          dislikesCount: payload.dislikesCount ?? prev.dislikesCount ?? 0
        }

        const cachedBundle = videoBundleCacheRef.current.get(prev._id)
        if (cachedBundle) {
          cacheVideoBundle(prev._id, {
            video: nextVideo,
            comments: cachedBundle.comments
          })
        }

        return nextVideo
      })
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyReaction(false)
    }
  }, [cacheVideoBundle, isAuthed, requireAuth, selectedVideo, token])

  const onCommentSubmit = useCallback(async (event) => {
    event.preventDefault()

    if (!selectedVideo?._id) return

    if (!isAuthed || !token) {
      requireAuth("Please sign in to comment")
      return
    }

    const trimmedComment = commentDraft.trim()
    if (!trimmedComment) {
      setStatus("Please write a comment before posting")
      return
    }

    setBusyComment(true)
    setStatus("")

    try {
      const response = await createVideoComment(selectedVideo._id, trimmedComment, token)
      const createdComment = response?.data

      if (createdComment) {
        setVideoComments((prev) => {
          const nextComments = [createdComment, ...prev]

          if (selectedVideo?._id) {
            const cachedBundle = videoBundleCacheRef.current.get(selectedVideo._id)
            if (cachedBundle?.video) {
              cacheVideoBundle(selectedVideo._id, {
                video: cachedBundle.video,
                comments: nextComments
              })
            }
          }

          return nextComments
        })

        setSelectedVideo((prev) => {
          if (!prev) return prev

          const nextVideo = {
            ...prev,
            commentsCount: (prev.commentsCount || 0) + 1
          }

          const cachedBundle = videoBundleCacheRef.current.get(prev._id)
          if (cachedBundle) {
            cacheVideoBundle(prev._id, {
              video: nextVideo,
              comments: cachedBundle.comments
            })
          }

          return nextVideo
        })
      }

      setCommentDraft("")
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyComment(false)
    }
  }, [cacheVideoBundle, commentDraft, isAuthed, requireAuth, selectedVideo, token])

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
      setAppActiveSection("home")
      setSectionTitle("Home")
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyUpload(false)
    }
  }, [isAuthed, loadVideos, search, setAppActiveSection, setSectionTitle, token, uploadForm])

  const onEditSubmit = useCallback(async (event) => {
    event.preventDefault()

    const targetVideoId = selectedVideo?._id
    if (!targetVideoId) return

    if (!isAuthed || !token) {
      requireAuth("Please sign in before editing videos")
      return
    }

    const selectedVideoOwnerId = selectedVideo?.owner?._id || selectedVideo?.owner
    if (selectedVideoOwnerId && selectedVideoOwnerId !== user?._id) {
      setStatus("You can only edit your own videos")
      return
    }

    setBusyEdit(true)
    setStatus("")

    try {
      const formData = new FormData()
      formData.append("title", editVideoForm.title)
      formData.append("description", editVideoForm.description)

      if (editVideoForm.thumbnail) formData.append("thumbnail", editVideoForm.thumbnail)

      const response = await updateVideoById(targetVideoId, formData, token)
      const updatedVideo = response?.data || null

      if (updatedVideo) {
        setVideos((prev) => prev.map((video) => (video._id === targetVideoId ? { ...video, ...updatedVideo } : video)))
        setSelectedVideo((prev) => (prev?._id === targetVideoId ? { ...prev, ...updatedVideo } : prev))
        videoBundleCacheRef.current.set(targetVideoId, {
          video: { ...(selectedVideo || {}), ...updatedVideo },
          comments: videoComments,
          cachedAt: Date.now()
        })
        await loadVideoById(targetVideoId, { forceRefresh: true, updateNavigation: false })
      }

      setShowEditModal(false)
      setStatus(response?.message || "Video updated successfully")
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusyEdit(false)
    }
  }, [editVideoForm, isAuthed, loadVideoById, requireAuth, selectedVideo, token, user?._id, videoComments])

  const onToggleSubscription = useCallback(async () => {
    const channelId = selectedVideo?.owner?._id || selectedVideo?.owner
    if (!channelId) return

    if (!isAuthed || !token) {
      requireAuth("Please sign in to subscribe to channels")
      return
    }

    if (channelId === user?._id) {
      setStatus("You cannot subscribe to your own channel")
      return
    }

    setBusySubscription(true)
    setStatus("")

    try {
      const response = await toggleSubscription(channelId, token)
      const subscribed = Boolean(response?.data?.subscribed)

      setSubscribedChannels((prev) => {
        if (subscribed) {
          const currentChannel = selectedVideo?.owner
          const channelEntry = currentChannel?._id ? { channel: currentChannel } : null
          if (!channelEntry) return prev
          return [
            { _id: `local-${channelId}`, channel: currentChannel },
            ...prev.filter((item) => item?.channel?._id !== channelId)
          ]
        }

        return prev.filter((item) => item?.channel?._id !== channelId)
      })

      setStatus(response?.message || (subscribed ? "Subscribed" : "Unsubscribed"))
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusySubscription(false)
    }
  }, [isAuthed, requireAuth, selectedVideo, setStatus, token, user?._id])

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

  const openEditModal = useCallback(() => {
    if (!selectedVideo?._id) return

    if (!isAuthed) {
      requireAuth("Please sign in before editing videos")
      return
    }

    const selectedVideoOwnerId = selectedVideo?.owner?._id || selectedVideo?.owner
    if (selectedVideoOwnerId && selectedVideoOwnerId !== user?._id) {
      setStatus("You can only edit your own videos")
      return
    }

    setEditVideoForm({
      title: selectedVideo.title || "",
      description: selectedVideo.description || "",
      thumbnail: null
    })
    setShowEditModal(true)
  }, [isAuthed, requireAuth, selectedVideo, setStatus, user?._id])

  const closeEditModal = useCallback(() => {
    setShowEditModal(false)
  }, [])

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
    busyComment,
    busyDelete,
    busyEdit,
    busySubscription,
    busyReaction,
    busyUpload,
    canGoWatchBack,
    canGoWatchForward,
    categorySearch: search,
    channelHandle,
    channelInitials,
    channelName,
    channelProfile,
    closeAuthModal,
    closeEditModal,
    closeUploadModal,
    commentDraft,
    dashboardStats,
    formatViews,
    isAuthed,
    loadingDetails,
    loadingFeed,
    loginForm,
    mode,
    onCategorySelect,
    onCommentSubmit,
    onDeleteVideo,
    onEditSubmit,
    onEditVideo: openEditModal,
    onLoginSubmit,
    onLogout,
    onNavSelect,
    onOwnerClick,
    onRegisterSubmit,
    onSearchSubmit,
    onToggleSubscription,
    onToggleVideoDislike,
    onToggleVideoLike,
    onUploadSubmit,
    onWatchBack,
    onWatchForward,
    openAuthModal,
    openUploadModal,
    playlists,
    profile,
    registerForm,
    search,
    sectionTitle,
    selectedVideo,
    editVideoForm,
    prefetchVideoById,
    setLoginForm,
    setEditVideoForm,
    setRegisterForm,
    setCommentDraft,
    setSearch,
    setUploadForm,
    showAuthModal,
    showEditModal,
    showUploadModal,
    status,
    subscribedChannels,
    toggleAuthMode,
    uploadForm,
    user,
    videoComments,
    videos,
    loadVideoById
  }
}
