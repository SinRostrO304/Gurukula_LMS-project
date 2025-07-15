// src/components/CreateClassDialog.jsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material'

export default function CreateClassDialog({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    section: '',
    subject: '',
    room: '',
    description: '',
  })

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const handleCreate = () => {
    onSubmit({
      name:        form.name.trim(),
      section:     form.section.trim() || undefined,
      subject:     form.subject.trim() || undefined,
      room:        form.room.trim() || undefined,
      description: form.description.trim() || undefined,
    })
    setForm({ name: '', section: '', subject: '', room: '', description: '' })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Class</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            required
            label="Class Name"
            fullWidth
            variant="outlined"
            value={form.name}
            onChange={handleChange('name')}
            helperText="Required"
          />

          <TextField
            label="Section"
            fullWidth
            variant="outlined"
            value={form.section}
            onChange={handleChange('section')}
            helperText="Optional"
          />

          <TextField
            label="Subject"
            fullWidth
            variant="outlined"
            value={form.subject}
            onChange={handleChange('subject')}
            helperText="Optional"
          />

          <TextField
            label="Room"
            fullWidth
            variant="outlined"
            value={form.room}
            onChange={handleChange('room')}
            helperText="Optional"
          />

          <TextField
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={form.description}
            onChange={handleChange('description')}
            helperText="Optional"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          disabled={!form.name.trim()}
          variant="contained"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}