import { apiRequest } from "./client"

export const fetchSubscribedChannels = (token) =>
  apiRequest("/subscriptions/me", {
    method: "GET",
    token
  })

export const toggleSubscription = (channelId, token) =>
  apiRequest(`/subscriptions/toggle/${channelId}`, {
    method: "POST",
    token
  })
