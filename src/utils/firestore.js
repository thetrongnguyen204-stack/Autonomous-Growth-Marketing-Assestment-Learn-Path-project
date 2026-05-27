import { db } from '../firebase'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'

const projectsCol = (uid) => collection(db, 'users', uid, 'projects')
const projectDoc = (uid, id) => doc(db, 'users', uid, 'projects', id)

// Create a new project
export async function createProject(uid, project) {
  const ref = await addDoc(projectsCol(uid), {
    name: project.name,
    goal: project.goal,
    commitment: project.commitment,
    totalDays: project.totalDays,
    summary: project.summary,
    phases: project.phases,
    completed: [],
    logs: {},
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// Subscribe to all projects (real-time)
export function watchProjects(uid, callback) {
  const q = query(projectsCol(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      // Convert completed array back to Set for local use
      completed: new Set(d.data().completed || []),
      // Ensure logs is an object
      logs: d.data().logs || {},
    }))
    callback(projects)
  })
}

// Toggle a day's completion
export async function toggleDay(uid, projectId, dayIndex, currentCompleted) {
  const arr = Array.from(currentCompleted)
  const idx = arr.indexOf(dayIndex)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(dayIndex)
  await updateDoc(projectDoc(uid, projectId), { completed: arr })
}

// Mark a day as done (without toggling)
export async function markDayDone(uid, projectId, dayIndex, currentCompleted) {
  const arr = Array.from(currentCompleted)
  if (!arr.includes(dayIndex)) arr.push(dayIndex)
  await updateDoc(projectDoc(uid, projectId), { completed: arr })
}

// Save a day's log entry
export async function saveDayLog(uid, projectId, dayIndex, logEntry, currentCompleted, currentLogs) {
  const newLogs = { ...currentLogs, [dayIndex]: logEntry }
  const arr = Array.from(currentCompleted)
  if (!arr.includes(dayIndex)) arr.push(dayIndex)
  await updateDoc(projectDoc(uid, projectId), {
    logs: newLogs,
    completed: arr,
  })
}

// Delete a project
export async function deleteProject(uid, projectId) {
  await deleteDoc(projectDoc(uid, projectId))
}
