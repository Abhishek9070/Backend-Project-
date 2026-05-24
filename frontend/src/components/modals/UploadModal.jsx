import ModalShell from "../common/ModalShell"

function UploadModal({ busyUpload, isAuthed, onClose, onUploadSubmit, setUploadForm, uploadForm, uploadProgress, uploadStage }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="panel-head">
        <h2>Upload</h2>
        <button type="button" className="tiny-link" onClick={onClose}>
          Close
        </button>
      </div>

      <form className="stack" onSubmit={onUploadSubmit}>
        <input
          value={uploadForm.title}
          onChange={(event) => setUploadForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Video title"
          required
        />
        <textarea
          value={uploadForm.description}
          onChange={(event) => setUploadForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
          rows={3}
          required
        />
        <label className="file-input">
          Video file
          <input
            type="file"
            accept="video/*"
            onChange={(event) =>
              setUploadForm((prev) => ({
                ...prev,
                videoFile: event.target.files?.[0] || null
              }))
            }
            required
          />
        </label>
        <label className="file-input">
          Thumbnail
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setUploadForm((prev) => ({
                ...prev,
                thumbnail: event.target.files?.[0] || null
              }))
            }
          />
        </label>
        {busyUpload ? (
          <div className="stack" aria-live="polite">
            <p className="loading-note">{uploadStage || "Uploading..."}</p>
            <progress max="100" value={uploadProgress} />
            <p className="loading-note">{uploadProgress}%</p>
          </div>
        ) : null}
        <button className="primary-btn" disabled={busyUpload || !isAuthed} type="submit">
          {busyUpload ? "Uploading..." : "Upload"}
        </button>
      </form>
    </ModalShell>
  )
}

export default UploadModal
