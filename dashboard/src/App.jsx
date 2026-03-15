import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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

const buildDefaultPageContent = (game = {}) => ({
  hero: {
    title: game.title || "",
    description: game.shortDescription || game.description || "",
    buttonText: "Drift Now",
  },
  video: {
    src: "",
    poster: game.bannerImage || game.image || "",
  },
  about: {
    heading: "The Game",
    paragraphs: [game.description || "", ""],
    bullets: ["Immersive Gameplay", "High-Quality Graphics", "Ongoing Updates", "Cross-Platform Experience"],
  },
  media: [],
  faq: [],
  dlc: [],
  cta: {
    lines: ["Join", "The", "Drift"],
    buttonText: "Buy now",
    systemRequirementsTitle: "SYSTEM REQUIREMENTS",
    backgroundImage: "",
  },
  systemRequirements: {
    minimumTitle: "Minimum System Requirements",
    minimum: ["CPU:", "RAM:", "OS:", "VIDEO CARD:", "FREE DISK SPACE:"],
    recommendedTitle: "Recommended System Requirements",
    recommended: ["CPU:", "RAM:", "OS:", "VIDEO CARD:", "FREE DISK SPACE:"],
  },
  newsletter: {
    heading: "Newsletter",
    subHeading: "Join the newsletter to get the latest updates on the game.",
    consentText: "I agree to receive newsletters and accept the Privacy Policy.",
    infoText: "You can unsubscribe at any time using the link in our emails.",
    buttonText: "Subscribe",
  },
  footer: {
    logo: game.logo || "",
    ageRatingImage: "",
    copyrightText: "",
  },
})

const defaultGameForm = {
  title: "",
  description: "",
  shortDescription: "",
  image: "",
  imageFileId: "",
  thumbnail: "",
  thumbnailFileId: "",
  logo: "",
  logoFileId: "",
  bannerImage: "",
  bannerFileId: "",
  galleryImages: [],
  category: "Action",
  platforms: [],
  links: { ...defaultLinks },
  trailerUrl: "",
  trailerFileId: "",
  pageContent: buildDefaultPageContent(),
  featured: false,
  isNewRelease: true,
  isActive: true,
  order: 0,
}

const defaultPlatformForm = {
  TikTok: "",
  Rednote: "",
  YouTube: "https://www.youtube.com/user/RababaGames/",
  Facebook: "https://www.facebook.com/rababagames/",
  Instagram: "https://www.instagram.com/rababagames/",
  Twitter: "https://twitter.com/rababagames/",
  Twitch: "",
  Kick: "",
  LinkedIn: "",
  Discord: "",
  Reddit: "",
}

const defaultMediaItem = {
  title: "",
  url: "",
  thumbnail: "",
  alt: "",
}

const defaultFaqItem = {
  question: "",
  answer: "",
}

