import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, BadgeIndianRupee, BarChart3, Building2,
  Check, CheckCircle2, ChevronDown, CircleAlert, Clock3, Copy, Droplets, Eye, FileText, Filter,
  HeartHandshake, ImagePlus, Lightbulb, LocateFixed, Map, Menu, MessageSquareText,
  Plus, Search, Send, ShieldCheck, Sun, Moon, ThumbsUp, Trees, Trash2, TrendingUp, Wallet, Waves,
} from 'lucide-react'
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'
import {
  categories, createUserIssue, demoExpenses, demoIssues, localities, localityCoordinates, projects,
} from './data/demoData.js'
import { getSupportedIssueIds, toggleIssueSupport } from './services/supportRepository.js'

const navItems = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'report', label: 'Report an issue', icon: Plus },
  { id: 'track', label: 'Track complaint', icon: Search },
  { id: 'map', label: 'City issue map', icon: Map },
  { id: 'services', label: 'City services', icon: HeartHandshake },
  { id: 'funding', label: 'Funding & transparency', icon: Wallet },
  { id: 'analytics', label: 'City analytics', icon: BarChart3 },
]

const categoryIcons = {
  Roads: LocateFixed,
  Drainage: Waves,
  Garbage: Trash2,
  Streetlights: Lightbulb,
  'Water Supply': Droplets,
  Parks: Trees,
  Other: CircleAlert,
}

const statusLabel = (status) => status === 'In Progress' ? 'In progress' : status
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const formatCrore = (amount) => `₹${amount.toFixed(1)} Cr`
const formatCount = (count) => count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}K` : count
const displayTitle = (title) => title.trim() ? `${title.trim().charAt(0).toUpperCase()}${title.trim().slice(1)}` : title

function readSavedIssues() {
  try {
    const saved = window.localStorage.getItem('kdrishti-issues')
    if (!saved) return demoIssues
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed) || !parsed.every((issue) =>
      issue && typeof issue.id === 'string' && typeof issue.title === 'string' && categories.includes(issue.category),
    )) return demoIssues
    const savedIds = new Set(parsed.map((issue) => issue.id))
    const savedIssues = parsed.map((issue) => {
      const coordinates = Number.isFinite(issue.lat) && Number.isFinite(issue.lng)
        ? [issue.lat, issue.lng]
        : (localityCoordinates[issue.locality] || [26.4499, 80.3319])
      return {
      ...issue,
      supporters: Number.isInteger(issue.supporters) && issue.supporters >= 0 ? issue.supporters : 0,
      views: Number.isInteger(issue.views) && issue.views > (issue.supporters || 0) ? issue.views : (issue.supporters || 0) + 1,
      lat: coordinates[0],
      lng: coordinates[1],
      }
    })
    return [...savedIssues, ...demoIssues.filter((issue) => !savedIds.has(issue.id))]
  } catch {
    return demoIssues
  }
}

function Brand() {
  return (
    <div className="brand-lockup">
      <img className="sidebar-logo" src={`${import.meta.env.BASE_URL}kdrishti-sidebar-logo.png`} alt="K-Drishti" />
    </div>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button className="theme-toggle" type="button" onClick={onToggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{dark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(' ', '-')}`}><i />{statusLabel(status)}</span>
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  )
}

function SupportButton({ issue, supported, onToggle, compact = false }) {
  return (
    <button
      className={`support-button ${supported ? 'supported' : ''} ${compact ? 'compact' : ''}`}
      type="button"
      aria-pressed={supported}
      aria-label={`${supported ? 'Remove support from' : 'Support'} ${issue.title}`}
      onClick={(event) => { event.stopPropagation(); onToggle(issue.id) }}
    >
      <span className="support-icon" aria-hidden="true">{supported ? <Check size={13} /> : <ThumbsUp size={13} />}</span>
      {compact
        ? <span className="support-count">{formatCount(issue.supporters + (supported ? 1 : 0))}</span>
        : <span className="support-label">{supported ? 'Supported' : 'Support'}<b aria-hidden="true">·</b><span className="support-count">{formatCount(issue.supporters + (supported ? 1 : 0))}</span></span>}
    </button>
  )
}

function IssueRow({ issue, onTrack, supported, onToggleSupport }) {
  const CategoryIcon = categoryIcons[issue.category] || CircleAlert
  return (
    <div className="issue-row">
      <span className={`category-icon category-${issue.category.toLowerCase().replaceAll(' ', '-')}`}><CategoryIcon size={18} /></span>
      <span className="issue-row-main">
        <button className="issue-title-link" type="button" onClick={() => onTrack(issue.id)} aria-label={`Track ${issue.title}, ${issue.id}`}>        <strong>{displayTitle(issue.title)}</strong></button>
        <span>{issue.locality} <b>·</b> {issue.category} <b>·</b> {issue.department}</span>
        <small className="engagement-meta">{formatCount(issue.supporters + (supported ? 1 : 0))} supporters <b>·</b> {formatCount(issue.views)} views</small>
      </span>
      <span className={`priority-dot priority-${issue.priority.toLowerCase()}`} title={`${issue.priority} priority`} />
      <StatusBadge status={issue.status} />
      <span className="issue-date">{formatDate(issue.date)}</span>
      <SupportButton issue={issue} supported={supported} onToggle={onToggleSupport} compact />
    </div>
  )
}

