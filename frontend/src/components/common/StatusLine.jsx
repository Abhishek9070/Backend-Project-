function StatusLine({ message }) {
  if (!message) return null
  return <p className="status-line">{message}</p>
}

export default StatusLine
