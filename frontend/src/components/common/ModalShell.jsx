function ModalShell({ children, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="panel modal-shell" onClick={(event) => event.stopPropagation()}>
        {children}
      </article>
    </div>
  )
}

export default ModalShell
