function CategoryChips({ activeChip, chips, onSelect }) {
  return (
    <section className="chip-row" aria-label="Categories">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          className={`chip ${activeChip === chip ? "active" : ""}`}
          onClick={() => onSelect(chip)}
        >
          {chip}
        </button>
      ))}
    </section>
  )
}

export default CategoryChips
