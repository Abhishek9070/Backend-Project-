const sectionRoutes = {
  home: "/",
  shorts: "/shorts",
  subscriptions: "/subscriptions",
  profile: "/profile",
  history: "/history",
  playlists: "/playlists",
  liked: "/liked",
  dashboard: "/dashboard",
  channel: "/channel"
}

export const sectionToPath = (section) => sectionRoutes[section] || "/"

export const pathToSection = (pathname = "/") => {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/channel/")) return "channel"

  const match = Object.entries(sectionRoutes).find(([, path]) => path === pathname)
  return match ? match[0] : null
}

export const isKnownPath = (pathname = "/") => Boolean(pathToSection(pathname))
