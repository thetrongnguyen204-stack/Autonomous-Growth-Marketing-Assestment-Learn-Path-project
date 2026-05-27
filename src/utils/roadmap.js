import { generateRoadmapFn } from '../firebase'

// Local fallback if Cloud Function fails
function localRoadmap({ name, goal, commitment }) {
  const n = parseInt((goal.match(/\d+/) || ['30'])[0], 10)
  const totalDays = Math.min(90, Math.max(14, Math.round(n * 0.4) || 28))
  const splits = [
    [0.2, 'Foundation', 'Build the base and establish daily rhythm'],
    [0.3, 'Skill build', 'Increase volume and lock in core techniques'],
    [0.3, 'Deep work', 'Raise intensity, tackle harder challenges'],
    [0.2, 'Peak & review', 'Test limits and consolidate everything'],
  ]
  let used = 0
  const phases = splits.map(([r, t, f], i) => {
    const d = i === splits.length - 1 ? totalDays - used : Math.max(1, Math.round(totalDays * r))
    used += d
    return { title: t, days: d, focus: f }
  })
  return {
    totalDays,
    summary: `A ${totalDays}-day path to: "${goal.trim()}" at ${commitment.trim()}.`,
    phases,
  }
}

export async function generateRoadmap({ name, goal, commitment }) {
  try {
    const result = await generateRoadmapFn({ name, goal, commitment })
    const data = result.data
    // Validate
    if (!data.phases?.length || !data.totalDays) throw new Error('Invalid response')
    const sum = data.phases.reduce((a, p) => a + p.days, 0)
    if (sum !== data.totalDays) data.totalDays = sum
    return data
  } catch (e) {
    console.warn('Cloud Function failed, using local fallback:', e.message)
    return localRoadmap({ name, goal, commitment })
  }
}
