import { apiRequest } from "./client"

export const fetchChannelStats = (token) =>
  apiRequest("/dashboard/stats", {
    method: "GET",
    token
  })

export const fetchChannelVideos = (token) =>
  apiRequest("/dashboard/videos", {
    method: "GET",
    token
  })
