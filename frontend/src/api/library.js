import { apiRequest } from "./client"

export const fetchWatchHistory = (token) =>
  apiRequest("/users/watch-history", {
    method: "GET",
    token
  })

export const fetchLikedVideos = (token) =>
  apiRequest("/likes/videos", {
    method: "GET",
    token
  })

export const fetchMyPlaylists = (token) =>
  apiRequest("/playlists/me", {
    method: "GET",
    token
  })