function Overview({ issues, goTo, trackIssue, supportedIds, onToggleSupport }) {
  const resolved = issues.filter((issue) => issue.status === 'Resolved').length
  const pending = issues.length - resolved
  const recent = [...issues].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const stats = [
    { label: 'Issues reported', value: issues.length, change: '+12 this week', icon: MessageSquareText, color: 'teal' },
    { label: 'Issues resolved', value: resolved, change: `${Math.round((resolved / issues.length) * 100)}% resolution rate`, icon: CheckCircle2, color: 'green' },
    { label: 'Awaiting action', value: pending, change: 'Being reviewed by teams', icon: Clock3, color: 'amber' },
    { label: 'Active projects', value: projects.length, change: 'Across 5 civic areas', icon: Building2, color: 'blue' },
  ]
  return (
    <>
      <section className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-kicker"><span className="live-dot" /> KANPUR CIVIC CONNECT</div>
          <h1>A better city starts<br />with being heard.</h1>
          <p>Report a civic issue, follow its progress, and see how action is shaping Kanpur.</p>
          <div className="welcome-actions">
            <Button onClick={() => goTo('report')}>Report an issue <ArrowRight size={16} /></Button>
            <Button variant="light" onClick={() => goTo('track')}><Search size={16} /> Track a complaint</Button>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-center"><LocateFixed size={35} /></div>
          <div className="art-pin pin-one"><Lightbulb size={17} /></div>
          <div className="art-pin pin-two"><Waves size={17} /></div>
          <div className="art-pin pin-three"><Trees size={17} /></div>
          <span className="art-label label-one">CIVIC CARE</span><span className="art-label label-two">KANPUR</span>
        </div>
      </section>
      <section className="stats-grid">
        {stats.map(({ label, value, change, icon: Icon, color }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={18} /></div><span className="stat-label">{label}</span>
            <strong className="stat-number">{value}</strong><span className="stat-note">{change}</span>
          </article>
        ))}
      </section>
      <div className="content-grid overview-grid">
        <section className="panel recent-panel">
          <div className="panel-heading"><div><span className="eyebrow">THE NEIGHBOURHOOD PULSE</span><h2>Recent reports</h2></div><button className="text-link" onClick={() => goTo('map')}>View all <ArrowRight size={15} /></button></div>
          <div className="issues-list">{recent.map((issue) => <IssueRow key={issue.id} issue={issue} onTrack={trackIssue} supported={supportedIds.has(issue.id)} onToggleSupport={onToggleSupport} />)}</div>
          <button className="panel-footer-link" onClick={() => document.getElementById('all-issues')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View all issues <ArrowRight size={15} /></button>
        </section>
        <AllIssues issues={issues} supportedIds={supportedIds} onToggleSupport={onToggleSupport} trackIssue={trackIssue} />
        <section className="panel support-highlight">
          <div className="support-highlight-header"><div><span className="eyebrow">COMMUNITY PRIORITIES</span><h2>Issues That Need Your Support</h2></div><span className="support-highlight-icon"><ThumbsUp size={18} /></span></div>
          <div className="support-highlight-list">{issues.filter((issue) => issue.status !== 'Resolved').sort((a, b) => b.supporters - a.supporters).slice(0, 3).map((issue) => <div className="support-highlight-item" key={issue.id}><button type="button" onClick={() => trackIssue(issue.id)}><strong>{displayTitle(issue.title)}</strong><small>{issue.locality} · {issue.category}</small></button><SupportButton issue={issue} supported={supportedIds.has(issue.id)} onToggle={onToggleSupport} compact /></div>)}</div>
          <p className="support-disclaimer"><CircleAlert size={14} /> <span>Support shows citizen interest; it does not verify a report or change its status.</span></p>
        </section>
        <aside className="overview-side">
          <section className="panel activity-panel">
            <div className="panel-heading"><div><span className="eyebrow">THIS MONTH</span><h2>City in motion</h2></div><span className="icon-soft"><Activity size={17} /></span></div>
            <div className="activity-number"><strong>{resolved}</strong><span>community issues resolved</span></div>
            <div className="activity-progress"><span style={{ width: `${Math.round((resolved / issues.length) * 100)}%` }} /></div>
            <div className="activity-caption"><span>Resolution progress</span><strong>{Math.round((resolved / issues.length) * 100)}%</strong></div>
            <div className="activity-note"><TrendingUp size={15} /> Every report helps the right team take action.</div>
          </section>
          <button className="transparency-card" onClick={() => goTo('funding')}>
            <span className="transparency-icon"><BadgeIndianRupee size={21} /></span>
            <span><b>Follow public funds</b><small>Explore project budgets & spending</small></span><ArrowRight size={17} />
          </button>
        </aside>
      </div>
      <div className="demo-note"><ShieldCheck size={15} /> All issues and activity shown are fictional illustrative data.</div>
    </>
  )
}

function ReportPage({ onSubmit, preselectedCategory, clearPreselection }) {
  const [form, setForm] = useState({ title: '', category: preselectedCategory || '', locality: '', description: '', priority: 'Normal' })
  const [image, setImage] = useState('')
  const [errors, setErrors] = useState({})
  const [created, setCreated] = useState(null)
  useEffect(() => () => { if (image) URL.revokeObjectURL(image) }, [image])
  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }
  const onImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, image: 'Choose an image file.' }))
      return
    }
    setImage(URL.createObjectURL(file))
    setErrors((current) => ({ ...current, image: '' }))
  }
  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const title = form.title.trim()
    if (title.length < 12) nextErrors.title = 'Add at least 12 characters describing the issue.'
    if (!form.category) nextErrors.category = 'Choose a category.'
    if (!form.locality) nextErrors.locality = 'Choose a locality.'
    if (form.description.trim().length < 12) nextErrors.description = 'Please add at least 12 characters so the team has enough detail.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const issue = onSubmit({ ...form, title, description: form.description.trim() })
    setCreated(issue)
    setForm({ title: '', category: '', locality: '', description: '', priority: 'Normal' })
    setImage('')
    clearPreselection()
  }
  return (
    <>
      <PageHeading eyebrow="MAKE YOUR VOICE COUNT" title="Report an issue" description="Tell us what needs attention. Your report will be added here and can be tracked by its ID." />
      {created && <div className="success-callout"><CheckCircle2 size={22} /><div><strong>Your report is in.</strong><span>Complaint ID <b>{created.id}</b> — keep it handy to check progress.</span></div><button className="text-link" onClick={() => { window.dispatchEvent(new CustomEvent('kdrishti-track', { detail: created.id })) }}>Track it <ArrowRight size={15} /></button></div>}
      <div className="content-grid form-layout">
        <form className="panel report-form" onSubmit={submit} noValidate>
          <div className="form-section-title"><span className="step-number">01</span><div><h2>Issue details</h2><p>Give your report a clear, helpful description.</p></div></div>
          <label className="field-label">Issue title <span>*</span>
            <input name="title" value={form.title} onChange={update} placeholder="e.g. Pothole near the main crossing" maxLength={100} aria-invalid={Boolean(errors.title)} />
            {errors.title && <small className="field-error">{errors.title}</small>}
          </label>
          <div className="form-row">
            <label className="field-label">Category <span>*</span>
              <select name="category" value={form.category} onChange={update} aria-invalid={Boolean(errors.category)}><option value="">Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
              {errors.category && <small className="field-error">{errors.category}</small>}
            </label>
            <label className="field-label">Locality <span>*</span>
              <select name="locality" value={form.locality} onChange={update} aria-invalid={Boolean(errors.locality)}><option value="">Select a locality</option>{localities.map((locality) => <option key={locality}>{locality}</option>)}</select>
              {errors.locality && <small className="field-error">{errors.locality}</small>}
            </label>
          </div>
          <label className="field-label">Description <span>*</span>
            <textarea name="description" value={form.description} onChange={update} placeholder="What happened? Where exactly should the team look?" rows="4" maxLength={700} aria-invalid={Boolean(errors.description)} />
            <span className="field-foot"><small>{errors.description ? <em className="field-error">{errors.description}</em> : 'Add a landmark or details that could help.'}</small><small>{form.description.length}/700</small></span>
          </label>
          <div className="form-row form-bottom-row">
            <fieldset className="priority-field"><legend>Priority</legend><div className="priority-options">{['Low', 'Normal', 'High'].map((priority) => <label key={priority} className={form.priority === priority ? `selected priority-${priority.toLowerCase()}` : ''}><input type="radio" name="priority" value={priority} checked={form.priority === priority} onChange={update} /><i />{priority}</label>)}</div></fieldset>
            <div className="field-label">Attach a photo <small className="optional-label">Optional · stays on this device</small>
              <label className={`upload-area ${image ? 'has-image' : ''}`}>
                {image ? <><img src={image} alt="Selected issue preview" /><span>Change photo</span></> : <><ImagePlus size={19} /><span>Add an image</span><small>Image preview only · no upload</small></>}
                <input type="file" accept="image/*" onChange={onImageChange} />
              </label>
              {errors.image && <small className="field-error">{errors.image}</small>}
            </div>
          </div>
          <div className="form-submit"><span><ShieldCheck size={15} /> Reports stay in this browser; no data is sent to a server.</span><Button type="submit">Submit report <Send size={15} /></Button></div>
        </form>
        <aside className="report-aside">
          <div className="panel guidance-card"><span className="guidance-icon"><LocateFixed size={21} /></span><h3>Help us find it</h3><p>A nearby landmark and clear details help a city team understand what needs attention.</p><div className="guidance-example"><b>Helpful detail</b><span>“Large pothole outside the post office entrance on Mall Road.”</span></div></div>
          <div className="privacy-card"><ShieldCheck size={18} /><div><b>Your report, your community</b><p>This presentation uses fictional data. Reports are saved only in this browser.</p></div></div>
        </aside>
      </div>
    </>
  )
}

