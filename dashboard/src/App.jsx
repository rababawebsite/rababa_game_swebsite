import { useCallback, useEffect, useMemo, useState } from "react"

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "")

const categoryOptions = ["Simulation", "RPG", "Strategy", "Action", "Puzzle", "Adventure", "Sports", "Other"]

const platformOptions = [
  "Google Play (Android)",
  "App Store (Apple)",
  "Huawei Store",
  "Amazon App Store",
  "PS4/PS5",
  "XBOX",
  "Nintendo Switch 1/2",
  "Steam",
  "Epic Store",
]

const contactStatusOptions = ["new", "reviewed", "resolved"]

const defaultLinks = {
  googlePlay: "",
  appStore: "",
  huaweiStore: "",
  amazonAppStore: "",
  ps: "",
  xbox: "",
  nintendoSwitch: "",
  steam: "",
  epicStore: "",
}

const defaultGameForm = {
  title: "",
  description: "",
  shortDescription: "",
  image: "",
  thumbnail: "",
  category: "Action",
  platforms: [],
  links: { ...defaultLinks },
  trailerUrl: "",
  featured: false,
  isNewRelease: true,
  isActive: true,
  order: 0,
}

const defaultPlatformForm = {
  TikTok: "",
  Rednote: "",
  YouTube: "",
  Facebook: "",
  Instagram: "",
  Twitter: "",
  Twitch: "",
  Kick: "",
  LinkedIn: "",
  Discord: "",
  Reddit: "",
}

