// src/pages/ClassworkDetailPage.jsx
import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material'
import UploadIcon       from '@mui/icons-material/Upload'
import DownloadIcon     from '@mui/icons-material/Download'
import ChatIcon         from '@mui/icons-material/ChatBubbleOutline'
import SendIcon         from '@mui/icons-material/Send'
import AttachFileIcon   from '@mui/icons-material/AttachFile'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'

import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

// Stub for file storage—replace with real uploader
async function uploadToStorage(file) {
  return `/uploads/${file.originalname}`
}

export default function ClassworkDetailPage() {
  const { id: classId, aid: cwId } = useParams()
  const { token } = useContext(AuthContext)
  const fileInput = useRef()

  // state
  const [loading, setLoading]               = useState(true)
  const [details, setDetails]               = useState(null)
  const [materials, setMaterials]           = useState([])
  const [publicComments, setPublicComments] = useState([])
  const [privateComments, setPrivateComments]=useState([])
  const [replyText, setReplyText]           = useState({ public:'', private:'' })
  const [files, setFiles]                   = useState([])
  const [isDone, setIsDone]                 = useState(false)

  // drag & drop sensor
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }))

  // load all data
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // 1) details
        const { data: det } = await api.get(
          `/classes/${classId}/assignments/${cwId}/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setDetails(det)

        // 2) materials
        const { data: mats } = await api.get(
          `/classes/${classId}/assignments/${cwId}/materials`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setMaterials(mats)

        // 3) public + private comments
        const [pubRes, privRes] = await Promise.all([
          api.get(`/classes/${classId}/assignments/${cwId}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get(`/classes/${classId}/assignments/${cwId}/private-comments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        setPublicComments(pubRes.data)
        setPrivateComments(privRes.data)

        // 4) submission state
        const { data: sub } = await api.get(
          `/classes/${classId}/assignments/${cwId}/submission`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setFiles(sub.files || [])
        setIsDone(sub.done)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [classId, cwId, token])

  // await initial load
  if (loading || !details) {
    return <CircularProgress sx={{ mt:4, mx:'auto', display:'block' }}/>
  }

  // reply handlers
  const handlePublicReply = async () => {
    const text = replyText.public.trim()
    if (!text) return
    const { data: c } = await api.post(
      `/classes/${classId}/assignments/${cwId}/comments`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setPublicComments(cs => [...cs, c])
    setReplyText(rt => ({ ...rt, public:'' }))
  }
  const handlePrivateReply = async () => {
    const text = replyText.private.trim()
    if (!text) return
    const { data: c } = await api.post(
      `/classes/${classId}/assignments/${cwId}/private-comments`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setPrivateComments(cs => [...cs, c])
    setReplyText(rt => ({ ...rt, private:'' }))
  }

  // file selection & drop
  const handleFileSelect = e => {
    setFiles(f => [...f, ...Array.from(e.target.files)])
  }
  const handleDrop = e => {
    e.preventDefault()
    setFiles(f => [...f, ...Array.from(e.dataTransfer.files)])
  }

  // submit files
  const handleSubmit = async () => {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    await api.post(
      `/classes/${classId}/assignments/${cwId}/submit`,
      fd,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }

  // mark/unmark done
  const toggleDone = async () => {
    const newDone = !isDone
    setIsDone(newDone)
    await api.put(
      `/classes/${classId}/assignments/${cwId}/mark-done`,
      { done: newDone },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  }

  return (
    <Box sx={{ p:2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h4">{details.title}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Due: {details.due
              ? new Date(details.due).toLocaleString()
              : 'No due date'}
          </Typography>
        </Box>
      </Stack>

      {/* Materials */}
      <Typography variant="h6" mb={1}>Materials</Typography>
      <List dense>
        {materials.map(m => (
          <ListItem key={m.id} divider>
            <ListItemText primary={m.filename}/>
            <IconButton onClick={()=>window.open(m.url,'_blank')}>
              <DownloadIcon/>
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my:2 }} />

      {/* Public Comments */}
      <Typography variant="h6" mb={1}>Comments</Typography>
      <List dense sx={{ maxHeight:200, overflow:'auto', mb:1 }}>
        {publicComments.map(c => (
          <ListItem key={c.id} alignItems="flex-start">
            <ListItemText primary={c.authorName} secondary={c.text}/>
          </ListItem>
        ))}
      </List>
      <Stack direction="row" spacing={1} mb={4}>
        <TextField
          fullWidth size="small"
          placeholder="Write a comment…"
          value={replyText.public}
          onChange={e=>setReplyText(rt=>({...rt, public:e.target.value}))}
        />
        <IconButton onClick={handlePublicReply}><SendIcon/></IconButton>
      </Stack>

      {/* Private Comments */}
      <Typography variant="h6" mb={1}>Private Comments</Typography>
      <List dense sx={{ maxHeight:200, overflow:'auto', mb:1 }}>
        {privateComments.map(c => (
          <ListItem key={c.id} alignItems="flex-start">
            <ListItemText primary={c.authorName} secondary={c.text}/>
          </ListItem>
        ))}
      </List>
      <Stack direction="row" spacing={1} mb={4}>
        <TextField
          fullWidth size="small"
          placeholder="Message teacher…"
          value={replyText.private}
          onChange={e=>setReplyText(rt=>({...rt, private:e.target.value}))}
        />
        <IconButton onClick={handlePrivateReply}><SendIcon/></IconButton>
      </Stack>

      {/* Submission Area */}
      <Typography variant="h6" mb={1}>Your Submission</Typography>
      <DndContext sensors={sensors} onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
        <Paper
          variant="outlined"
          sx={{
            p:2,
            minHeight:120,
            borderStyle:'dashed',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            mb:2
          }}
          onDragOver={e=>e.preventDefault()}
          onDrop={handleDrop}
        >
          <Typography>Drag & drop files here, or</Typography>
          <IconButton sx={{ ml:1 }} onClick={()=>fileInput.current.click()}>
            <AttachFileIcon/>
          </IconButton>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={handleFileSelect}
          />
        </Paper>
      </DndContext>
      <List dense sx={{ mb:2 }}>
        {files.map((f,i) => (
          <ListItem key={i}>
            <ListItemText primary={f.name} secondary={`${(f.size/1024).toFixed(1)} KB`}/>
          </ListItem>
        ))}
      </List>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<UploadIcon/>}
          disabled={!files.length}
          onClick={handleSubmit}
        >
          Submit
        </Button>

        <Button
          variant={isDone ? 'outlined' : 'contained'}
          onClick={toggleDone}
        >
          {isDone ? 'Mark as Undone' : 'Mark as Done'}
        </Button>
      </Stack>
    </Box>
  )
}