const defaultDlcItem = {
  title: "",
  url: "",
  image: "",
  alt: "",
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
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([])
  const [gameForm, setGameForm] = useState(defaultGameForm)
  const [pageContentRaw, setPageContentRaw] = useState(JSON.stringify(buildDefaultPageContent(), null, 2))
  const [contentEditorMode, setContentEditorMode] = useState("visual")
  const [editingGameId, setEditingGameId] = useState("")

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const refreshFailedRef = useRef(false)

  const isLoggedIn = useMemo(() => Boolean(token), [token])

  const clearFeedback = () => {
    setMessage("")
    setError("")
  }

  const extractGameIdFromSourcePage = (sourcePage) => {
    if (!sourcePage) {
      return ""
    }

    try {
      const url = new URL(sourcePage)
      return (url.searchParams.get("id") || "").trim()
    } catch {
      return ""
    }
  }

  const getNewsletterSourceLabel = (subscriber) => {
    if (subscriber?.subscribedGame && String(subscriber.subscribedGame).trim() !== "") {
      return subscriber.subscribedGame
    }

    const subscribedGameId = String(subscriber?.subscribedGameId || extractGameIdFromSourcePage(subscriber?.sourcePage || "") || "").trim()
    if (subscribedGameId) {
      const matchedGame = games.find((game) => String(game?._id || "") === subscribedGameId)
      if (matchedGame?.title) {
        return matchedGame.title
      }
    }

    const sourcePage = String(subscriber?.sourcePage || "")
    if (sourcePage.includes('/site/index.html') || sourcePage.endsWith('/site/') || sourcePage.endsWith('/site')) {
      return 'Main Page'
    }

    return '-'
  }

  const apiFetch = useCallback(
    async (path, options = {}, forceWithoutAuth = false) => {
      const headers = {
        ...(options.headers || {}),
      }

      if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json"
      }

      if (token && !forceWithoutAuth) {
        headers.Authorization = `Bearer ${token}`
      }

      let res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      })

      if (res.status === 401 && refreshToken && !forceWithoutAuth && !refreshFailedRef.current) {
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshRes.ok) {
          const refreshed = await refreshRes.json()
          const nextToken = refreshed?.token || ""
          const nextRefresh = refreshed?.refreshToken || ""
          refreshFailedRef.current = false
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
        } else {
          refreshFailedRef.current = true
          setToken("")
          setRefreshToken("")
          localStorage.removeItem("adminToken")
          localStorage.removeItem("refreshToken")
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
      const [gamesData, linksData, contactsData, newsletterData] = await Promise.all([
        apiFetch("/api/games/admin/all"),
        apiFetch("/api/platform-links"),
        apiFetch("/api/contact/admin/all"),
        apiFetch("/api/newsletter/admin/all"),
      ])

      setGames(Array.isArray(gamesData) ? gamesData : [])
      setPlatformLinks({ ...defaultPlatformForm, ...(linksData || {}) })
      setContactMessages(Array.isArray(contactsData) ? contactsData : [])
      setNewsletterSubscribers(Array.isArray(newsletterData) ? newsletterData : [])
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
      refreshFailedRef.current = false

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
      refreshFailedRef.current = false
      localStorage.removeItem("adminToken")
      localStorage.removeItem("refreshToken")
      setGames([])
      setContactMessages([])
      setNewsletterSubscribers([])
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

  const mergePageContent = useCallback((rawText) => {
    const base = buildDefaultPageContent(gameForm)
    let parsed = {}

    try {
      parsed = rawText?.trim() ? JSON.parse(rawText) : {}
    } catch {
      return base
    }

    return {
      ...base,
      ...parsed,
      hero: { ...base.hero, ...(parsed.hero || {}) },
      video: { ...base.video, ...(parsed.video || {}) },
      about: { ...base.about, ...(parsed.about || {}) },
      cta: { ...base.cta, ...(parsed.cta || {}) },
      systemRequirements: { ...base.systemRequirements, ...(parsed.systemRequirements || {}) },
      newsletter: { ...base.newsletter, ...(parsed.newsletter || {}) },
      footer: { ...base.footer, ...(parsed.footer || {}) },
      media: Array.isArray(parsed.media) ? parsed.media : base.media,
      faq: Array.isArray(parsed.faq) ? parsed.faq : base.faq,
      dlc: Array.isArray(parsed.dlc) ? parsed.dlc : base.dlc,
    }
  }, [gameForm])

  const pageContent = useMemo(() => mergePageContent(pageContentRaw), [mergePageContent, pageContentRaw])

  const updatePageContent = (updater) => {
    const current = mergePageContent(pageContentRaw)
    const clonedCurrent = JSON.parse(JSON.stringify(current))
    const next = typeof updater === "function" ? updater(clonedCurrent) : updater
    setPageContentRaw(JSON.stringify(next, null, 2))
  }

  const getNestedValue = (source, path) => path.reduce((acc, key) => acc?.[key], source)

  const setNestedValue = (source, path, value) => {
    const next = Array.isArray(source) ? [...source] : { ...source }
    let current = next

    for (let index = 0; index < path.length - 1; index += 1) {
      const key = path[index]
      const branch = current[key]
      current[key] = Array.isArray(branch) ? [...branch] : { ...(branch || {}) }
      current = current[key]
    }

    current[path[path.length - 1]] = value
    return next
  }

  const updatePageSectionField = (sectionKey, fieldKey, value) => {
    updatePageContent((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldKey]: value,
      },
    }))
  }

  const updatePageListFieldFromText = (sectionKey, fieldKey, text) => {
    const values = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    updatePageSectionField(sectionKey, fieldKey, values)
  }

  const updateArrayItem = (arrayKey, index, field, value) => {
    updatePageContent((prev) => {
      const next = Array.isArray(prev[arrayKey]) ? [...prev[arrayKey]] : []
      next[index] = { ...(next[index] || {}), [field]: value }
      return { ...prev, [arrayKey]: next }
    })
  }

  const addArrayItem = (arrayKey, template) => {
    updatePageContent((prev) => ({
      ...prev,
      [arrayKey]: [...(Array.isArray(prev[arrayKey]) ? prev[arrayKey] : []), JSON.parse(JSON.stringify(template))],
    }))
  }

  const removeArrayItem = (arrayKey, index) => {
    updatePageContent((prev) => ({
      ...prev,
      [arrayKey]: (Array.isArray(prev[arrayKey]) ? prev[arrayKey] : []).filter((_, i) => i !== index),
    }))
  }

  const listToText = (value) => (Array.isArray(value) ? value.join("\n") : "")

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
    setPageContentRaw(JSON.stringify(buildDefaultPageContent(), null, 2))
    setContentEditorMode("visual")
  }

  const deleteImageByFileId = async (fileId) => {
    if (!fileId) return
    try {
      await apiFetch(`/api/upload/image/${encodeURIComponent(fileId)}`, { method: "DELETE" })
    } catch {
      // Best effort cleanup only.
    }
  }

  const uploadSingleAsset = async (file, config) => {
    if (!file) return

    setUploading(config.loadingKey)
    clearFeedback()

    try {
      const previousFileId = gameForm[config.fileIdKey]
      const formData = new FormData()
      formData.append("image", file)
      formData.append("folder", config.folder)
      formData.append("fileNamePrefix", config.prefix)

      const uploaded = await apiFetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      setGameForm((prev) => ({
        ...prev,
        [config.urlKey]: uploaded.url || "",
        [config.fileIdKey]: uploaded.fileId || "",
      }))

      if (previousFileId && previousFileId !== uploaded.fileId) {
        await deleteImageByFileId(previousFileId)
      }

      setMessage(`${config.label} uploaded.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading("")
    }
  }

  const uploadGalleryAssets = async (files) => {
    if (!files || files.length === 0) return

    setUploading("gallery")
    clearFeedback()

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("images", file))
      formData.append("folder", "/games/gallery")
      formData.append("fileNamePrefix", "gallery")

      const uploads = await apiFetch("/api/upload/images", {
        method: "POST",
        body: formData,
      })

      const next = (Array.isArray(uploads) ? uploads : []).map((item) => ({
        url: item.url || "",
        fileId: item.fileId || "",
        name: item.name || "",
        thumbnailUrl: item.thumbnailUrl || "",
      }))

      setGameForm((prev) => ({
        ...prev,
        galleryImages: [...(prev.galleryImages || []), ...next],
      }))

      setMessage(`${next.length} gallery image(s) uploaded.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading("")
    }
  }

  const removeSingleAsset = async (urlKey, fileIdKey) => {
    const oldFileId = gameForm[fileIdKey]
    setGameForm((prev) => ({
      ...prev,
      [urlKey]: "",
      [fileIdKey]: "",
    }))
    await deleteImageByFileId(oldFileId)
  }

  const removeGalleryImage = async (index) => {
    const image = gameForm.galleryImages?.[index]
    if (!image) return

    setGameForm((prev) => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter((_, i) => i !== index),
    }))

    await deleteImageByFileId(image.fileId)
  }

  const uploadContentAsset = async (file, config) => {
    if (!file) return

    setUploading(config.loadingKey)
    clearFeedback()

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", config.folder)
      formData.append("fileNamePrefix", config.prefix)

      const uploaded = await apiFetch("/api/upload/asset", {
        method: "POST",
        body: formData,
      })

      updatePageContent((prev) => setNestedValue(prev, config.path, uploaded.url || ""))
      setMessage(`${config.label} uploaded.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading("")
    }
  }

  const renderUploadField = ({
    label,
    value,
    onChange,
    onUpload,
    accept,
    loadingKey,
    placeholder,
    rows,
    multiline = false,
    className = "",
  }) => {
    const field = multiline ? (
      <textarea rows={rows || 2} value={value} onChange={onChange} placeholder={placeholder} />
    ) : (
      <input value={value} onChange={onChange} placeholder={placeholder} />
    )

    return (
      <label className={className}>
        {label}
        <div className="admin-upload-field">
          {field}
          <input
            className="admin-file-picker"
            type="file"
            accept={accept}
            disabled={loading || uploading === loadingKey}
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
        </div>
      </label>
    )
  }

  const onSaveGame = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearFeedback()

    let parsedPageContent = {}
    try {
      parsedPageContent = pageContentRaw?.trim() ? JSON.parse(pageContentRaw) : {}
    } catch {
      setLoading(false)
      setError("Game Page Content JSON is invalid. Please fix it before saving.")
      return
    }

    const payload = {
      ...gameForm,
      galleryImages: (gameForm.galleryImages || []).filter((item) => item?.url),
      pageContent: parsedPageContent,
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
    const content = game?.pageContent && typeof game.pageContent === "object"
      ? game.pageContent
      : buildDefaultPageContent(game)

    setEditingGameId(game._id)
    setGameForm({
      ...defaultGameForm,
      ...game,
      pageContent: content,
      links: { ...defaultLinks, ...(game.links || {}) },
      platforms: Array.isArray(game.platforms) ? game.platforms : [],
    })
    setPageContentRaw(JSON.stringify(content, null, 2))
    setContentEditorMode("visual")
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
            <div className="admin-full-width">
              <p className="muted">Game Media</p>
              <div className="admin-media-grid">
                <div className="admin-media-card">
                  <div className="admin-media-title-row">
                    <strong>Main Image</strong>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      disabled={loading || uploading === "image"}
                      onChange={(e) => uploadSingleAsset(e.target.files?.[0], {
                        urlKey: "image",
                        fileIdKey: "imageFileId",
                        folder: "/games/main",
                        prefix: "main",
                        label: "Main image",
                        loadingKey: "image",
                      })}
                    />
                  </div>
                  <input
                    type="text"
                    value={gameForm.image}
                    onChange={(e) => updateGameField("image", e.target.value)}
                    placeholder="Main image URL"
                    required
                  />
                  {gameForm.image ? <img className="admin-media-preview" src={gameForm.image} alt="Main game" /> : null}
                  {gameForm.image ? (
                    <button className="btn admin-media-danger" type="button" onClick={() => removeSingleAsset("image", "imageFileId")}>Remove Main</button>
                  ) : null}
                </div>

                <div className="admin-media-card">
                  <div className="admin-media-title-row">
                    <strong>Thumbnail</strong>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      disabled={loading || uploading === "thumbnail"}
                      onChange={(e) => uploadSingleAsset(e.target.files?.[0], {
                        urlKey: "thumbnail",
                        fileIdKey: "thumbnailFileId",
                        folder: "/games/thumbnail",
                        prefix: "thumbnail",
                        label: "Thumbnail",
                        loadingKey: "thumbnail",
                      })}
                    />
                  </div>
                  <input
                    type="text"
                    value={gameForm.thumbnail}
                    onChange={(e) => updateGameField("thumbnail", e.target.value)}
                    placeholder="Thumbnail URL"
                  />
                  {gameForm.thumbnail ? <img className="admin-media-preview" src={gameForm.thumbnail} alt="Thumbnail" /> : null}
                  {gameForm.thumbnail ? (
                    <button className="btn admin-media-danger" type="button" onClick={() => removeSingleAsset("thumbnail", "thumbnailFileId")}>Remove Thumbnail</button>
                  ) : null}
                </div>

                <div className="admin-media-card">
                  <div className="admin-media-title-row">
                    <strong>Logo</strong>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      disabled={loading || uploading === "logo"}
                      onChange={(e) => uploadSingleAsset(e.target.files?.[0], {
                        urlKey: "logo",
                        fileIdKey: "logoFileId",
                        folder: "/games/logo",
                        prefix: "logo",
                        label: "Logo",
                        loadingKey: "logo",
                      })}
                    />
                  </div>
                  <input
                    type="text"
                    value={gameForm.logo}
                    onChange={(e) => updateGameField("logo", e.target.value)}
                    placeholder="Logo URL"
                  />
                  {gameForm.logo ? <img className="admin-media-preview" src={gameForm.logo} alt="Logo" /> : null}
                  {gameForm.logo ? (
                    <button className="btn admin-media-danger" type="button" onClick={() => removeSingleAsset("logo", "logoFileId")}>Remove Logo</button>
                  ) : null}
                </div>

                <div className="admin-media-card">
                  <div className="admin-media-title-row">
                    <strong>Hero Banner</strong>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      disabled={loading || uploading === "banner"}
                      onChange={(e) => uploadSingleAsset(e.target.files?.[0], {
                        urlKey: "bannerImage",
                        fileIdKey: "bannerFileId",
                        folder: "/games/banner",
                        prefix: "banner",
                        label: "Hero banner",
                        loadingKey: "banner",
                      })}
                    />
                  </div>
                  <input
                    type="text"
                    value={gameForm.bannerImage}
                    onChange={(e) => updateGameField("bannerImage", e.target.value)}
                    placeholder="Banner URL"
                  />
                  {gameForm.bannerImage ? <img className="admin-media-preview" src={gameForm.bannerImage} alt="Banner" /> : null}
                  {gameForm.bannerImage ? (
                    <button className="btn admin-media-danger" type="button" onClick={() => removeSingleAsset("bannerImage", "bannerFileId")}>Remove Banner</button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="admin-full-width admin-media-card">
              <div className="admin-media-title-row">
                <strong>Gallery Images</strong>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  disabled={loading || uploading === "gallery"}
                  onChange={(e) => uploadGalleryAssets(e.target.files)}
                />
              </div>
              <div className="admin-gallery-grid">
                {(gameForm.galleryImages || []).map((item, idx) => (
                  <div className="admin-gallery-item" key={`${item.url || "gallery"}-${idx}`}>
                    <img src={item.thumbnailUrl || item.url} alt={item.name || `Gallery ${idx + 1}`} className="admin-gallery-preview" />
                    <input
                      type="text"
                      value={item.url || ""}
                      onChange={(e) => {
                        const next = [...(gameForm.galleryImages || [])]
                        next[idx] = { ...next[idx], url: e.target.value }
                        updateGameField("galleryImages", next)
                      }}
                    />
                    <button className="btn admin-media-danger" type="button" onClick={() => removeGalleryImage(idx)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {renderUploadField({
              label: "Trailer Video",
              value: gameForm.trailerUrl,
              onChange: (e) => updateGameField("trailerUrl", e.target.value),
              onUpload: (file) => uploadSingleAsset(file, {
                urlKey: "trailerUrl",
                fileIdKey: "trailerFileId",
                folder: "/games/trailer",
                prefix: "trailer",
                label: "Trailer video",
                loadingKey: "trailer",
              }),
              accept: "video/mp4,video/webm,video/ogg,video/quicktime",
              loadingKey: "trailer",
              placeholder: "Trailer video URL",
            })}
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

            <div className="admin-full-width admin-media-card">
              <div className="admin-media-title-row">
                <strong>Game Page Content Editor</strong>
                <div className="admin-actions-row">
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setContentEditorMode("visual")}
                    disabled={contentEditorMode === "visual"}
                  >
                    Visual Mode
                  </button>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setContentEditorMode("json")}
                    disabled={contentEditorMode === "json"}
                  >
                    JSON Mode
                  </button>
                </div>
              </div>

              {contentEditorMode === "visual" ? (
                <div className="admin-content-editor-grid">
                  <div className="admin-content-section">
                    <h3>Hero</h3>
                    <label>
                      Hero Title
                      <input value={pageContent.hero?.title || ""} onChange={(e) => updatePageSectionField("hero", "title", e.target.value)} />
                    </label>
                    <label>
                      Hero Description
                      <textarea rows="3" value={pageContent.hero?.description || ""} onChange={(e) => updatePageSectionField("hero", "description", e.target.value)} />
                    </label>
                    <label>
                      Hero Button Text
                      <input value={pageContent.hero?.buttonText || ""} onChange={(e) => updatePageSectionField("hero", "buttonText", e.target.value)} />
                    </label>
                  </div>

                  <div className="admin-content-section">
                    <h3>Video</h3>
                    {renderUploadField({
                      label: "Video Source",
                      value: pageContent.video?.src || "",
                      onChange: (e) => updatePageSectionField("video", "src", e.target.value),
                      onUpload: (file) => uploadContentAsset(file, {
                        path: ["video", "src"],
                        folder: "/games/page/video",
                        prefix: "page-video",
                        label: "Page video",
                        loadingKey: "page-video",
                      }),
                      accept: "video/mp4,video/webm,video/ogg,video/quicktime",
                      loadingKey: "page-video",
                      placeholder: "Video file URL",
                    })}
                    {renderUploadField({
                      label: "Video Poster",
                      value: pageContent.video?.poster || "",
                      onChange: (e) => updatePageSectionField("video", "poster", e.target.value),
                      onUpload: (file) => uploadContentAsset(file, {
                        path: ["video", "poster"],
                        folder: "/games/page/video",
                        prefix: "video-poster",
                        label: "Video poster",
                        loadingKey: "video-poster",
                      }),
                      accept: "image/png,image/jpeg,image/gif,image/webp",
                      loadingKey: "video-poster",
                      placeholder: "Poster image URL",
                    })}
                  </div>

                  <div className="admin-content-section">
                    <h3>About</h3>
                    <label>
                      About Heading
                      <input value={pageContent.about?.heading || ""} onChange={(e) => updatePageSectionField("about", "heading", e.target.value)} />
                    </label>
                    <label>
                      About Paragraphs (one per line)
                      <textarea rows="4" value={listToText(pageContent.about?.paragraphs)} onChange={(e) => updatePageListFieldFromText("about", "paragraphs", e.target.value)} />
                    </label>
                    <label>
                      About Bullet Points (one per line)
                      <textarea rows="4" value={listToText(pageContent.about?.bullets)} onChange={(e) => updatePageListFieldFromText("about", "bullets", e.target.value)} />
                    </label>
                  </div>

                  <div className="admin-content-section admin-content-section-full">
                    <div className="admin-media-title-row">
                      <h3>Media Gallery</h3>
                      <button className="btn" type="button" onClick={() => addArrayItem("media", defaultMediaItem)}>Add Media</button>
                    </div>
                    {(Array.isArray(pageContent.media) ? pageContent.media : []).map((item, index) => (
                      <div className="admin-repeat-item" key={`media-${index}`}>
                        <div className="admin-media-title-row">
                          <strong>Media {index + 1}</strong>
                          <button className="btn admin-media-danger" type="button" onClick={() => removeArrayItem("media", index)}>Remove</button>
                        </div>
                        <div className="admin-form-grid">
                          <label>
                            Title
                            <input value={item.title || ""} onChange={(e) => updateArrayItem("media", index, "title", e.target.value)} />
                          </label>
                          {renderUploadField({
                            label: "Full Image",
                            value: item.url || "",
                            onChange: (e) => updateArrayItem("media", index, "url", e.target.value),
                            onUpload: (file) => uploadContentAsset(file, {
                              path: ["media", index, "url"],
                              folder: "/games/page/media",
                              prefix: `media-${index + 1}`,
                              label: `Media ${index + 1} image`,
                              loadingKey: `media-url-${index}`,
                            }),
                            accept: "image/png,image/jpeg,image/gif,image/webp",
                            loadingKey: `media-url-${index}`,
                            placeholder: "Full image URL",
                          })}
                          {renderUploadField({
                            label: "Thumbnail",
                            value: item.thumbnail || "",
                            onChange: (e) => updateArrayItem("media", index, "thumbnail", e.target.value),
                            onUpload: (file) => uploadContentAsset(file, {
                              path: ["media", index, "thumbnail"],
                              folder: "/games/page/media",
                              prefix: `media-thumb-${index + 1}`,
                              label: `Media ${index + 1} thumbnail`,
                              loadingKey: `media-thumb-${index}`,
                            }),
                            accept: "image/png,image/jpeg,image/gif,image/webp",
                            loadingKey: `media-thumb-${index}`,
                            placeholder: "Thumbnail URL",
                          })}
                          <label>
                            Alt Text
                            <input value={item.alt || ""} onChange={(e) => updateArrayItem("media", index, "alt", e.target.value)} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="admin-content-section admin-content-section-full">
                    <div className="admin-media-title-row">
                      <h3>FAQ</h3>
                      <button className="btn" type="button" onClick={() => addArrayItem("faq", defaultFaqItem)}>Add FAQ</button>
                    </div>
                    {(Array.isArray(pageContent.faq) ? pageContent.faq : []).map((item, index) => (
                      <div className="admin-repeat-item" key={`faq-${index}`}>
                        <div className="admin-media-title-row">
                          <strong>FAQ {index + 1}</strong>
                          <button className="btn admin-media-danger" type="button" onClick={() => removeArrayItem("faq", index)}>Remove</button>
                        </div>
                        <div className="admin-form-grid">
                          <label className="admin-full-width">
                            Question
                            <input value={item.question || ""} onChange={(e) => updateArrayItem("faq", index, "question", e.target.value)} />
                          </label>
                          <label className="admin-full-width">
                            Answer
                            <textarea rows="3" value={item.answer || ""} onChange={(e) => updateArrayItem("faq", index, "answer", e.target.value)} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="admin-content-section admin-content-section-full">
                    <div className="admin-media-title-row">
                      <h3>DLC</h3>
                      <button className="btn" type="button" onClick={() => addArrayItem("dlc", defaultDlcItem)}>Add DLC</button>
                    </div>
                    {(Array.isArray(pageContent.dlc) ? pageContent.dlc : []).map((item, index) => (
                      <div className="admin-repeat-item" key={`dlc-${index}`}>
                        <div className="admin-media-title-row">
                          <strong>DLC {index + 1}</strong>
                          <button className="btn admin-media-danger" type="button" onClick={() => removeArrayItem("dlc", index)}>Remove</button>
                        </div>
                        <div className="admin-form-grid">
                          <label>
                            DLC Title
                            <input value={item.title || ""} onChange={(e) => updateArrayItem("dlc", index, "title", e.target.value)} />
                          </label>
                          <label>
                            Store URL
                            <input value={item.url || ""} onChange={(e) => updateArrayItem("dlc", index, "url", e.target.value)} />
                          </label>
                          {renderUploadField({
                            label: "Image",
                            value: item.image || "",
                            onChange: (e) => updateArrayItem("dlc", index, "image", e.target.value),
                            onUpload: (file) => uploadContentAsset(file, {
                              path: ["dlc", index, "image"],
                              folder: "/games/page/dlc",
                              prefix: `dlc-${index + 1}`,
                              label: `DLC ${index + 1} image`,
                              loadingKey: `dlc-image-${index}`,
                            }),
                            accept: "image/png,image/jpeg,image/gif,image/webp",
                            loadingKey: `dlc-image-${index}`,
                            placeholder: "DLC image URL",
                          })}
                          <label>
                            Alt Text
                            <input value={item.alt || ""} onChange={(e) => updateArrayItem("dlc", index, "alt", e.target.value)} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="admin-content-section">
                    <h3>CTA</h3>
                    <label>
                      CTA Line 1
                      <input value={(pageContent.cta?.lines || [])[0] || ""} onChange={(e) => {
                        const lines = [...(pageContent.cta?.lines || ["", "", ""])]
                        lines[0] = e.target.value
                        updatePageSectionField("cta", "lines", lines)
                      }} />
                    </label>
                    <label>
                      CTA Line 2
                      <input value={(pageContent.cta?.lines || [])[1] || ""} onChange={(e) => {
                        const lines = [...(pageContent.cta?.lines || ["", "", ""])]
                        lines[1] = e.target.value
                        updatePageSectionField("cta", "lines", lines)
                      }} />
                    </label>
                    <label>
                      CTA Line 3
                      <input value={(pageContent.cta?.lines || [])[2] || ""} onChange={(e) => {
                        const lines = [...(pageContent.cta?.lines || ["", "", ""])]
                        lines[2] = e.target.value
                        updatePageSectionField("cta", "lines", lines)
                      }} />
                    </label>
                    <label>
                      Buy Button Text
                      <input value={pageContent.cta?.buttonText || ""} onChange={(e) => updatePageSectionField("cta", "buttonText", e.target.value)} />
                    </label>
                    <label>
                      System Requirements Modal Title
                      <input value={pageContent.cta?.systemRequirementsTitle || ""} onChange={(e) => updatePageSectionField("cta", "systemRequirementsTitle", e.target.value)} />
                    </label>
                    {renderUploadField({
                      label: "Section Background Image",
                      value: pageContent.cta?.backgroundImage || "",
                      onChange: (e) => updatePageSectionField("cta", "backgroundImage", e.target.value),
                      onUpload: (file) => uploadContentAsset(file, {
                        path: ["cta", "backgroundImage"],
                        folder: "/games/page/cta",
                        prefix: "cta-bg",
                        label: "CTA background",
                        loadingKey: "cta-bg",
                      }),
                      accept: "image/png,image/jpeg,image/gif,image/webp",
                      loadingKey: "cta-bg",
                      placeholder: "Background image URL",
                    })}
                  </div>

                  <div className="admin-content-section">
                    <h3>System Requirements</h3>
                    <label>
                      Minimum Title
                      <input value={pageContent.systemRequirements?.minimumTitle || ""} onChange={(e) => updatePageSectionField("systemRequirements", "minimumTitle", e.target.value)} />
                    </label>
                    <label>
                      Minimum List (one per line)
                      <textarea rows="5" value={listToText(pageContent.systemRequirements?.minimum)} onChange={(e) => updatePageListFieldFromText("systemRequirements", "minimum", e.target.value)} />
                    </label>
                    <label>
                      Recommended Title
                      <input value={pageContent.systemRequirements?.recommendedTitle || ""} onChange={(e) => updatePageSectionField("systemRequirements", "recommendedTitle", e.target.value)} />
                    </label>
                    <label>
                      Recommended List (one per line)
                      <textarea rows="5" value={listToText(pageContent.systemRequirements?.recommended)} onChange={(e) => updatePageListFieldFromText("systemRequirements", "recommended", e.target.value)} />
                    </label>
                  </div>

                  <div className="admin-content-section">
                    <h3>Newsletter</h3>
                    <label>
                      Heading
                      <input value={pageContent.newsletter?.heading || ""} onChange={(e) => updatePageSectionField("newsletter", "heading", e.target.value)} />
                    </label>
                    <label>
                      Sub Heading
                      <textarea rows="2" value={pageContent.newsletter?.subHeading || ""} onChange={(e) => updatePageSectionField("newsletter", "subHeading", e.target.value)} />
                    </label>
                    <label>
                      Consent Text
                      <textarea rows="2" value={pageContent.newsletter?.consentText || ""} onChange={(e) => updatePageSectionField("newsletter", "consentText", e.target.value)} />
                    </label>
                    <label>
                      Info Text
                      <textarea rows="2" value={pageContent.newsletter?.infoText || ""} onChange={(e) => updatePageSectionField("newsletter", "infoText", e.target.value)} />
                    </label>
                    <label>
                      Button Text
                      <input value={pageContent.newsletter?.buttonText || ""} onChange={(e) => updatePageSectionField("newsletter", "buttonText", e.target.value)} />
                    </label>
                  </div>

                  <div className="admin-content-section">
                    <h3>Footer</h3>
                    {renderUploadField({
                      label: "Footer Logo",
                      value: pageContent.footer?.logo || "",
                      onChange: (e) => updatePageSectionField("footer", "logo", e.target.value),
                      onUpload: (file) => uploadContentAsset(file, {
                        path: ["footer", "logo"],
                        folder: "/games/page/footer",
                        prefix: "footer-logo",
                        label: "Footer logo",
                        loadingKey: "footer-logo",
                      }),
                      accept: "image/png,image/jpeg,image/gif,image/webp",
                      loadingKey: "footer-logo",
                      placeholder: "Footer logo URL",
                    })}
                    {renderUploadField({
                      label: "Age Rating Image",
                      value: pageContent.footer?.ageRatingImage || "",
                      onChange: (e) => updatePageSectionField("footer", "ageRatingImage", e.target.value),
                      onUpload: (file) => uploadContentAsset(file, {
                        path: ["footer", "ageRatingImage"],
                        folder: "/games/page/footer",
                        prefix: "age-rating",
                        label: "Age rating image",
                        loadingKey: "age-rating",
                      }),
                      accept: "image/png,image/jpeg,image/gif,image/webp",
                      loadingKey: "age-rating",
                      placeholder: "Age rating image URL",
                    })}
                    <label>
                      Copyright Text
                      <input value={pageContent.footer?.copyrightText || ""} onChange={(e) => updatePageSectionField("footer", "copyrightText", e.target.value)} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="admin-full-width">
                  Game Page Content JSON (advanced mode)
                  <textarea
                    rows="24"
                    value={pageContentRaw}
                    onChange={(e) => setPageContentRaw(e.target.value)}
                    placeholder='{"hero":{"title":"..."}}'
                  />
                </label>
              )}
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
                  <th>Gallery</th>
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
                    <td>{Array.isArray(game.galleryImages) ? game.galleryImages.length : 0}</td>
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

        <div className="card">
          <h2>Newsletter Subscribers ({newsletterSubscribers.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Game</th>
                  <th>Consent</th>
                  <th>Source Page</th>
                  <th>Subscribed At</th>
                </tr>
              </thead>
              <tbody>
                {newsletterSubscribers.map((subscriber) => (
                  <tr key={subscriber._id}>
                    <td>{subscriber.email}</td>
                    <td>{getNewsletterSourceLabel(subscriber)}</td>
                    <td>{subscriber.consentGiven ? "Yes" : "No"}</td>
                    <td className="admin-message-cell">{subscriber.sourcePage || "-"}</td>
                    <td>{subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleString() : "-"}</td>
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
