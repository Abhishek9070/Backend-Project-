import ModalShell from "../common/ModalShell"

function EditVideoModal({ busyEdit, isAuthed, onClose, onEditSubmit, setEditVideoForm, editVideoForm }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="panel-head">
        <h2>Edit video</h2>
        <button type="button" className="tiny-link" onClick={onClose}>
          Close
        </button>
      </div>

      <form className="stack" onSubmit={onEditSubmit}>
        <input
          value={editVideoForm.title}
          onChange={(event) => setEditVideoForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Video title"
          required
        />
        <textarea
          value={editVideoForm.description}
          onChange={(event) => setEditVideoForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
          rows={3}
          required
        />
        <label className="file-input">
          Thumbnail
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setEditVideoForm((prev) => ({
                ...prev,
                thumbnail: event.target.files?.[0] || null
              }))
            }
          />
        </label>
        <button className="primary-btn" disabled={busyEdit || !isAuthed} type="submit">
          {busyEdit ? "Saving..." : "Save changes"}
        </button>
      </form>
    </ModalShell>
  )
}

export default EditVideoModal