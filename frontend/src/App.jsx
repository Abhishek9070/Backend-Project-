import StatusLine from "./components/common/StatusLine"
import CategoryChips from "./components/feed/CategoryChips"
import SectionOverview from "./components/feed/SectionOverview"
import VideoGrid from "./components/feed/VideoGrid"
import WatchSpotlight from "./components/feed/WatchSpotlight"
import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"
import AuthModal from "./components/modals/AuthModal"
import UploadModal from "./components/modals/UploadModal"
import { categoryChips, sidebarLibrary, sidebarPrimary } from "./features/home/constants"
import { useHomeController } from "./features/home/useHomeController"

function App() {
  const {
    activeChip,
    activeSection,
    busyAuth,
    busyUpload,
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
    loadVideoById,
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
    videos
  } = useHomeController()

  return (
    <div className="yt-shell">
      <Topbar
        channelHandle={channelHandle}
        channelInitials={channelInitials}
        channelName={channelName}
        isAuthed={isAuthed}
        onLogout={onLogout}
        onOpenAuth={() => openAuthModal("login")}
        onOpenProfile={() => onNavSelect("profile")}
        onOpenUpload={openUploadModal}
        onSearchSubmit={onSearchSubmit}
        search={search}
        setSearch={setSearch}
      />

      <div className="yt-layout">
        <Sidebar
          activeSection={activeSection}
          libraryItems={sidebarLibrary}
          onSelect={onNavSelect}
          primaryItems={sidebarPrimary}
        />

        <main className="yt-content">
          <CategoryChips activeChip={activeChip} chips={categoryChips} onSelect={onCategorySelect} />

          <StatusLine message={status} />

          <SectionOverview
            channelProfile={channelProfile}
            dashboardStats={dashboardStats}
            formatViews={formatViews}
            onOpenChannel={onOwnerClick}
            playlists={playlists}
            sectionTitle={sectionTitle}
            subscribedChannels={subscribedChannels}
          />

          <WatchSpotlight formatViews={formatViews} selectedVideo={selectedVideo} />

          {loadingFeed ? <p className="loading-note">Loading videos...</p> : null}

          <VideoGrid formatViews={formatViews} onOpenVideo={loadVideoById} onOwnerClick={onOwnerClick} videos={videos} />

          {!loadingFeed && videos.length === 0 && playlists.length === 0 ? (
            <p className="loading-note">No videos found for this section.</p>
          ) : null}

          {loadingDetails ? <p className="loading-note">Loading selected video...</p> : null}
        </main>
      </div>

      {showAuthModal ? (
        <AuthModal
          busyAuth={busyAuth}
          loginForm={loginForm}
          mode={mode}
          onClose={closeAuthModal}
          onLoginSubmit={onLoginSubmit}
          onRegisterSubmit={onRegisterSubmit}
          registerForm={registerForm}
          setLoginForm={setLoginForm}
          setRegisterForm={setRegisterForm}
          toggleMode={toggleAuthMode}
        />
      ) : null}

      {showUploadModal ? (
        <UploadModal
          busyUpload={busyUpload}
          isAuthed={isAuthed}
          onClose={closeUploadModal}
          onUploadSubmit={onUploadSubmit}
          setUploadForm={setUploadForm}
          uploadForm={uploadForm}
        />
      ) : null}
    </div>
  )
}

export default App
