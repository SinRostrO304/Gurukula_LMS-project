// src/pages/PeopleTab.jsx
import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { AuthContext } from '../auth/AuthProvider'
import api from '../utils/api'

export default function PeopleTab({ classId }) {
  const { token } = useContext(AuthContext)

  const [owner, setOwner]       = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)

  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction]   = useState('')

  const [inviteOpen, setInviteOpen]       = useState(false)
  const [inviteRole, setInviteRole]       = useState('student')
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  const [detailOpen, setDetailOpen]       = useState(false)
  const [detailStudent, setDetailStudent] = useState(null)
  const [detailRows, setDetailRows]       = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchPeople() {
      setLoading(true)

      // 1) fetch class for ownerId
      const cls = await api
        .get(`/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.data.class)

      // 2) fetch owner profile
      const ownerProfile = await api
        .get(`/users/${cls.ownerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.data.user)
      setOwner(ownerProfile)

      // 3) fetch students
      const studs = await api
        .get(`/classes/${classId}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => r.data)
      setStudents(studs)

      setLoading(false)
    }
    fetchPeople()
  }, [classId, token])

  const handleInvite = async () => {
    setInviteLoading(true)
    try {
      await api.post(
        `/classes/${classId}/invite`,
        { email: inviteEmail.trim(), role: inviteRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (inviteRole === 'student') {
        const studs = await api
          .get(`/classes/${classId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(r => r.data)
        setStudents(studs)
      }
      setInviteOpen(false)
      setInviteEmail('')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleBulk = async () => {
    if (!bulkAction || !selectedIds.length) return

    if (bulkAction === 'email') {
      await api.post(
        `/classes/${classId}/students/bulk/email`,
        { ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }
    if (bulkAction === 'remove') {
      await api.post(
        `/classes/${classId}/students/bulk/remove`,
        { ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setStudents(students.filter(s => !selectedIds.includes(s.id)))
      setSelectedIds([])
    }
    setBulkAction('')
  }

  const handleOpenDetail = async stu => {
    setDetailStudent(stu)
    setDetailOpen(true)
    setDetailLoading(true)

    const rows = await api
      .get(
        `/classes/${classId}/students/${stu.id}/assignments`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(r => r.data)

    setDetailRows(rows)
    setDetailLoading(false)
  }

  const handleDownloadCSV = () => {
    window.open(
      `${process.env.REACT_APP_API_URL}/classes/${classId}/students/${detailStudent.id}/assignments/csv`,
      '_blank'
    )
  }

  if (loading) {
    return <CircularProgress sx={{ mt: 4, mx: 'auto', display: 'block' }} />
  }

  // Filter students by search term
  const filteredStudents = students.filter(s => {
    const name = s.name || ''
    return name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  })

  return (
    <Box>
      {/* Teachers Section */}
      <Box sx={{ pt: 2, mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Teachers</Typography>
          <Button
            variant="contained"
            sx={{ borderRadius: '9999px', px: 3, py: 1 }}
            onClick={() => {
              setInviteRole('teacher')
              setInviteOpen(true)
            }}
          >
            Invite Teacher
          </Button>
        </Stack>
        {owner && (
          <List disablePadding>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={owner.picture} />
              </ListItemAvatar>
              <ListItemText
                primary={owner.name}
                secondary={owner.email}
              />
            </ListItem>
          </List>
        )}
      </Box>

      {/* Students Section */}
      <Box sx={{ pt: 2, mb: 4 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Students</Typography>
          <Button
            variant="contained"
            sx={{ borderRadius: '9999px', px: 3, py: 1 }}
            onClick={() => {
              setInviteRole('student')
              setInviteOpen(true)
            }}
          >
            Invite Student
          </Button>
        </Stack>

        {/* Search Input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search students..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Bulk Actions */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <FormControl sx={{ width: 200 }}>
            <InputLabel>Bulk Action</InputLabel>
            <Select
              value={bulkAction}
              label="Bulk Action"
              onChange={e => setBulkAction(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="email">Send Email</MenuItem>
              <MenuItem value="remove">Remove</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            disabled={!bulkAction || !selectedIds.length}
            onClick={handleBulk}
          >
            Apply
          </Button>
        </Stack>

        {/* Student List */}
        <List>
          {filteredStudents.map(s => (
            <ListItem
              key={s.id}
              disablePadding
              sx={{ cursor: 'pointer' }}
              onClick={() => handleOpenDetail(s)}
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={selectedIds.includes(s.id)}
                  onChange={e => {
                    const checked = e.target.checked
                    setSelectedIds(ids =>
                      checked
                        ? [...ids, s.id]
                        : ids.filter(x => x !== s.id)
                    )
                  }}
                />
              }
            >
              <ListItemAvatar>
                <Avatar src={s.picture} />
              </ListItemAvatar>
              <ListItemText
                primary={s.name}
                secondary={s.email}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Invite Dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Invite {inviteRole === 'teacher' ? 'Teacher' : 'Student'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || inviteLoading}
          >
            {inviteLoading ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {detailStudent?.name}’s Assignments
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 200 }}>
          {detailLoading ? (
            <CircularProgress
              sx={{ mt: 4, mx: 'auto', display: 'block' }}
            />
          ) : (
            <Box>
              <Button
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={handleDownloadCSV}
              >
                Export to CSV
              </Button>
              <List>
                {detailRows.map(r => (
                  <ListItem key={r.id}>
                    <ListItemText
                      primary={r.title}
                      secondary={
                        <>
                          <Typography component="span">
                            Due:{' '}
                            {r.due
                              ? new Date(r.due).toLocaleString()
                              : '–'}
                          </Typography>
                          {' — '}
                          <Typography
                            component="span"
                            color={
                              r.status === 'missing'
                                ? 'error.main'
                                : r.status === 'late'
                                ? 'warning.main'
                                : undefined
                            }
                          >
                            {r.status.charAt(0).toUpperCase() +
                              r.status.slice(1)}
                          </Typography>
                          {r.graded && <> — Grade: {r.grade}</>}
                        </>
                      }
                    />
                  </ListItem>
                ))}
                {!detailRows.length && (
                  <Typography color="text.secondary">
                    No assignments.
                  </Typography>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}