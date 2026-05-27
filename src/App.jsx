import React, { useState, useEffect, useRef, useCallback } from 'react'
import { initAuth } from './firebase'
import { watchProjects, createProject, toggleDay, markDayDone, saveDayLog, deleteProject } from './utils/firestore'
import { generateRoadmap } from './utils/roadmap'
import { pct, streak, currentPhase, allNotes, tagColor, tagClass, DEFAULT_TAGS } from './utils/helpers'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [view, setView] = useState('dashboard')
  const [activeId, setActiveId] = useState(null)
  const [selDay, setSelDay] = useState(null)
  const [logOpen, setLogOpen] = useState(false)
  const [noteFilter, setNoteFilter] = useState('All')
  const [tags, setTags] = useState([...DEFAULT_TAGS])
  const [generating, setGenerating] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formGoal, setFormGoal] = useState('')
  const [formCommit, setFormCommit] = useState('')
  const [formError, setFormError] = useState('')

  // Log panel state
  const [logDid, setLogDid] = useState('')
  const [logNotes, setLogNotes] = useState([])
  const [customTag, setCustomTag] = useState('')

  const scrollRef = useRef(null)
  const logRef = useRef(null)

  const activeProject = projects.find((p) => p.id === activeId)

  // Auth + subscribe to projects
  useEffect(() => {
    let unsub = null
    initAuth().then((u) => {
      setUser(u)
      unsub = watchProjects(u.uid, (p) => {
        setProjects(p)
        setLoading(false)
      })
    })
    return () => unsub && unsub()
  }, [])

  // Navigate helper
  const go = useCallback((v) => {
    setView(v)
    setLogOpen(false)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [])

  // Open project detail
  const openProject = (id) => {
    setActiveId(id)
    setSelDay(null)
    setNoteFilter('All')
    go('detail')
  }

  // Check-in a day
  const handleCheckin = async () => {
    if (!user || !activeProject || selDay === null) return
    await toggleDay(user.uid, activeProject.id, selDay, activeProject.completed)
  }

  // Open log panel for a day
  const openLog = (dayIndex) => {
    if (!activeProject) return
    setSelDay(dayIndex)
    const existing = activeProject.logs[dayIndex]
    setLogDid(existing?.did || '')
    setLogNotes(existing?.notes ? existing.notes.map((n) => ({ ...n })) : [])
    setLogOpen(true)
    setTimeout(() => logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  // Save log
  const handleSaveLog = async () => {
    if (!user || !activeProject || selDay === null) return
    const did = logDid.trim()
    const validNotes = logNotes.filter((n) => n.text.trim())
    if (!did && !validNotes.length) { setLogOpen(false); return }
    await saveDayLog(user.uid, activeProject.id, selDay, { did, notes: validNotes }, activeProject.completed, activeProject.logs)
    setLogOpen(false)
  }

  // Create project
  const handleCreate = async () => {
    const n = formName.trim(), g = formGoal.trim(), c = formCommit.trim()
    if (!n || !g || !c) { setFormError('Please fill in all fields.'); return }
    setFormError('')
    setGenerating(true)
    go('generating')
    const roadmap = await generateRoadmap({ name: n, goal: g, commitment: c })
    const id = await createProject(user.uid, { name: n, goal: g, commitment: c, ...roadmap })
    setGenerating(false)
    setFormName(''); setFormGoal(''); setFormCommit('')
    openProject(id)
  }

  // Add custom tag
  const handleAddTag = () => {
    const v = customTag.trim()
    if (!v || tags.includes(v)) return
    setTags([...tags, v])
    setCustomTag('')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  const totalDaysLogged = projects.reduce((a, p) => a + p.completed.size, 0)

  // Sidebar nav items
  const navItems = [
    { icon: 'ti-layout-grid', view: 'dashboard', label: 'Dashboard' },
    { icon: 'ti-plus', view: 'create', label: 'New project' },
  ]

  return (
    <>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="shell">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sb-logo"><i className="ti ti-route-2" aria-hidden="true" /></div>
          <div className="sb-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                className={`sb-btn ${view === item.view ? 'active' : ''}`}
                onClick={() => { if (item.view === 'create') { go('create') } else { setSelDay(null); go('dashboard') } }}
                aria-label={item.label}
              >
                <i className={`ti ${item.icon}`} />
              </button>
            ))}
          </div>
          <div className="sb-bottom">
            <button className="icon-btn" aria-label="Settings"><i className="ti ti-settings" /></button>
            <div className="avatar">T</div>
          </div>
        </div>

        <div className="main-area">
          {/* Topbar */}
          <div className="topbar">
            <span className="topbar-title">
              {view === 'dashboard' ? 'Learn Path' : view === 'create' ? 'New project' : view === 'generating' ? 'Generating...' : activeProject?.name || 'Project'}
            </span>
            <span style={{ flex: 1 }} />
            <button className="icon-btn" aria-label="Search"><i className="ti ti-search" /></button>
            <button className="icon-btn" aria-label="Settings"><i className="ti ti-settings" /></button>
            <div className="avatar avatar-lg">T</div>
          </div>

          <div className="scroll-area" ref={scrollRef}>

            {/* ══════ DASHBOARD ══════ */}
            {view === 'dashboard' && (
              <div className="view-enter">
                <div className="greeting-row">
                  <div className="greeting-text">
                    <h1>Good day, Trong!</h1>
                    <p>Keep building. Every day compounds.</p>
                  </div>
                  <div className="quick-stats">
                    <div className="qs-box"><div className="qs-val">{projects.length}</div><div className="qs-label">Projects</div></div>
                    <div className="qs-box"><div className="qs-val">{totalDaysLogged}</div><div className="qs-label">Days logged</div></div>
                  </div>
                  <button className="btn-primary" onClick={() => go('create')}>
                    <i className="ti ti-plus" aria-hidden="true" /> Add project
                  </button>
                </div>
                <div className="section-label">Running projects</div>
                <div className="projects-grid">
                  {projects.map((p) => (
                    <div key={p.id} className="project-card" onClick={() => openProject(p.id)}>
                      <div className="phase-tag">{currentPhase(p)}</div>
                      <h3>{p.name}</h3>
                      <div className="meta">Goal: {p.goal}<br />Effort: {p.commitment}</div>
                      <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${pct(p)}%` }} /></div>
                      <div className="project-stats">
                        <div className="stat"><strong>{pct(p)}%</strong>complete</div>
                        <div className="stat"><strong>{streak(p)}</strong>streak</div>
                        <div className="stat"><strong>{p.completed.size}/{p.totalDays}</strong>days</div>
                      </div>
                    </div>
                  ))}
                  <div className="add-project-card" onClick={() => go('create')}>
                    <i className="ti ti-plus" aria-hidden="true" />
                    <span>New project</span>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ CREATE ══════ */}
            {view === 'create' && (
              <div className="view-enter">
                <button className="btn-back" onClick={() => go('dashboard')}>
                  <i className="ti ti-arrow-left" aria-hidden="true" /> Dashboard
                </button>
                <div className="form-card" style={{ marginTop: 16 }}>
                  <h2>New project</h2>
                  <p className="sub">Describe your goal — AI will design a phased roadmap.</p>
                  <div className="field"><label>Project name</label><input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Push up mastery" /></div>
                  <div className="field"><label>Your goal</label><input value={formGoal} onChange={(e) => setFormGoal(e.target.value)} placeholder="e.g. Do 100 push-ups in a row" /></div>
                  <div className="field"><label>Daily commitment</label><input value={formCommit} onChange={(e) => setFormCommit(e.target.value)} placeholder="e.g. 30 min / day" /></div>
                  {formError && <div className="field-error">{formError}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn-ghost" onClick={() => go('dashboard')}>Cancel</button>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreate}>
                      <i className="ti ti-sparkles" aria-hidden="true" /> Generate roadmap
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ GENERATING ══════ */}
            {view === 'generating' && (
              <div className="view-enter">
                <div className="gen-card">
                  <div className="spinner" />
                  <p style={{ fontFamily: 'var(--fh)', fontSize: 16, fontWeight: 700 }}>Designing your roadmap...</p>
                  <p style={{ fontSize: 12, color: 'var(--ink3)' }}>AI is analysing your goal and pacing the phases</p>
                </div>
              </div>
            )}

            {/* ══════ DETAIL ══════ */}
            {view === 'detail' && activeProject && (
              <div className="view-enter">
                <button className="btn-back" onClick={() => { setSelDay(null); go('dashboard') }}>
                  <i className="ti ti-arrow-left" aria-hidden="true" /> All projects
                </button>

                {/* Header */}
                <div className="detail-header" style={{ marginTop: 12 }}>
                  <h1>{activeProject.name}</h1>
                  <p className="summary">{activeProject.summary}</p>
                  <div className="stats-grid">
                    <div className="stat-box"><div className="val">{pct(activeProject)}%</div><div className="label">Progress</div></div>
                    <div className="stat-box"><div className="val">{streak(activeProject)}</div><div className="label">Streak</div></div>
                    <div className="stat-box"><div className="val">{Object.values(activeProject.logs).reduce((a, l) => a + (l.notes?.length || 0), 0)}</div><div className="label">Notes</div></div>
                    <div className="stat-box"><div className="val">{activeProject.totalDays}</div><div className="label">Total days</div></div>
                  </div>
                </div>

                {/* Day grid */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="card-title">Daily tracker</div>
                      <div className="card-sub">Click a day or use the check-in button below · <span style={{ color: 'var(--gr)' }}>●</span> = has note</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>
                      {activeProject.completed.size} / {activeProject.totalDays} done
                    </span>
                  </div>
                  <div className="day-grid">
                    {Array.from({ length: activeProject.totalDays }).map((_, i) => {
                      const done = activeProject.completed.has(i)
                      const hasLog = !!activeProject.logs[i]
                      const selected = selDay === i
                      return (
                        <button
                          key={i}
                          className={`day-btn${done ? ' done' : ''}${hasLog ? ' has-log' : ''}${selected ? ' selected' : ''}`}
                          title={`Day ${i + 1}${done ? ' (done)' : ''}${hasLog ? ' - has log' : ''}`}
                          onClick={() => setSelDay(i)}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>

                  {/* Check-in bar */}
                  {selDay !== null && (
                    <div className="checkin-bar">
                      <div className="checkin-day">Day {selDay + 1}</div>
                      <div className="checkin-status">
                        {activeProject.completed.has(selDay)
                          ? <><span className="done"><i className="ti ti-check" aria-hidden="true" /> Checked in</span>{activeProject.logs[selDay] ? ' · has log' : ''}</>
                          : 'Not done yet'}
                      </div>
                      <button className={`checkin-btn${activeProject.completed.has(selDay) ? ' undo' : ''}`} onClick={handleCheckin}>
                        <i className={`ti ${activeProject.completed.has(selDay) ? 'ti-x' : 'ti-check'}`} aria-hidden="true" />
                        {activeProject.completed.has(selDay) ? ' Undo' : ' Check-in'}
                      </button>
                      <button className="log-btn" onClick={() => openLog(selDay)}>
                        <i className="ti ti-notebook" aria-hidden="true" /> Add log
                      </button>
                    </div>
                  )}
                </div>

                {/* Log panel */}
                {logOpen && selDay !== null && (
                  <div className="log-panel" ref={logRef}>
                    <div>
                      <div className="log-title">Day {selDay + 1}</div>
                      <div className="log-sub">{activeProject.completed.has(selDay) ? 'Edit your log for this day' : 'Log what you did on this day'}</div>
                    </div>
                    <div>
                      <div className="log-section-title">What I did today</div>
                      <textarea className="log-textarea" value={logDid} onChange={(e) => setLogDid(e.target.value)} placeholder="Describe what you worked on, practised, or accomplished..." rows={3} />
                    </div>
                    <div>
                      <div className="log-section-title" style={{ marginBottom: 8 }}>
                        Learn notes <span style={{ color: 'var(--ink4)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span>
                      </div>
                      {logNotes.map((note, idx) => (
                        <div key={idx} className="note-input">
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <textarea
                              value={note.text}
                              onChange={(e) => { const n = [...logNotes]; n[idx] = { ...n[idx], text: e.target.value }; setLogNotes(n) }}
                              placeholder="What did you learn, discover, or figure out?"
                              rows={2}
                            />
                            <button className="remove-btn" onClick={() => setLogNotes(logNotes.filter((_, j) => j !== idx))}>
                              <i className="ti ti-x" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="tag-select">
                            {tags.map((t) => (
                              <span
                                key={t}
                                className={`tag-chip${note.tag === t ? ' active' : ''}`}
                                data-tag={t}
                                onClick={() => { const n = [...logNotes]; n[idx] = { ...n[idx], tag: t }; setLogNotes(n) }}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="add-note-btn" onClick={() => setLogNotes([...logNotes, { text: '', tag: 'Insight' }])}>
                        <i className="ti ti-plus" aria-hidden="true" /> Add learn note
                      </button>
                      <div style={{ marginTop: 12 }}>
                        <div className="log-section-title">Custom hashtag</div>
                        <div className="custom-tag-row">
                          <input value={customTag} onChange={(e) => setCustomTag(e.target.value)} placeholder="e.g. Method, Mistake, Tool..." maxLength={20} />
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '6px 12px' }} onClick={handleAddTag}>Add</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn-ghost" onClick={() => setLogOpen(false)}>Close</button>
                      <button className="btn-primary" onClick={handleSaveLog}>
                        <i className="ti ti-check" aria-hidden="true" /> Save entry
                      </button>
                    </div>
                  </div>
                )}

                {/* Phases + Notes summary */}
                <div className="two-col" style={{ marginTop: 16 }}>
                  {/* Phases */}
                  <div className="card">
                    <div className="card-title">Roadmap</div>
                    <div className="card-sub">{activeProject.phases.length} phases · {activeProject.totalDays} days total</div>
                    <div style={{ marginTop: 10 }}>
                      {(() => {
                        let cursor = 0
                        return activeProject.phases.map((ph, i) => {
                          const start = cursor, end = cursor + ph.days; cursor = end
                          let done = 0; for (let d = start; d < end; d++) if (activeProject.completed.has(d)) done++
                          const pp = Math.round(done / ph.days * 100)
                          return (
                            <div key={i} className="phase-item">
                              <div className="phase-num">P{i + 1}</div>
                              <div className="phase-info">
                                <div className="phase-name">{ph.title}</div>
                                <div className="phase-focus">{ph.focus}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="phase-bar"><div className="phase-bar-fill" style={{ width: `${pp}%` }} /></div>
                                <div className="phase-pct">{pp}%</div>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Notes summary */}
                  <div className="card">
                    <div className="card-title">Learning notes summary</div>
                    {(() => {
                      const notes = allNotes(activeProject)
                      const used = new Set(notes.map((n) => n.tag))
                      const filtered = noteFilter === 'All' ? notes : notes.filter((n) => n.tag === noteFilter)
                      return (
                        <>
                          <div className="note-filter">
                            <span
                              className={`filter-chip${noteFilter === 'All' ? ' active active-all' : ''}`}
                              onClick={() => setNoteFilter('All')}
                            >All ({notes.length})</span>
                            {[...tags, ...Array.from(used).filter((t) => !tags.includes(t))].filter((t) => used.has(t)).map((tag) => (
                              <span
                                key={tag}
                                className={`filter-chip${noteFilter === tag ? ' active' : ''}`}
                                style={noteFilter === tag ? { background: tagColor(tag), borderColor: 'transparent', color: '#fff' } : {}}
                                onClick={() => setNoteFilter(tag)}
                              >#{tag} ({notes.filter((n) => n.tag === tag).length})</span>
                            ))}
                          </div>
                          {filtered.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--ink4)', textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>
                              No notes yet. Mark days done and add learn notes.
                            </p>
                          ) : filtered.map((n, i) => (
                            <div key={i} className="note-entry" style={{ borderLeftColor: tagColor(n.tag) }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <span className={`note-badge ${tagClass(n.tag)}`}>#{n.tag}</span>
                                <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>Day {n.day + 1}</span>
                              </div>
                              {n.did && <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 4, fontStyle: 'italic' }}>{n.did}</p>}
                              <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>{n.text}</p>
                            </div>
                          ))}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Mobile nav */}
          <div className="mob-nav">
            {navItems.map((item) => (
              <button
                key={item.view}
                className={`sb-btn ${view === item.view ? 'active' : ''}`}
                onClick={() => { if (item.view === 'create') { go('create') } else { setSelDay(null); go('dashboard') } }}
                aria-label={item.label}
              >
                <i className={`ti ${item.icon}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
