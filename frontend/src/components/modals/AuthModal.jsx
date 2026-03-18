import ModalShell from "../common/ModalShell"

function AuthModal({
  busyAuth,
  loginForm,
  mode,
  onClose,
  onLoginSubmit,
  onRegisterSubmit,
  registerForm,
  setLoginForm,
  setRegisterForm,
  toggleMode
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="panel-head">
        <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
        <button type="button" className="tiny-link" onClick={toggleMode}>
          {mode === "login" ? "Need an account?" : "Already registered?"}
        </button>
      </div>

      {mode === "register" ? (
        <form className="stack" onSubmit={onRegisterSubmit}>
          <input
            value={registerForm.username}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Username"
            required
          />
          <input
            value={registerForm.fullName}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder="Full Name"
            required
          />
          <input
            type="email"
            value={registerForm.email}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={registerForm.password}
            onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Password"
            required
          />

          <label className="file-input">
            Avatar
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setRegisterForm((prev) => ({
                  ...prev,
                  avatar: event.target.files?.[0] || null
                }))
              }
              required
            />
          </label>

          <label className="file-input">
            Cover Image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setRegisterForm((prev) => ({
                  ...prev,
                  coverImage: event.target.files?.[0] || null
                }))
              }
            />
          </label>

          <button className="primary-btn" disabled={busyAuth} type="submit">
            {busyAuth ? "Creating..." : "Create account"}
          </button>
        </form>
      ) : (
        <form className="stack" onSubmit={onLoginSubmit}>
          <input
            value={loginForm.username}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Username"
          />
          <input
            type="email"
            value={loginForm.email}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
          />
          <input
            type="password"
            value={loginForm.password}
            onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Password"
            required
          />
          <button className="primary-btn" disabled={busyAuth} type="submit">
            {busyAuth ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}
    </ModalShell>
  )
}

export default AuthModal