async function parseJson(res) {
  const isJson = res.headers.get("content-type")?.includes("application/json")
  return isJson ? res.json() : null
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "")
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken") || "")
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })

  const [games, setGames] = useState([])
  const [platformLinks, setPlatformLinks] = useState(defaultPlatformForm)
  const [contactMessages, setContactMessages] = useState([])
  const [gameForm, setGameForm] = useState(defaultGameForm)
  const [editingGameId, setEditingGameId] = useState("")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const isLoggedIn = useMemo(() => Boolean(token), [token])

  const clearFeedback = () => {
    setMessage("")
    setError("")
  }

  const apiFetch = useCallback(
    async (path, options = {}, forceWithoutAuth = false) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      }

      if (token && !forceWithoutAuth) {
        headers.Authorization = `Bearer ${token}`
      }

      let res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      })

      if (res.status === 401 && refreshToken && !forceWithoutAuth) {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshRes.ok) {
          const refreshed = await refreshRes.json()
          const nextToken = refreshed?.token || ""
          const nextRefresh = refreshed?.refreshToken || ""
          setToken(nextToken)
          setRefreshToken(nextRefresh)
          localStorage.setItem("adminToken", nextToken)
          localStorage.setItem("refreshToken", nextRefresh)

          res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${nextToken}`,
            },
          })
        }
      }

      const payload = await parseJson(res)

      if (!res.ok) {
        throw new Error(payload?.error || `Request failed with status ${res.status}`)
      }

      return payload
    },
    [token, refreshToken],
  )

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    clearFeedback()
    try {
      const [gamesData, linksData, contactsData] = await Promise.all([
        apiFetch("/api/games/admin/all"),
        apiFetch("/api/platform-links"),
        apiFetch("/api/contact/admin/all"),
      ])

      setGames(Array.isArray(gamesData) ? gamesData : [])
      setPlatformLinks({ ...defaultPlatformForm, ...(linksData || {}) })
      setContactMessages(Array.isArray(contactsData) ? contactsData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => {
    if (token) {
      loadDashboardData()
    }
  }, [token, loadDashboardData])

  const onLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearFeedback()
    try {
      const data = await apiFetch(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(loginForm),
        },
        true,
      )

      const nextToken = data?.token || ""
      const nextRefresh = data?.refreshToken || ""

      setToken(nextToken)
      setRefreshToken(nextRefresh)
      localStorage.setItem("adminToken", nextToken)
      localStorage.setItem("refreshToken", nextRefresh)

      setMessage("Logged in successfully.")
      await loadDashboardData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onLogout = async () => {
    setLoading(true)
    clearFeedback()
    try {
      if (refreshToken) {
        await apiFetch(
          "/api/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          },
          true,
        )
      }
    } catch {
      // Best effort logout
    } finally {
      setToken("")
      setRefreshToken("")
      localStorage.removeItem("adminToken")
      localStorage.removeItem("refreshToken")
      setGames([])
      setContactMessages([])
      setEditingGameId("")
      setGameForm(defaultGameForm)
      setLoading(false)
    }
  }

  const updateGameField = (key, value) => {
    setGameForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateGameLinkField = (key, value) => {
    setGameForm((prev) => ({
      ...prev,
      links: {
        ...prev.links,
        [key]: value,
      },
    }))
  }

  const togglePlatform = (platform) => {
    setGameForm((prev) => {
      const set = new Set(prev.platforms)
      if (set.has(platform)) {
        set.delete(platform)
      } else {
        set.add(platform)
      }
      return {
        ...prev,
        platforms: Array.from(set),
      }
    })
  }

  const resetGameForm = () => {
    setEditingGameId("")
    setGameForm(defaultGameForm)
  }

  const onSaveGame = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearFeedback()

    const payload = {
      ...gameForm,
      order: Number(gameForm.order) || 0,
    }

    const endpoint = editingGameId ? `/api/games/${editingGameId}` : "/api/games"
    const method = editingGameId ? "PUT" : "POST"

    try {
      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      })
      await loadDashboardData()
      setMessage(editingGameId ? "Game updated." : "Game created.")
      resetGameForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startEditGame = (game) => {
    setEditingGameId(game._id)
    setGameForm({
      ...defaultGameForm,
      ...game,
      links: { ...defaultLinks, ...(game.links || {}) },
      platforms: Array.isArray(game.platforms) ? game.platforms : [],
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const deleteGame = async (id) => {
    setLoading(true)
    clearFeedback()
    try {
      await apiFetch(`/api/games/${id}`, { method: "DELETE" })
      await loadDashboardData()
      setMessage("Game deleted.")
      if (editingGameId === id) resetGameForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleGameActive = async (id) => {
    setLoading(true)
    clearFeedback()
    try {
      await apiFetch(`/api/games/${id}/toggle-active`, { method: "PATCH" })
      await loadDashboardData()
      setMessage("Game status updated.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onSavePlatformLinks = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearFeedback()
    try {
      await apiFetch("/api/platform-links/update", {
        method: "POST",
        body: JSON.stringify(platformLinks),
      })
      setMessage("Platform links updated.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateContactStatus = async (id, status) => {
    setLoading(true)
    clearFeedback()
    try {
      await apiFetch(`/api/contact/admin/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      await loadDashboardData()
      setMessage("Contact status updated.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <section className="section">
        <div className="container card admin-auth-card">
          <h1>Dashboard Login</h1>
          <p className="muted">Authenticate as super admin to manage website data.</p>
          <form onSubmit={onLogin} className="admin-form-grid">
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </label>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          {error ? <p className="admin-error">{error}</p> : null}
          {message ? <p className="admin-message">{message}</p> : null}
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container admin-grid">
        <div className="card">
          <div className="admin-topbar">
            <div>
              <h1>Dashboard</h1>
              <p className="muted">Manage games, platform links, and contact messages.</p>
            </div>
            <div className="admin-actions-row">
              <button className="btn" type="button" onClick={loadDashboardData} disabled={loading}>
                Refresh
              </button>
              <button className="btn" type="button" onClick={onLogout} disabled={loading}>
                Logout
              </button>
            </div>
          </div>

          {error ? <p className="admin-error">{error}</p> : null}
          {message ? <p className="admin-message">{message}</p> : null}
        </div>

        <div className="card">
          <h2>{editingGameId ? "Edit Game" : "Create Game"}</h2>
          <form className="admin-form-grid" onSubmit={onSaveGame}>
            <label>
              Title
              <input type="text" value={gameForm.title} onChange={(e) => updateGameField("title", e.target.value)} required />
            </label>
            <label>
              Category
              <select value={gameForm.category} onChange={(e) => updateGameField("category", e.target.value)}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-full-width">
              Short Description
              <input
                type="text"
                value={gameForm.shortDescription}
                onChange={(e) => updateGameField("shortDescription", e.target.value)}
                required
              />
            </label>
            <label className="admin-full-width">
              Description
              <textarea rows="4" value={gameForm.description} onChange={(e) => updateGameField("description", e.target.value)} required />
            </label>
            <label>
              Image URL
              <input type="text" value={gameForm.image} onChange={(e) => updateGameField("image", e.target.value)} required />
            </label>
            <label>
              Thumbnail URL
              <input type="text" value={gameForm.thumbnail} onChange={(e) => updateGameField("thumbnail", e.target.value)} />
            </label>
            <label>
              Trailer URL
              <input type="text" value={gameForm.trailerUrl} onChange={(e) => updateGameField("trailerUrl", e.target.value)} />
            </label>
            <label>
              Order
              <input type="number" value={gameForm.order} onChange={(e) => updateGameField("order", e.target.value)} />
            </label>

            <div className="admin-full-width">
              <p className="muted">Platforms</p>
              <div className="admin-chip-grid">
                {platformOptions.map((platform) => (
                  <label key={platform} className="admin-chip">
                    <input
                      type="checkbox"
                      checked={gameForm.platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-full-width">
              <p className="muted">Store Links</p>
              <div className="admin-form-grid">
                {Object.keys(defaultLinks).map((key) => (
                  <label key={key}>
                    {key}
                    <input
                      type="text"
                      value={gameForm.links[key] || ""}
                      onChange={(e) => updateGameLinkField(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="admin-full-width admin-checks-row">
              <label>
                <input type="checkbox" checked={gameForm.featured} onChange={(e) => updateGameField("featured", e.target.checked)} />
                Featured
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={gameForm.isNewRelease}
                  onChange={(e) => updateGameField("isNewRelease", e.target.checked)}
                />
                New Release
              </label>
              <label>
                <input type="checkbox" checked={gameForm.isActive} onChange={(e) => updateGameField("isActive", e.target.checked)} />
                Active
              </label>
            </div>

            <div className="admin-actions-row admin-full-width">
              <button className="btn" type="submit" disabled={loading}>
                {editingGameId ? "Update Game" : "Create Game"}
              </button>
              <button className="btn" type="button" onClick={resetGameForm} disabled={loading}>
                Clear
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Games ({games.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game._id}>
                    <td>{game.title}</td>
                    <td>{game.category}</td>
                    <td>{game.isActive ? "Active" : "Inactive"}</td>
                    <td>{game.featured ? "Yes" : "No"}</td>
                    <td>
                      <div className="admin-actions-row">
                        <button className="btn" type="button" onClick={() => startEditGame(game)}>
                          Edit
                        </button>
                        <button className="btn" type="button" onClick={() => toggleGameActive(game._id)}>
                          Toggle
                        </button>
                        <button className="btn" type="button" onClick={() => deleteGame(game._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Platform Links</h2>
          <form className="admin-form-grid" onSubmit={onSavePlatformLinks}>
            {Object.keys(defaultPlatformForm).map((key) => (
              <label key={key}>
                {key}
                <input
                  type="text"
                  value={platformLinks[key] || ""}
                  onChange={(e) => setPlatformLinks((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </label>
            ))}
            <button className="btn admin-full-width" type="submit" disabled={loading}>
              Save Platform Links
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Contact Messages ({contactMessages.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {contactMessages.map((contact) => (
                  <tr key={contact._id}>
                    <td>{contact.name}</td>
                    <td>{contact.email}</td>
                    <td className="admin-message-cell">{contact.message}</td>
                    <td>{contact.status}</td>
                    <td>
                      <select value={contact.status} onChange={(e) => updateContactStatus(contact._id, e.target.value)}>
                        {contactStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
