function SidebarGroup({ activeSection, items, onSelect }) {
  return (
    <nav>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`side-link ${activeSection === item.key ? "active" : ""}`}
          onClick={() => onSelect(item.key)}
        >
          <span className="side-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function Sidebar({ activeSection, libraryItems, onSelect, primaryItems }) {
  return (
    <aside className="yt-sidebar">
      <SidebarGroup activeSection={activeSection} items={primaryItems} onSelect={onSelect} />
      <div className="side-divider" />
      <SidebarGroup activeSection={activeSection} items={libraryItems} onSelect={onSelect} />
    </aside>
  )
}

export default Sidebar