function AllIssueCard({ issue, supported, onToggleSupport, trackIssue }) {
  const [copied, setCopied] = useState(false)
  const copyId = async (event) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(issue.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }
  return (
    <article className="all-issue-card">
      <div className="all-issue-main">
        <button type="button" className="all-issue-title" onClick={() => trackIssue(issue.id)}>{displayTitle(issue.title)}</button>
        <div className="all-issue-meta"><span className={`category-tag category-${issue.category.toLowerCase().replaceAll(' ', '-')}`}>{issue.category}</span><span>{issue.locality}</span><StatusBadge status={issue.status} /><span>{formatDate(issue.date)}</span></div>
        <div className="all-issue-id">Complaint ID <b>{issue.id}</b><button type="button" onClick={copyId} aria-label={`Copy complaint ID ${issue.id}`}><Copy size={12} />{copied ? 'Copied' : 'Copy'}</button></div>
      </div>
      <div className="all-issue-stats"><span><ThumbsUp size={13} /> {formatCount(issue.supporters + (supported ? 1 : 0))}</span><span><Eye size={13} /> {formatCount(issue.views)}</span></div>
      <SupportButton issue={issue} supported={supported} onToggle={onToggleSupport} compact />
    </article>
  )
}

function AllIssues({ issues, supportedIds, onToggleSupport, trackIssue }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All statuses')
  const [sort, setSort] = useState('newest')
  const filteredIssues = useMemo(() => {
    const search = query.trim().toLowerCase()
    return [...issues]
      .filter((issue) => !search || [issue.title, issue.locality, issue.id].some((value) => value.toLowerCase().includes(search)))
      .filter((issue) => category === 'All categories' || issue.category === category)
      .filter((issue) => status === 'All statuses' || issue.status === status)
      .sort((a, b) => {
        if (sort === 'support') return b.supporters - a.supporters
        if (sort === 'views') return b.views - a.views
        return new Date(b.date) - new Date(a.date)
      })
  }, [category, issues, query, sort, status])
  const reset = () => { setQuery(''); setCategory('All categories'); setStatus('All statuses'); setSort('newest') }
  return (
    <section className="panel all-issues-panel" id="all-issues">
      <div className="all-issues-header"><div><span className="eyebrow">ISSUE DIRECTORY</span><h2>All Issues ({issues.length})</h2><p>Search reports, compare activity, and support a concern already raised by another resident.</p></div><span className="all-issues-total">{filteredIssues.length} shown</span></div>
      <div className="all-issues-filters">
        <label className="all-issues-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, locality or ID" aria-label="Search all issues" /></label>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{['Submitted', 'Acknowledged', 'In Progress', 'Resolved'].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="support">Most supported</option><option value="views">Most viewed</option></select></label>
      </div>
      <div className="all-issues-scroll">
        {filteredIssues.length ? filteredIssues.map((issue) => <AllIssueCard key={issue.id} issue={issue} supported={supportedIds.has(issue.id)} onToggleSupport={onToggleSupport} trackIssue={trackIssue} />) : <div className="all-issues-empty"><Search size={22} /><strong>No issues match your filters</strong><button type="button" onClick={reset}>Reset filters</button></div>}
      </div>
    </section>
  )
}

const timelineSteps = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved']

function TrackingPage({ issues, initialId, supportedIds, onToggleSupport }) {
  const [query, setQuery] = useState(initialId || '')
  const [searched, setSearched] = useState(initialId || '')
  const found = searched ? issues.find((issue) => issue.id.toLowerCase() === searched.trim().toLowerCase()) : null
  const search = (event) => { event.preventDefault(); setSearched(query.trim()) }
  return (
    <>
      <PageHeading eyebrow="YOUR REPORT, FOLLOWED THROUGH" title="Track a complaint" description="Enter a complaint ID to see its latest status and the steps taken so far." />
      <section className="panel tracking-search">
        <div className="search-copy"><div className="search-symbol"><Search size={20} /></div><div><h2>Where does it stand?</h2><p>Try one of the example IDs below or enter your own.</p></div></div>
        <form onSubmit={search} className="tracking-form"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. KD-2026-1042" aria-label="Complaint ID" /><Button type="submit">Find report <ArrowRight size={16} /></Button></form>
        <div className="sample-ids"><span>TRY AN EXAMPLE ID</span>{issues.slice(0, 3).map((issue) => <button key={issue.id} onClick={() => { setQuery(issue.id); setSearched(issue.id) }}>{issue.id}</button>)}</div>
      </section>
      {found ? <section className="panel tracking-result">
        <div className="result-top"><div><span className="eyebrow">COMPLAINT {found.id}</span><h2>{displayTitle(found.title)}</h2><p>{found.locality} <b>·</b> {found.category} <b>·</b> {found.department} <b>·</b> Submitted {formatDate(found.date)}</p><div className="engagement-summary"><span>{formatCount(found.supporters + (supportedIds.has(found.id) ? 1 : 0))} supporters</span><span>{formatCount(found.views)} views</span></div><p className="issue-description">{found.description}</p><SupportButton issue={found} supported={supportedIds.has(found.id)} onToggle={onToggleSupport} /></div><StatusBadge status={found.status} /></div>
        <div className="timeline">
          {timelineSteps.map((step, index) => {
            const currentIndex = timelineSteps.indexOf(found.status)
            const complete = index <= currentIndex
            return <div className={`timeline-step ${complete ? 'complete' : ''} ${index === currentIndex ? 'current' : ''}`} key={step}><span className="timeline-marker">{complete ? <Check size={14} /> : null}</span><div><b>{step}</b><small>{index === 0 ? formatDate(found.date) : complete ? 'Status update' : 'Next step'}</small></div></div>
          })}
        </div>
        <div className="demo-note"><CircleAlert size={15} /> This is a fictional status, not an official municipal record.</div>
      </section> : searched ? <div className="empty-state"><div className="empty-icon"><Search size={22} /></div><h2>No report found</h2><p>We couldn’t find <b>{searched}</b>. Check the ID and try again, or browse an example report above.</p></div> : <div className="tracking-placeholder"><FileText size={20} /><span>Your report details and timeline will appear here.</span></div>}
    </>
  )
}

function CityMap({ issues, trackIssue, supportedIds, onToggleSupport }) {
  const mapRef = useRef(null)
  const markerRefs = useRef({})
  const [category, setCategory] = useState('All categories')
  const [status, setStatus] = useState('All statuses')
  const [sort, setSort] = useState('recent')
  const [tilesFailed, setTilesFailed] = useState(false)
  const filtered = issues
    .filter((issue) => (category === 'All categories' || issue.category === category) && (status === 'All statuses' || issue.status === status))
    .sort((a, b) => sort === 'support' ? b.supporters - a.supporters : new Date(b.date) - new Date(a.date))
  const categoryColors = { Roads: 'var(--map-road)', Drainage: 'var(--map-drainage)', Garbage: 'var(--map-garbage)', Streetlights: 'var(--map-streetlights)', 'Water Supply': 'var(--map-water)', Parks: 'var(--map-parks)', Other: 'var(--map-other)' }
  const focusIssue = (issue) => {
    const marker = markerRefs.current[issue.id]
    if (!marker || !mapRef.current) return
    mapRef.current.flyTo([issue.lat, issue.lng], Math.max(mapRef.current.getZoom(), 14), { duration: 0.45 })
    window.setTimeout(() => marker.openPopup(), 450)
  }
  return (
    <>
      <PageHeading eyebrow="SEE WHAT'S HAPPENING" title="City issue map" description="Explore fictional community reports across Kanpur. Select a marker to view its details." />
      <section className="map-filterbar panel"><div className="filter-heading"><Filter size={17} /><b>Explore reports</b><span>{filtered.length} shown</span></div><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{['Submitted', 'Acknowledged', 'In Progress', 'Resolved'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recently reported</option><option value="support">Most supported</option></select></label><div className="map-legend">{Object.entries(categoryColors).map(([name, color]) => <span key={name}><i style={{ background: color }} />{name}</span>)}</div></section>
      <div className="map-layout">
        <section className="map-wrap panel">
          {tilesFailed && <div className="tile-fallback"><Map size={20} /><span><b>Map tiles are unavailable.</b> Showing report pins on the Kanpur map area without the background.</span></div>}
          <MapContainer ref={mapRef} center={[26.4499, 80.3319]} zoom={12} scrollWheelZoom={false} zoomControl={false} className="leaflet-map">
            <ZoomControl position="bottomright" />
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesFailed(true), tileload: () => setTilesFailed(false) }} />
            {filtered.map((issue) => <CircleMarker ref={(marker) => { markerRefs.current[issue.id] = marker }} key={issue.id} center={[issue.lat, issue.lng]} radius={7} pathOptions={{ color: 'var(--marker-outline)', weight: 2, fillColor: categoryColors[issue.category], fillOpacity: 0.95 }}>
              <Popup><div className="map-popup"><strong>{displayTitle(issue.title)}</strong><span>{issue.category} · {issue.locality}</span><StatusBadge status={issue.status} /><span className="map-popup-id">Complaint {issue.id}</span><span className="map-popup-stats"><span><ThumbsUp size={12} /> {formatCount(issue.supporters + (supportedIds.has(issue.id) ? 1 : 0))}</span><span><Eye size={12} /> {formatCount(issue.views)}</span></span><SupportButton issue={issue} supported={supportedIds.has(issue.id)} onToggle={onToggleSupport} compact /><button onClick={() => trackIssue(issue.id)}>Track {issue.id} <ArrowRight size={13} /></button></div></Popup>
            </CircleMarker>)}
          </MapContainer>
          <div className="map-attribution">Illustrative locations · Kanpur, Uttar Pradesh</div>
        </section>
        <section className="panel map-results"><div className="panel-heading"><div><span className="eyebrow">FILTERED REPORTS</span><h2>On the map</h2></div><span className="count-pill">{filtered.length}</span></div><div className="support-list-hint"><ThumbsUp size={12} /> Support any report to show that your neighbourhood is affected.</div><div className="map-issue-list">{filtered.map((issue) => <div key={issue.id} className="map-issue"><i style={{ background: categoryColors[issue.category] }} /><span><button type="button" onClick={() => focusIssue(issue)}><b>{displayTitle(issue.title)}</b><small>{issue.locality} · {issue.category}</small></button><small>{formatCount(issue.supporters + (supportedIds.has(issue.id) ? 1 : 0))} supporters</small></span><StatusBadge status={issue.status} /><SupportButton issue={issue} supported={supportedIds.has(issue.id)} onToggle={onToggleSupport} compact /></div>)}{filtered.length === 0 && <div className="empty-mini">No reports match those filters.</div>}</div></section>
      </div>
      <div className="demo-note"><ShieldCheck size={15} /> Fictional reports and approximate illustrative coordinates. Not government data.</div>
    </>
  )
}

const services = [
  { category: 'Roads', icon: LocateFixed, title: 'Road maintenance', text: 'Potholes, damaged roads, footpaths and unsafe crossings.' },
  { category: 'Drainage', icon: Waves, title: 'Drainage & waterlogging', text: 'Blocked drains, overflowing sewers and waterlogged streets.' },
  { category: 'Garbage', icon: Trash2, title: 'Waste collection', text: 'Missed pickups, overflowing bins and neighbourhood waste.' },
  { category: 'Streetlights', icon: Lightbulb, title: 'Streetlight complaints', text: 'Lights that are broken, flickering or missing on your street.' },
  { category: 'Water Supply', icon: Droplets, title: 'Water supply', text: 'Supply interruptions, leaks and water quality concerns.' },
  { category: 'Parks', icon: Trees, title: 'Parks & public spaces', text: 'Playground upkeep, damaged equipment and green spaces.' },
]

function Services({ reportFor }) {
  return (
    <>
      <PageHeading eyebrow="HERE FOR YOUR NEIGHBOURHOOD" title="City services" description="Find the right place to raise a concern. Choose a service to start a report with its category ready." />
      <div className="services-grid">{services.map(({ category, icon: Icon, title, text }) => <article className="panel service-card" key={category}><span className={`service-icon category-${category.toLowerCase().replaceAll(' ', '-')}`}><Icon size={21} /></span><h2>{title}</h2><p>{text}</p><button className="service-action" onClick={() => reportFor(category)}>Report an issue <ArrowRight size={15} /></button></article>)}</div>
      <div className="services-help"><div className="help-icon"><MessageSquareText size={19} /></div><div><b>Not sure which service fits?</b><span>Choose “Other” when you report and tell us a little more.</span></div><Button variant="outline" onClick={() => reportFor('Other')}>Start a report</Button></div>
    </>
  )
}

function FundingPage() {
  const [selected, setSelected] = useState(projects[0].id)
  const project = projects.find((item) => item.id === selected)
  const expenses = demoExpenses.filter((expense) => expense.projectId === selected)
  const totals = projects.reduce((acc, item) => ({ allocated: acc.allocated + item.budget, released: acc.released + item.released, spent: acc.spent + item.spent, verified: acc.verified + item.verified }), { allocated: 0, released: 0, spent: 0, verified: 0 })
  return (
    <>
      <PageHeading eyebrow="OPEN BOOKS, STRONGER TRUST" title="Funding & transparency" description="Explore how project allocations, releases and reported spending fit together." />
      <div className="fictional-banner"><CircleAlert size={17} /><span><b>Illustrative data</b> — these figures and records do not represent Kanpur municipal accounts.</span></div>
      <section className="funding-summary-grid">
        <article className="funding-summary"><span>Total allocated</span><strong>{formatCrore(totals.allocated)}</strong><small>Project budgets</small><Wallet size={18} /></article>
        <article className="funding-summary"><span>Funds released</span><strong>{formatCrore(totals.released)}</strong><small>{Math.round((totals.released / totals.allocated) * 100)}% of allocation</small><ArrowDownRight size={18} /></article>
        <article className="funding-summary"><span>Reported expenditure</span><strong>{formatCrore(totals.spent)}</strong><small>Reported across all projects</small><FileText size={18} /></article>
        <article className="funding-summary"><span>Verified expenditure</span><strong>{formatCrore(totals.verified)}</strong><small>Of reported spend</small><ShieldCheck size={18} /></article>
      </section>
      <div className="content-grid funding-content">
        <section className="panel project-panel"><div className="panel-heading"><div><span className="eyebrow">CIVIC WORKS</span><h2>Project overview</h2></div><span className="fictional-tag">ILLUSTRATIVE</span></div>
          <div className="project-list">{projects.map((item) => { const ProjectIcon = item.icon; return <button className={`project-row ${selected === item.id ? 'active' : ''}`} key={item.id} onClick={() => setSelected(item.id)}><span className={`project-symbol category-${item.category.toLowerCase().replaceAll(' ', '-')}`}><ProjectIcon size={19} /></span><span className="project-main"><b>{item.name}</b><small>{item.status} · {item.progress}% complete</small><span className="project-progress"><i style={{ width: `${item.progress}%` }} /></span></span><span className="project-amount"><b>{formatCrore(item.budget)}</b><small>allocated</small></span><ArrowRight size={15} /></button> })}</div>
        </section>
        <section className="panel rupee-panel"><div className="panel-heading"><div><span className="eyebrow">TRACE ONE PROJECT</span><h2>Follow the Rupee</h2></div><span className="rupee-icon"><BadgeIndianRupee size={18} /></span></div>
          <label className="field-label">Select a project<select value={selected} onChange={(event) => setSelected(event.target.value)}>{projects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          {project && <><div className="rupee-flow"><div><small>Allocated</small><b>{formatCrore(project.budget)}</b></div><ArrowRight size={15} /><div><small>Released</small><b>{formatCrore(project.released)}</b></div><ArrowRight size={15} /><div><small>Reported spend</small><b>{formatCrore(project.spent)}</b></div></div><div className="verification-line"><span><ShieldCheck size={15} /> Verified portion of reported spend</span><b>{formatCrore(project.verified)}</b></div><div className="expense-heading"><b>Expense ledger</b><span>{expenses.length} entries</span></div><div className="expense-list">{expenses.map((expense) => <div className="expense-item" key={expense.id}><span><b>{expense.description}</b><small>{formatDate(expense.date)}</small></span><span><b>{formatCrore(expense.amount)}</b><small className={expense.verified ? 'verified-label' : 'pending-label'}>{expense.verified ? 'Verified' : 'Pending review'}</small></span></div>)}</div>{expenses.length === 0 && <div className="empty-mini">No ledger entries for this project yet.</div>}</>}
        </section>
      </div>
      <section className="panel allocation-panel"><div className="panel-heading"><div><span className="eyebrow">WHERE BUDGETS GO</span><h2>Allocation breakdown</h2></div><span className="allocation-total">{formatCrore(totals.allocated)} total</span></div><div className="allocation-bars">{projects.map((item) => <div className="allocation-row" key={item.id}><span>{item.name}</span><div><i style={{ width: `${(item.budget / totals.allocated) * 100}%` }} /></div><b>{formatCrore(item.budget)}</b></div>)}</div><div className="balance-note"><span>Unspent allocation (allocated minus reported expenditure)</span><b>{formatCrore(totals.allocated - totals.spent)}</b></div><p className="financial-disclaimer">Figures are illustrative only. “Reported expenditure” is not the same as independently verified expenditure. All amounts are fictional and for presentation purposes.</p></section>
    </>
  )
}

function Analytics({ issues }) {
  const byCategory = categories.map((category) => ({ category, count: issues.filter((issue) => issue.category === category).length })).filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count)
  const resolved = issues.filter((issue) => issue.status === 'Resolved').length
  const open = issues.length - resolved
  const maxCategory = Math.max(...byCategory.map((item) => item.count), 1)
  return (
    <>
      <PageHeading eyebrow="A CLEARER VIEW OF THE CITY" title="City analytics" description="A compact, live look at the fictional reports and public projects." />
      <div className="analytics-kpis"><div><span>Total community reports</span><b>{issues.length}</b><small>Across Kanpur localities</small></div><div><span>Resolved</span><b>{resolved}</b><small>{Math.round((resolved / issues.length) * 100)}% of reports</small></div><div><span>Open reports</span><b>{open}</b><small>Awaiting next steps</small></div><div><span>Active projects</span><b>{projects.length}</b><small>Across civic services</small></div></div>
      <div className="content-grid analytics-grid">
        <section className="panel analytics-panel"><div className="panel-heading"><div><span className="eyebrow">COMMUNITY REPORTS</span><h2>Issues by category</h2></div><BarChart3 size={19} className="muted-icon" /></div><div className="category-bars">{byCategory.map(({ category, count }) => <div className="category-bar-row" key={category}><span>{category}</span><div><i className={`bar-${category.toLowerCase().replaceAll(' ', '-')}`} style={{ width: `${(count / maxCategory) * 100}%` }} /></div><b>{count}</b></div>)}</div></section>
        <section className="panel resolution-panel"><div className="panel-heading"><div><span className="eyebrow">REPORT OUTCOMES</span><h2>Resolved vs. pending</h2></div><Activity size={18} className="muted-icon" /></div><div className="resolution-chart"><div className="donut" style={{ '--resolved': `${(resolved / issues.length) * 100}%` }}><div><b>{Math.round((resolved / issues.length) * 100)}%</b><small>resolved</small></div></div><div className="resolution-legend"><span><i className="legend-resolved" />Resolved <b>{resolved}</b></span><span><i className="legend-open" />Open <b>{open}</b></span></div></div><p className="analytics-footnote">Resolution progress reflects current report statuses.</p></section>
      </div>
      <section className="panel analytics-projects"><div className="panel-heading"><div><span className="eyebrow">PUBLIC WORKS</span><h2>Project progress</h2></div><span className="fictional-tag">FICTIONAL</span></div><div className="analytics-project-grid">{projects.map((item) => <div className="analytics-project" key={item.id}><span>{item.name}</span><b>{item.progress}%</b><div><i style={{ width: `${item.progress}%` }} /></div><small>{item.status}</small></div>)}</div></section>
      <div className="demo-note"><ShieldCheck size={15} /> Analytics update from shared issue and illustrative project data.</div>
    </>
  )
}

function App() {
  const [issues, setIssues] = useState(readSavedIssues)
  const [supportedIds, setSupportedIds] = useState(getSupportedIssueIds)
  const [page, setPage] = useState('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [preselectedCategory, setPreselectedCategory] = useState('')
  const [trackedId, setTrackedId] = useState('')
  const [storageWarning, setStorageWarning] = useState(false)
  const [todayLabel] = useState(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  useEffect(() => {
    const root = document.documentElement
    const saved = window.localStorage.getItem('kdrishti-theme')
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemTheme = () => {
      if (!window.localStorage.getItem('kdrishti-theme')) {
        const next = media.matches ? 'dark' : 'light'
        root.dataset.theme = next
        setTheme(next)
      }
    }
    root.dataset.theme = saved === 'dark' || saved === 'light' ? saved : (media.matches ? 'dark' : 'light')
    root.classList.add('theme-ready')
    media.addEventListener?.('change', applySystemTheme)
    return () => media.removeEventListener?.('change', applySystemTheme)
  }, [])
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('kdrishti-theme', next)
    setTheme(next)
  }
  useEffect(() => {
    const handleStorageError = () => setStorageWarning(true)
    window.addEventListener('kdrishti-storage-error', handleStorageError)
    return () => window.removeEventListener('kdrishti-storage-error', handleStorageError)
  }, [])
  useEffect(() => {
    try {
      window.localStorage.setItem('kdrishti-issues', JSON.stringify(issues))
    } catch (error) {
      console.error('Unable to save demo reports to browser storage.', error)
      window.dispatchEvent(new Event('kdrishti-storage-error'))
    }
  }, [issues])
  useEffect(() => {
    const handleTrack = (event) => { setTrackedId(event.detail); setPage('track') }
    window.addEventListener('kdrishti-track', handleTrack)
    return () => window.removeEventListener('kdrishti-track', handleTrack)
  }, [])
  const goTo = (nextPage) => { setPage(nextPage); setMobileNavOpen(false) }
  const reportFor = (category) => { setPreselectedCategory(category); goTo('report') }
  const trackIssue = (id) => { setTrackedId(id); goTo('track') }
  const handleToggleSupport = (issueId) => {
    setSupportedIds(toggleIssueSupport(issueId))
  }
  const submitIssue = (form) => {
    const issue = createUserIssue(form, issues)
    setIssues((current) => [issue, ...current])
    return issue
  }
  const activeNav = useMemo(() => navItems.find((item) => item.id === page), [page])
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <Brand />
        <div className="nav-caption">CITIZEN SPACE</div>
        <nav aria-label="Main navigation">{navItems.map(({ id, label, icon: Icon }) => <button className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => goTo(id)} key={id}><Icon size={18} /><span>{label}</span>{id === 'funding' && <span className="nav-new">NEW</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-city"><span className="city-symbol"><LocateFixed size={17} /></span><div><b>Kanpur Nagar</b><small>Uttar Pradesh, India</small></div><ChevronDown size={15} /></div><ThemeToggle theme={theme} onToggle={toggleTheme} /><div className="sidebar-demo"><span className="demo-indicator" /> Local environment</div></div>
      </aside>
      {mobileNavOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <div className="main-shell">
        <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button><div className="breadcrumb"><span>Kanpur</span><i>/</i><b>{activeNav?.label || 'Overview'}</b></div><div className="topbar-right"><span className="date-label">{todayLabel}</span><ThemeToggle theme={theme} onToggle={toggleTheme} /><span className="topbar-separator" /><div className="avatar">KD</div><div className="topbar-name"><b>City resident</b><small>Community member</small></div></div></header>
        {storageWarning && <div className="storage-warning"><CircleAlert size={15} /> Browser storage is unavailable; new reports will last only for this session.</div>}
        <main className="page-content">
          {page === 'overview' && <Overview issues={issues} goTo={goTo} trackIssue={trackIssue} supportedIds={supportedIds} onToggleSupport={handleToggleSupport} />}
          {page === 'report' && <ReportPage onSubmit={submitIssue} preselectedCategory={preselectedCategory} clearPreselection={() => setPreselectedCategory('')} />}
          {page === 'track' && <TrackingPage key={trackedId || 'tracking'} issues={issues} initialId={trackedId} supportedIds={supportedIds} onToggleSupport={handleToggleSupport} />}
          {page === 'map' && <CityMap issues={issues} trackIssue={trackIssue} supportedIds={supportedIds} onToggleSupport={handleToggleSupport} />}
          {page === 'services' && <Services reportFor={reportFor} />}
          {page === 'funding' && <FundingPage />}
          {page === 'analytics' && <Analytics issues={issues} />}
          <footer className="site-footer"><span><b>K-Drishti</b> · Civic clarity for Kanpur</span><span>Fictional data only</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
