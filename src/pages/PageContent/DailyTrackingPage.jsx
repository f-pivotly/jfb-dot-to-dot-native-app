import { useState, useEffect } from 'react'
import { Box, Text, Group, Button, Select, Textarea, ActionIcon, ScrollArea, UnstyledButton, Image, Badge } from '@mantine/core'
import { IconStar, IconStarFilled, IconPlayerStopFilled, IconTrash, IconUserCircle, IconPlus } from '@tabler/icons-react'
import PickerScreen from './dailyTracking/PickerScreen'
import TimeStepper from './dailyTracking/TimeStepper'
import LaneStepModal from './dailyTracking/LaneStepModal'
import AddPastSessionModal from './dailyTracking/AddPastSessionModal'
import { COLORS, CATEGORY_COLORS, FONT_FAMILY } from './dailyTracking/dotToDotTheme'
import { SAMPLE_PROJECTS } from '../../data/dailyTrackingSampleData'
import brennanLogo from '../../assets/brennan-logo.png'

// Device-local only (crash-recovery testing) — not a Pivotly domain call.
const RECOVERY_KEY = 'dtd_sample_active_session_v1'

function activeTileLabel(project) {
  return project.workType === 'capping' ? 'ACTIVE CAPPING' : 'ACTIVE DREDGING'
}
function activityLabel(activity, project) {
  return activity.active ? activeTileLabel(project) : activity.code
}
function groupColor(project, category) {
  if (!category) return COLORS.secondaryGreen
  const cats = []
  project.delayCodes.forEach((c) => { if (!cats.includes(c.category)) cats.push(c.category) })
  const idx = cats.indexOf(category)
  return idx < 0 ? CATEGORY_COLORS[0] : CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
}
function formatClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
function formatDuration(ms) {
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function formatTimeOfDay(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// Reads any in-progress session left over from before a reload. Only ever
// evaluated once, as a useState lazy initializer (not an effect) — the
// compiler-safe way to hydrate initial state from an external source.
function readRecovery() {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    const proj = SAMPLE_PROJECTS.find((p) => p.id === saved.projectId)
    if (!proj) { localStorage.removeItem(RECOVERY_KEY); return null }
    return { ...saved, project: proj }
  } catch {
    localStorage.removeItem(RECOVERY_KEY)
    return null
  }
}

export default function DailyTrackingPage() {
  const [recovery] = useState(readRecovery)

  const [step, setStep] = useState(recovery ? 'sessionInterrupted' : 'project')
  const [project, setProject] = useState(recovery?.project ?? null)
  const [equipment, setEquipment] = useState(recovery?.equipment ?? null)
  const [operator, setOperator] = useState(recovery?.operator ?? null)
  const [shiftStart, setShiftStart] = useState(null)
  const [shiftTime, setShiftTime] = useState(() => {
    const d = new Date()
    return { hours: d.getHours(), minutes: d.getMinutes() }
  })

  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [favoritesByProject, setFavoritesByProject] = useState({})
  // Lazy initializer (not a bare `useState(Date.now())`) so the one impure
  // call happens once at mount, not on every render — also gives the
  // crash-recovery screen's "ago" readout a valid timestamp to diff against
  // before any session has started ticking.
  const [now, setNow] = useState(() => Date.now())

  const [areaValue, setAreaValue] = useState('')
  const [passValue, setPassValue] = useState('')
  const [notes, setNotes] = useState('')
  const [lastLane, setLastLane] = useState('')
  const [lastStep, setLastStep] = useState('')

  const [laneStepOpen, setLaneStepOpen] = useState(false)
  const [pendingActivity, setPendingActivity] = useState(null)
  const [addPastOpen, setAddPastOpen] = useState(false)
  const [shiftEndOpen, setShiftEndOpen] = useState(false)
  const [shiftEndTime, setShiftEndTime] = useState(() => {
    const d = new Date()
    return { hours: d.getHours(), minutes: d.getMinutes() }
  })
  const [recoveryData, setRecoveryData] = useState(recovery)
  const [recoveryEndTime, setRecoveryEndTime] = useState(() => {
    const rounded = new Date(Math.round(Date.now() / 300000) * 300000)
    return { hours: rounded.getHours(), minutes: rounded.getMinutes() }
  })

  // ── Live timer tick while a session is running ─────────────────────────
  useEffect(() => {
    if (!activeSession) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const favorites = (project && favoritesByProject[project.id]) || []

  // ── Setup flow ──────────────────────────────────────────────────────────
  function selectProject(item) {
    const proj = SAMPLE_PROJECTS.find((p) => p.id === item.id)
    setProject(proj)
    setAreaValue(''); setPassValue('')
    if (proj.equipment.length === 1) {
      setEquipment(proj.equipment[0])
      setStep('operator')
    } else {
      setStep('equipment')
    }
  }
  function selectEquipment(item) {
    setEquipment(item.id)
    setStep('operator')
  }
  function selectOperator(item) {
    setOperator(item.id)
    setStep('shiftStart')
  }
  function confirmShiftStart() {
    const d = new Date()
    d.setHours(shiftTime.hours, shiftTime.minutes, 0, 0)
    if (d > new Date()) d.setDate(d.getDate() - 1)
    setShiftStart(d)
    setStep('tracking')
  }
  function skipShiftStart() {
    setShiftStart(new Date())
    setStep('tracking')
  }

  // ── Session logging ─────────────────────────────────────────────────────
  function persistActiveSession(session) {
    localStorage.setItem(RECOVERY_KEY, JSON.stringify({
      projectId: project.id,
      equipment,
      operator,
      activity: session.activity,
      startTimeISO: session.startTime.toISOString(),
      areaL1: session.areaL1,
      pass: session.pass,
      notes: session.notes,
      lane: session.lane,
      step: session.step,
    }))
  }

  function endActiveSession(endTime) {
    setActiveSession((cur) => {
      if (!cur) return cur
      const end = endTime || new Date()
      setSessions((prev) => [{
        id: crypto.randomUUID(),
        category: cur.activity.active ? activeTileLabel(project) : cur.activity.code,
        delayCategory: cur.activity.active ? null : cur.activity.category,
        startTime: cur.startTime,
        endTime: end,
        durationMs: end - cur.startTime,
        operatorName: operator,
        areaL1: cur.areaL1,
        pass: cur.pass,
        description: cur.notes,
        lane: cur.lane,
        step: cur.step,
      }, ...prev])
      localStorage.removeItem(RECOVERY_KEY)
      return null
    })
  }

  function startSession(activity, lane, stepVal) {
    if (activeSession) endActiveSession()
    const session = {
      activity,
      startTime: new Date(),
      areaL1: areaValue,
      pass: passValue,
      notes,
      lane: lane || '',
      step: stepVal || '',
    }
    setActiveSession(session)
    setNow(Date.now())
    persistActiveSession(session)
  }

  function handleActivityClick(activity) {
    if (project.usesLaneStep) {
      setPendingActivity(activity)
      setLaneStepOpen(true)
      return
    }
    startSession(activity, '', '')
  }

  function handleLaneStepContinue({ lane, step: stepVal }) {
    setLastLane(lane); setLastStep(stepVal)
    setLaneStepOpen(false)
    startSession(pendingActivity, lane, stepVal)
    setPendingActivity(null)
  }

  function toggleFavorite(codeNum) {
    setFavoritesByProject((prev) => {
      const cur = prev[project.id] || []
      const next = cur.includes(codeNum) ? cur.filter((c) => c !== codeNum) : [...cur, codeNum].slice(-5)
      return { ...prev, [project.id]: next }
    })
  }

  function deleteSession(id) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  // ── End of Day ───────────────────────────────────────────────────────────
  function confirmShiftEnd() {
    const end = new Date()
    end.setHours(shiftEndTime.hours, shiftEndTime.minutes, 0, 0)
    if (activeSession) endActiveSession(end)

    const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime)
    const gaps = []
    if (sorted.length === 0 && shiftStart) {
      const totalMs = end - shiftStart
      if (totalMs > 60000) {
        gaps.push({
          id: crypto.randomUUID(), category: 'STARTUP/SHUTDOWN', delayCategory: 'Startup/Shutdown',
          startTime: shiftStart, endTime: end, durationMs: totalMs, operatorName: operator,
          description: 'Full shift startup/shutdown (auto-logged)',
        })
      }
    } else if (sorted.length > 0) {
      const lastEnd = sorted.at(-1).endTime
      const gapMs = end - lastEnd
      if (gapMs > 60000) {
        gaps.push({
          id: crypto.randomUUID(), category: 'STARTUP/SHUTDOWN', delayCategory: 'Startup/Shutdown',
          startTime: lastEnd, endTime: end, durationMs: gapMs, operatorName: operator,
          description: 'Post-shift / ride back to shore (auto-logged)',
        })
      }
    }
    if (gaps.length) setSessions((prev) => [...gaps, ...prev])
    setShiftEndOpen(false)
    setStep('confirmSetup')
  }

  // ── Crash recovery save/discard ─────────────────────────────────────────
  function saveRecoveredSession() {
    const start = new Date(recoveryData.startTimeISO)
    const end = new Date(start)
    end.setHours(recoveryEndTime.hours, recoveryEndTime.minutes, 0, 0)
    if (end <= start) end.setDate(end.getDate() + 1)
    setSessions((prev) => [{
      id: crypto.randomUUID(),
      category: recoveryData.activity.active ? activeTileLabel(project) : recoveryData.activity.code,
      delayCategory: recoveryData.activity.active ? null : recoveryData.activity.category,
      startTime: start, endTime: end, durationMs: end - start,
      operatorName: recoveryData.operator, areaL1: recoveryData.areaL1, pass: recoveryData.pass,
      description: recoveryData.notes, lane: recoveryData.lane, step: recoveryData.step,
    }, ...prev])
    localStorage.removeItem(RECOVERY_KEY)
    setRecoveryData(null)
    setStep('tracking')
  }
  function discardRecoveredSession() {
    localStorage.removeItem(RECOVERY_KEY)
    setRecoveryData(null)
    setStep('tracking')
  }

  // ── Render: crash recovery ──────────────────────────────────────────────
  if (step === 'sessionInterrupted' && recoveryData) {
    const startDt = new Date(recoveryData.startTimeISO)
    const label = recoveryData.activity.active ? activeTileLabel(project) : recoveryData.activity.code
    const badgeColor = recoveryData.activity.active ? COLORS.secondaryGreen : groupColor(project, recoveryData.activity.category)
    const agoMs = now - startDt.getTime()
    const agoH = Math.floor(agoMs / 3600000)
    const agoM = Math.floor((agoMs % 3600000) / 60000)
    return (
      <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.recoveryBg }}>
        <Box p={32} style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', fontFamily: FONT_FAMILY }}>
          <Text style={{ fontSize: 36 }} mb={12}>⚡</Text>
          <Text c="#fff" fw={800} size="xl" mb={6}>Session interrupted</Text>
          <Text c="rgba(255,255,255,0.55)" size="sm" mb={20}>The app closed while a session was running.</Text>
          <Badge size="lg" radius="md" style={{ background: badgeColor, color: '#fff', padding: '10px 22px', height: 'auto', fontSize: 15 }} mb={6}>
            {label}
          </Badge>
          <Text c="rgba(255,255,255,0.6)" size="sm" mt={8}>Started {formatTimeOfDay(startDt)}</Text>
          <Text c="rgba(255,255,255,0.4)" size="xs" mb={24}>({agoH > 0 ? `${agoH}h ${agoM}m ago` : `${agoM}m ago`})</Text>
          <Text c="rgba(255,255,255,0.6)" size="xs" fw={700} tt="uppercase" mb={10}>What time did it end?</Text>
          <TimeStepper hours={recoveryEndTime.hours} minutes={recoveryEndTime.minutes} onChange={setRecoveryEndTime} />
          <Button fullWidth size="lg" mt={24} style={{ background: COLORS.secondaryGreen }} onClick={saveRecoveredSession}>
            ✓ Save Session
          </Button>
          <UnstyledButton mt={10} onClick={discardRecoveredSession} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Discard — session was already stopped
          </UnstyledButton>
        </Box>
      </ScrollArea>
    )
  }

  // ── Render: Select Project / Equipment / Operator ───────────────────────
  if (step === 'project') {
    return (
      <PickerScreen
        title="Select Project"
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        items={SAMPLE_PROJECTS.map((p) => ({ id: p.id, label: p.name, sub: p.client }))}
        selectedId={project?.id}
        onSelect={selectProject}
      />
    )
  }
  if (step === 'equipment' && project) {
    return (
      <PickerScreen
        title="Select Equipment"
        subtitle={project.name}
        items={project.equipment.map((e) => ({ id: e, label: e }))}
        selectedId={equipment}
        onSelect={selectEquipment}
        onBack={() => setStep('project')}
      />
    )
  }
  if (step === 'operator' && project) {
    return (
      <PickerScreen
        title="Who is operating?"
        subtitle={`${equipment} · ${project.name}`}
        items={project.operators.map((o) => ({ id: o, label: o }))}
        selectedId={operator}
        onSelect={selectOperator}
        onBack={() => setStep(project.equipment.length > 1 ? 'equipment' : 'project')}
      />
    )
  }

  // ── Render: Shift Start ──────────────────────────────────────────────────
  if (step === 'shiftStart' && project) {
    return (
      <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.primaryBlue }}>
        <Box p={32} style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', fontFamily: FONT_FAMILY }}>
          <Image src={brennanLogo} h={48} fit="contain" mx="auto" mb={20} />
          <Text c="#fff" fw={800} size="xl" mb={6}>What time did the shift start?</Text>
          <Text c="rgba(255,255,255,0.6)" size="sm" mb={8}>Include safety meeting time — all pre-dredge time logs as Startup/Shutdown</Text>
          <Text c="rgba(255,255,255,0.5)" size="xs" mb={28}>Operator: {operator} · {equipment}</Text>
          <TimeStepper hours={shiftTime.hours} minutes={shiftTime.minutes} onChange={setShiftTime} />
          <Button fullWidth size="lg" mt={24} style={{ background: COLORS.secondaryGreen }} onClick={confirmShiftStart}>
            Confirm Shift Start →
          </Button>
          <UnstyledButton mt={12} onClick={skipShiftStart} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Skip — start from now
          </UnstyledButton>
        </Box>
      </ScrollArea>
    )
  }

  // ── Render: "Good morning" confirm-setup screen ──────────────────────────
  if (step === 'confirmSetup' && project) {
    const rows = [
      { label: 'Project', value: project.name, onEdit: () => setStep('project') },
      { label: 'Equipment', value: equipment, onEdit: () => setStep('equipment') },
      { label: 'Operator', value: operator, onEdit: () => setStep('operator') },
    ]
    return (
      <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.primaryBlue }}>
        <Box p={32} style={{ maxWidth: 460, margin: '0 auto', fontFamily: FONT_FAMILY }}>
          <Image src={brennanLogo} h={44} fit="contain" mx="auto" mb={20} />
          <Text c="#fff" fw={800} size="xl" ta="center" mb={6}>Good morning — confirm your setup</Text>
          <Text c="rgba(255,255,255,0.55)" size="sm" ta="center" mb={24}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          {rows.map((row) => (
            <Group key={row.label} justify="space-between" p={14} mb={10} style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10 }}>
              <Box>
                <Text size="10px" fw={700} c="rgba(255,255,255,0.5)" tt="uppercase" style={{ letterSpacing: '0.06em' }}>{row.label}</Text>
                <Text size="sm" fw={700} c="#fff">{row.value}</Text>
              </Box>
              <UnstyledButton
                onClick={row.onEdit}
                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 7, color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700 }}
              >
                Change
              </UnstyledButton>
            </Group>
          ))}
          <Button fullWidth size="lg" mt={8} style={{ background: COLORS.secondaryGreen }} onClick={() => setStep('shiftStart')}>
            Confirm &amp; Set Shift Start →
          </Button>
        </Box>
      </ScrollArea>
    )
  }

  // ── Render: main tracking screen ────────────────────────────────────────
  if (!project) return null

  const activeIsRunning = !!activeSession
  const seenCats = []
  project.delayCodes.forEach((c) => {
    if (!seenCats.includes(c.category)) seenCats.push(c.category)
  })
  const totalHours = sessions.reduce((sum, s) => sum + s.durationMs, 0) / 3600000

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0, background: COLORS.lightGray }}>
      <Box style={{ fontFamily: FONT_FAMILY }}>
        {/* Identity header — matches .app-header gradient */}
        <Box px={20} py={14} style={{ background: `linear-gradient(135deg, ${COLORS.primaryBlue} 0%, ${COLORS.primaryBlueDark} 100%)` }}>
          <Group justify="space-between" align="center">
            <Group gap={16}>
              <Image src={brennanLogo} h={40} fit="contain" />
              <Box>
                <Text size="sm" fw={700} c="#fff">{project.name}</Text>
                <Text size="xs" c="rgba(255,255,255,0.75)">{equipment} · {operator}</Text>
              </Box>
            </Group>
            <Group gap={10}>
              <ActionIcon
                radius="xl" size={44} title="Change Operator" onClick={() => setStep('operator')}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <IconUserCircle size={18} />
              </ActionIcon>
              <ActionIcon
                radius="xl" size={44} title="Add Past Session" onClick={() => setAddPastOpen(true)}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                <IconPlus size={18} />
              </ActionIcon>
              <Button style={{ background: COLORS.primaryBlue }} onClick={() => setShiftEndOpen(true)}>
                End of Day
              </Button>
            </Group>
          </Group>
        </Box>

        {/* Status bar */}
        <Group justify="space-between" px={20} py={8} style={{ background: COLORS.mediumGray, borderBottom: `1px solid ${COLORS.borderGray}` }}>
          <Text size="xs" fw={600} c={activeIsRunning ? COLORS.secondaryGreen : COLORS.textMedium}>
            {activeIsRunning ? `● Recording: ${activityLabel(activeSession.activity, project)}` : '● Ready - Tap a category to start'}
          </Text>
          <Badge style={{ background: COLORS.primaryBlue, color: '#fff' }} radius="xl">
            {sessions.length} session{sessions.length === 1 ? '' : 's'}
          </Badge>
        </Group>

        {/* Active session bar */}
        {activeIsRunning && (
          <Group justify="space-between" px={20} py={12} mx={15} my={10} style={{ background: COLORS.warningBg, border: `1px solid ${COLORS.warningBorder}`, borderRadius: 8 }}>
            <Box>
              <Text size="sm" fw={700}>{activityLabel(activeSession.activity, project)}</Text>
              <Text size="xs" c={COLORS.warningText} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatClock(now - activeSession.startTime.getTime())}</Text>
            </Box>
            <Button size="xs" leftSection={<IconPlayerStopFilled size={12} />} style={{ background: COLORS.accentRed }} onClick={() => endActiveSession()}>
              Stop
            </Button>
          </Group>
        )}

        {/* Session fields */}
        <Group px={16} py={10} gap={10} align="flex-end" style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6', flexWrap: 'wrap' }}>
          <Select label={project.areaLabel} data={project.areas} value={areaValue} onChange={(v) => setAreaValue(v ?? '')} clearable size="xs" style={{ width: 160 }} />
          <Select label={project.passLabel} data={project.passOptions} value={passValue} onChange={(v) => setPassValue(v ?? '')} clearable size="xs" style={{ width: 140 }} />
          <Textarea label="Notes" placeholder="Optional..." value={notes} onChange={(e) => setNotes(e.currentTarget.value)} autosize minRows={1} size="xs" style={{ flex: 1, minWidth: 200 }} />
        </Group>

        {/* Categories grid */}
        <Box p={16}>
          <UnstyledButton
            disabled={activeIsRunning && activeSession.activity.active}
            onClick={() => handleActivityClick({ active: true })}
            style={{
              display: 'block', width: '100%', padding: 16, borderRadius: 8, marginBottom: 14,
              background: COLORS.secondaryGreen, color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '0.04em',
              textAlign: 'center', opacity: activeIsRunning && activeSession.activity.active ? 0.6 : 1,
            }}
          >
            {activeTileLabel(project)}
          </UnstyledButton>

          {favorites.length > 0 && (
            <>
              <Text size="11px" fw={800} c="#B8860B" tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>★ Favorites</Text>
              <Group gap={10} mb={16}>
                {project.delayCodes.filter((c) => favorites.includes(c.codeNum)).map((c) => (
                  <TileButton key={c.codeNum} code={c} color={groupColor(project, c.category)} isFavorite onToggleFavorite={toggleFavorite} onClick={() => handleActivityClick(c)} isActive={activeIsRunning && !activeSession.activity.active && activeSession.activity.codeNum === c.codeNum} />
                ))}
              </Group>
            </>
          )}

          {seenCats.map((cat) => (
            <Box key={cat} mb={16}>
              <Text size="11px" fw={800} c="#5a6a7a" tt="uppercase" mb={6} style={{ letterSpacing: '0.06em' }}>{cat}</Text>
              <Group gap={10}>
                {project.delayCodes.filter((c) => c.category === cat).map((c) => (
                  <TileButton
                    key={c.codeNum}
                    code={c}
                    color={groupColor(project, cat)}
                    isFavorite={favorites.includes(c.codeNum)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => handleActivityClick(c)}
                    isActive={activeIsRunning && !activeSession.activity.active && activeSession.activity.codeNum === c.codeNum}
                  />
                ))}
              </Group>
            </Box>
          ))}

          <Group justify="flex-end" mt={8}>
            <Text size="sm" fw={700} c={COLORS.primaryBlue}>Total Hours: {totalHours.toFixed(2)}</Text>
          </Group>
        </Box>

        {/* Sessions list */}
        <Box px={16} pb={16}>
          {sessions.length === 0 ? (
            <Box style={{ background: '#fff', border: `1px dashed ${COLORS.borderGray}`, borderRadius: 8 }} py={30}>
              <Text size="sm" c={COLORS.textLight} ta="center">No sessions recorded yet</Text>
              <Text size="xs" c={COLORS.textLight} ta="center" mt={4}>Tap a category to start tracking</Text>
            </Box>
          ) : (
            sessions.map((s) => (
              <Group key={s.id} wrap="nowrap" style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <Box style={{ width: 5, height: 34, borderRadius: 3, background: s.delayCategory ? groupColor(project, s.delayCategory) : COLORS.secondaryGreen, flexShrink: 0 }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={700} c={COLORS.textDark} truncate>
                    {s.category}{s.lane ? ` · Lane ${s.lane}` : ''}{s.step ? ` / Step ${s.step}` : ''}
                  </Text>
                  <Text size="xs" c={COLORS.textMedium}>
                    {formatTimeOfDay(s.startTime)}–{formatTimeOfDay(s.endTime)} · {s.operatorName}
                    {s.areaL1 ? ` · ${s.areaL1}` : ''}{s.pass ? ` · ${s.pass}` : ''}
                  </Text>
                </Box>
                <Text size="sm" fw={700} c={COLORS.primaryBlue} style={{ flexShrink: 0 }}>{formatDuration(s.durationMs)}</Text>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => deleteSession(s.id)}>
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ))
          )}
        </Box>
      </Box>

      <LaneStepModal
        opened={laneStepOpen}
        lastLane={lastLane}
        lastStep={lastStep}
        onCancel={() => { setLaneStepOpen(false); setPendingActivity(null) }}
        onContinue={handleLaneStepContinue}
      />
      <AddPastSessionModal
        opened={addPastOpen}
        onClose={() => setAddPastOpen(false)}
        project={project}
        activeTileLabel={activeTileLabel(project)}
        onSave={(s) => setSessions((prev) => [{ id: crypto.randomUUID(), ...s }, ...prev])}
      />

      {/* End of Day — full-screen overlay, matching the original */}
      {shiftEndOpen && (
        <Box style={{ position: 'fixed', inset: 0, background: COLORS.shiftEndBg, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Box style={{ maxWidth: 380, width: '100%', textAlign: 'center', fontFamily: FONT_FAMILY }}>
            <Text c="#fff" fw={800} size="xl" mb={6}>What time did the shift end?</Text>
            <Text c="rgba(255,255,255,0.6)" size="sm" mb={28}>Include ride back to shore — remaining time logs as Startup/Shutdown</Text>
            <TimeStepper hours={shiftEndTime.hours} minutes={shiftEndTime.minutes} onChange={setShiftEndTime} />
            <Button fullWidth size="lg" mt={24} style={{ background: COLORS.shiftEndAccent }} onClick={confirmShiftEnd}>
              Confirm Shift End →
            </Button>
            <UnstyledButton mt={12} onClick={confirmShiftEnd} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Skip — use current time
            </UnstyledButton>
          </Box>
        </Box>
      )}
    </ScrollArea>
  )
}

function TileButton({ code, color, isFavorite, onToggleFavorite, onClick, isActive }) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '12px 26px 12px 16px',
        borderRadius: 8,
        minWidth: 140,
        boxShadow: isActive ? '0 0 0 3px yellow, 0 4px 12px rgba(0,0,0,0.3)' : 'none',
        background: color,
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.3,
        textAlign: 'center',
      }}
    >
      {code.code}
      <ActionIcon
        variant="transparent"
        size="xs"
        style={{ position: 'absolute', top: 3, right: 5 }}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(code.codeNum) }}
      >
        {isFavorite ? <IconStarFilled size={13} color="#FFD54A" /> : <IconStar size={13} color="rgba(255,255,255,0.55)" />}
      </ActionIcon>
    </UnstyledButton>
  )
}
