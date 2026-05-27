export function pct(project) {
  return project.totalDays ? Math.round(project.completed.size / project.totalDays * 100) : 0
}

export function streak(project) {
  let s = 0
  while (project.completed.has(s)) s++
  return s
}

export function currentPhase(project) {
  let c = 0
  for (const ph of project.phases) {
    if (project.completed.size <= c + ph.days) return ph.title
    c += ph.days
  }
  return project.phases[project.phases.length - 1].title
}

export function allNotes(project) {
  const out = []
  Object.entries(project.logs).forEach(([day, log]) => {
    if (log.notes) {
      log.notes.forEach((n) => out.push({ ...n, day: parseInt(day), did: log.did || '' }))
    }
  })
  return out.sort((a, b) => b.day - a.day)
}

export function tagColor(tag) {
  if (tag === 'Do') return 'var(--pu)'
  if (tag === "Don't") return 'var(--or)'
  if (tag === 'Insight') return 'var(--gr)'
  return 'var(--bl)'
}

export function tagClass(tag) {
  if (tag === 'Do') return 'Do'
  if (tag === "Don't") return 'Dont'
  if (tag === 'Insight') return 'Insight'
  return 'other'
}

export const DEFAULT_TAGS = ['Do', "Don't", 'Insight', 'other']
