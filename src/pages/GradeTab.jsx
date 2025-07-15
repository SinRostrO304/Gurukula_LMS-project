// src/pages/GradeTab.jsx
import React, { useState, useEffect, useContext } from 'react'
// Chart.js + react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// MUI components
import {
  Avatar,
  Box,
  Typography,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material'

// Icons
import EditIcon    from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import CommentIcon  from '@mui/icons-material/ChatBubbleOutline'
import EmailIcon    from '@mui/icons-material/Email'

import { AuthContext } from '../auth/AuthProvider'
import api             from '../utils/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartJSTooltip,
  Legend
)

export default function GradeTab({ classId }) {
  const { token } = useContext(AuthContext)

  // State hooks
  const [overview, setOverview]         = useState(null)
  const [assignments, setAssignments]   = useState([])
  const [students, setStudents]         = useState([])
  const [grades, setGrades]             = useState({})

  const [selectedRows, setSelectedRows] = useState([])
  const [bulkAction, setBulkAction]     = useState('')

  const [editing, setEditing]           = useState({}) // { studentId, assignId, value }
  const [searchTerm, setSearchTerm]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [detailOpen, setDetailOpen]         = useState(false)
  const [detailStudent, setDetailStudent]   = useState(null)
  const [detailRecords, setDetailRecords]   = useState([])
  const [detailLoading, setDetailLoading]   = useState(false)

  const [commentOpen, setCommentOpen]       = useState(false)
  const [commenting, setCommenting]         = useState({ stuId: null, asgId: null })
  const [commentsList, setCommentsList]     = useState([])
  const [newCommentText, setNewCommentText] = useState('')

  // Fetch overview, assignments, students, grades
  useEffect(() => {
    async function loadAll() {
      // 1) Overview
      const ov = await api
        .get(`/classes/${classId}/grades/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.data)
      setOverview(ov)

      // 2) Assignments
      const asgs = await api
        .get(`/classes/${classId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.data)
      setAssignments(asgs)

      // 3) Students
      const studs = await api
        .get(`/classes/${classId}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.data)
      setStudents(studs)

      // 4) Grades matrix
      const matrix = {}
      for (let stu of studs) {
        const recs = await api
          .get(`/classes/${classId}/students/${stu.id}/assignments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(r => r.data)
        matrix[stu.id] = {}
        recs.forEach(x => {
          matrix[stu.id][x.id] = { status: x.status, grade: x.grade }
        })
      }
      setGrades(matrix)
    }
    loadAll()
  }, [classId, token])

  // Save grade (skip blank/non-numeric)
  const saveGrade = async (stuId, asgId, value) => {
    const raw = (value ?? '').toString().trim()
    if (!raw || isNaN(Number(raw))) {
      setEditing({})
      return
    }
    const gradeNum = Number(raw)
    await api.put(
      `/classes/${classId}/assignments/${asgId}/grades`,
      { studentId: stuId, grade: gradeNum },
      { headers: { Authorization: `Bearer ${token}` }}
    )
    setGrades(g => ({
      ...g,
      [stuId]: {
        ...g[stuId],
        [asgId]: { ...g[stuId][asgId], grade: gradeNum }
      }
    }))
    setEditing({})
  }

  // Bulk actions
  const applyBulk = async () => {
    if (bulkAction === 'remind') {
      await api.post(
        `/classes/${classId}/grades/bulk/remind`,
        { studentIds: selectedRows },
        { headers: { Authorization: `Bearer ${token}` }}
      )
    } else if (bulkAction === 'curve') {
      const delta = 2
      await api.post(
        `/classes/${classId}/grades/bulk/curve`,
        { studentIds: selectedRows, delta },
        { headers: { Authorization: `Bearer ${token}` }}
      )
      // Could reload matrix here
    }
    setBulkAction('')
    setSelectedRows([])
  }

  // Open student detail dialog
  const openDetail = async stu => {
    setDetailStudent(stu)
    setDetailOpen(true)
    setDetailLoading(true)
    const recs = await api
      .get(`/classes/${classId}/students/${stu.id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.data)
    setDetailRecords(recs)
    setDetailLoading(false)
  }

  // Comment editor
  const openCommentEditor = async (stuId, asgId) => {
    setCommenting({ stuId, asgId })
    setCommentOpen(true)
    const { data } = await api.get(
      `/classes/${classId}/assignments/${asgId}/private-comments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { studentId: stuId }
      }
    )
    setCommentsList(data)
  }
  const sendComment = async () => {
    const { stuId, asgId } = commenting
    await api.post(
      `/classes/${classId}/assignments/${asgId}/private-comments`,
      { studentId: stuId, text: newCommentText },
      { headers: { Authorization: `Bearer ${token}` }}
    )
    setCommentsList(cl => [
      ...cl,
      { text: newCommentText, createdAt: new Date() }
    ])
    setNewCommentText('')
  }
  const sendEmailComments = async () => {
    const { stuId, asgId } = commenting
    await api.post(
      `/classes/${classId}/assignments/${asgId}/email-comments`,
      { studentId: stuId },
      { headers: { Authorization: `Bearer ${token}` }}
    )
    setCommentOpen(false)
  }

  // Export full gradebook CSV
  const exportFullCSV = () => {
    window.open(
      `${process.env.REACT_APP_API_URL}/classes/${classId}/grades/csv`,
      '_blank'
    )
  }

  // Loading state
  if (!overview || !assignments.length || !students.length) {
    return (
      <CircularProgress
        sx={{ mt: 4, mx: 'auto', display: 'block' }}
      />
    )
  }

  // Build filtered student list
  const now = new Date()
  const threshold = 50
  const filteredStudents = students
    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(stu => {
      if (!filterStatus) return true
      const statuses = Object.values(grades[stu.id] || {}).map(g => g.status)
      const avg =
        Object.values(grades[stu.id] || {})
          .reduce((sum, g) => sum + (g.grade || 0), 0) /
        (statuses.length || 1)
      if (filterStatus === 'missing') return statuses.includes('missing')
      if (filterStatus === 'late') return statuses.includes('late')
      if (filterStatus === 'low') return avg < threshold
      return true
    })

  return (
    <Box>
      {/* Overview Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle2">Class Average</Typography>
          <Typography variant="h5">{overview.avg.toFixed(1)}</Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle2">High / Low</Typography>
          <Typography variant="h6">
            {overview.high} / {overview.low}
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="subtitle2">On-Time</Typography>
          <Typography variant="h6">{overview.onTime}%</Typography>
          <Typography variant="subtitle2">Late</Typography>
          <Typography variant="h6">{overview.late}%</Typography>
          <Typography variant="subtitle2">Missing</Typography>
          <Typography variant="h6">{overview.missing}%</Typography>
        </Paper>
      </Box>

      {/* Search & Filter */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Search students..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            label="Filter"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="missing">Missing</MenuItem>
            <MenuItem value="late">Late</MenuItem>
            <MenuItem value="low">Low Grades</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Bulk Actions & Export */}
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <FormControl sx={{ width: 200 }}>
          <InputLabel>Bulk Action</InputLabel>
          <Select
            value={bulkAction}
            label="Bulk Action"
            onChange={e => setBulkAction(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="remind">Remind Students</MenuItem>
            <MenuItem value="curve">Curve +2</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          disabled={!bulkAction || !selectedRows.length}
          onClick={applyBulk}
        >
          Apply
        </Button>
        <Button variant="contained" onClick={exportFullCSV}>
          Export Full CSV
        </Button>
      </Stack>

      {/* Gradebook Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedRows.length > 0 &&
                    selectedRows.length < filteredStudents.length
                  }
                  checked={
                    selectedRows.length === filteredStudents.length
                  }
                  onChange={e =>
                    setSelectedRows(
                      e.target.checked
                        ? filteredStudents.map(s => s.id)
                        : []
                    )
                  }
                />
              </TableCell>
              <TableCell>Student</TableCell>
              {assignments.map(a => (
                <TableCell key={a.id} align="center">
                  {a.title.slice(0, 10)}…
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map(stu => {
              const rowGrades = grades[stu.id] || {}
              return (
                <TableRow
                  key={stu.id}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.includes(stu.id)}
                      onChange={e => {
                        const yes = e.target.checked
                        setSelectedRows(ids =>
                          yes
                            ? [...ids, stu.id]
                            : ids.filter(x => x !== stu.id)
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={stu.avatarUrl}
                      sx={{ width: 32, height: 32 }}
                    >
                      {stu.name[0]}
                    </Avatar>
                    <Tooltip title="View details">
                      <Typography
                        variant="body2"
                        sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => openDetail(stu)}
                      >
                        {stu.name}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  {assignments.map(a => {
                    const cell = rowGrades[a.id] || {}
                    const icon =
                      cell.status === 'graded'
                        ? '✓'
                        : cell.status === 'submitted'
                        ? ''
                        : cell.status === 'missing'
                        ? '✗'
                        : '!'
                    const isEditing =
                      editing.studentId === stu.id &&
                      editing.assignId === a.id

                    // Allow edit only after due date
                    const dueDate = a.due ? new Date(a.due) : null
                    const canEdit = dueDate && dueDate <= now

                    return (
                      <TableCell key={a.id} align="center">
                        {isEditing ? (
                          <TextField
                            value={editing.value}
                            onChange={ev =>
                              setEditing(prev => ({
                                ...prev,
                                value: ev.target.value
                              }))
                            }
                            onBlur={() => saveGrade(stu.id, a.id, editing.value)}
                            size="small"
                            autoFocus
                          />
                        ) : (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.5
                            }}
                          >
                            {icon && <Typography>{icon}</Typography>}
                            <Typography>
                              {cell.grade != null ? cell.grade : '—'}
                            </Typography>
                            {canEdit ? (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setEditing({
                                    studentId: stu.id,
                                    assignId: a.id,
                                    value: cell.grade ?? ''
                                  })
                                }
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <Tooltip title="Cannot grade until due date has passed">
                                <span>
                                  <IconButton size="small" disabled>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => openCommentEditor(stu.id, a.id)}
                            >
                              <CommentIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Student Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{detailStudent?.name}’s Record</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <CircularProgress sx={{ mt: 4, mx: 'auto', display: 'block' }} />
          ) : (
            <Stack spacing={3}>
              {/* Performance Chart */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Line
                    redraw
                    data={{
                      labels: detailRecords.map(r => r.title),
                      datasets: [
                        {
                          label: 'Grade',
                          data: detailRecords.map(r => r.grade || 0),
                          borderColor: '#1976d2',
                          backgroundColor: context => {
                            const chart = context.chart
                            const { ctx, chartArea } = chart
                            if (!chartArea) {
                              return 'rgba(25,118,210,0.25)'
                            }
                            const gradient = ctx.createLinearGradient(
                              0,
                              chartArea.top,
                              0,
                              chartArea.bottom
                            )
                            gradient.addColorStop(0, 'rgba(25,118,210,0.4)')
                            gradient.addColorStop(1, 'rgba(25,118,210,0)')
                            return gradient
                          },
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          fill: true
                        }
                      ]
                    }}
                    options={{
                      plugins: { legend: { position: 'bottom' } },
                      scales: {
                        x: { grid: { color: 'rgba(0,0,0,0.05)' } },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                      },
                      interaction: { mode: 'index', intersect: false }
                    }}
                  />
                </Paper>
              </Box>

              <Divider />

              {/* Attachments */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Student Submissions
                </Typography>
                <List dense>
                  {detailRecords.flatMap(r => r.files || []).map(f => (
                    <ListItem
                      key={f.id}
                      secondaryAction={
                        <IconButton onClick={() => window.open(f.url, '_blank')}>
                          <DownloadIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={f.filename} />
                    </ListItem>
                  ))}
                  {!detailRecords.some(r => r.files?.length) && (
                    <Typography color="text.secondary" sx={{ pl: 2 }}>
                      No files submitted.
                    </Typography>
                  )}
                </List>
              </Box>

              <Divider />

              {/* Assignment Records */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Assignment Records
                </Typography>
                <List>
                  {detailRecords.map(r => (
                    <ListItem key={r.id}>
                      <ListItemText
                        primary={r.title}
                        secondary={
                          <>
                            <Typography component="span">
                              Due:{' '}
                              {r.due
                                ? new Date(r.due).toLocaleDateString()
                                : '–'}
                            </Typography>
                            {' — '}
                            <Typography component="span">
                              Status: {r.status}
                            </Typography>
                            {r.graded && <> — Grade: {r.grade}</>}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() =>
              window.open(
                `${process.env.REACT_APP_API_URL}/classes/${classId}/grades/csv`,
                '_blank'
              )
            }
          >
            Export CSV
          </Button>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Inline Comment Dialog */}
      <Dialog
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Feedback for{' '}
          {students.find(s => s.id === commenting.stuId)?.name} –{' '}
          {assignments.find(a => a.id === commenting.asgId)?.title}
        </DialogTitle>
        <DialogContent>
          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
            {commentsList.map((c, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={c.text}
                  secondary={new Date(c.createdAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add feedback…"
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentOpen(false)}>Cancel</Button>
          <Button onClick={sendComment}>Send Feedback</Button>
          <Button startIcon={<EmailIcon />} onClick={sendEmailComments}>
            Email to Student
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}