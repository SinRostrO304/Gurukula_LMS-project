// src/pages/GeneralTab.jsx
import React, { useState, useEffect, useContext, useRef } from 'react'
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Collapse,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Link as MuiLink
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as PhotoCameraIcon,
  InfoOutlined as InfoOutlinedIcon,
  PushPin as PushPinIcon,
  ChatBubbleOutline as ChatIcon,
  Send as SendIcon,
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw
} from 'draft-js'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function GeneralTab({ classId }) {
  const { token } = useContext(AuthContext)
  const fileRef = useRef()

  // Class info
  const [cls, setCls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [infoOpen, setInfoOpen] = useState(false)

  // Announcements
  const [announcements, setAnnouncements] = useState([])
  const [annOpen, setAnnOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  )

  // 1) Scheduling state
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [schedule, setSchedule] = useState(null)

  // Comments
  const [comments, setComments] = useState({})
  const [commentOpen, setCommentOpen] = useState({})
  const [replyText, setReplyText] = useState({})

  // Fetch class + announcements
  useEffect(() => {
    api
      .get(`/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setCls(r.data.class))
      .catch(() => {})
      .finally(() => setLoading(false))

    api
      .get(`/classes/${classId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setAnnouncements(r.data))
      .catch(() => {})
  }, [classId, token])

  if (loading) {
    return <CircularProgress sx={{ mt: 4, mx: 'auto' }} />
  }

  const {
    name,
    section,
    subject,
    room,
    description,
    code,
    coverUrl
  } = cls || {}

  // Cover upload
  const handleCustomize = () => fileRef.current.click()
  const onFileChange = ({ target }) => {
    const f = target.files?.[0]
    if (!f) return
    const fd = new FormData()
    fd.append('cover', f)
    api
      .put(`/classes/${classId}/cover`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setCls(c => ({ ...c, coverUrl: r.data.coverUrl })))
  }

  // Save announcement
  const saveAnnouncement = async () => {
    const raw = convertToRaw(editorState.getCurrentContent())
    const payload = {
      title: title.trim(),
      content: JSON.stringify(raw),
      // 4) only include schedule if it's a future Date
      schedule:
        scheduleEnabled && schedule && schedule > new Date()
          ? schedule
          : null
    }

    let data
    if (editingId) {
      ;({ data } = await api.put(
        `/classes/${classId}/announcements/${editingId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ))
      setAnnouncements(prev =>
        prev.map(a => (a.id === data.id ? data : a))
      )
    } else {
      ;({ data } = await api.post(
        `/classes/${classId}/announcements`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      ))
      setAnnouncements(prev => [data, ...prev])
    }
    resetForm()
  }
  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setEditorState(EditorState.createEmpty())
    setScheduleEnabled(false)
    setSchedule(null)
    setAnnOpen(false)
  }

  // Pin/Delete
  const togglePin = async ann => {
    const { data } = await api.put(
      `/classes/${classId}/announcements/${ann.id}/pin`,
      { pinned: !ann.pinned },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setAnnouncements(prev =>
      prev.map(a => (a.id === data.id ? data : a))
    )
  }
  const deleteAnn = async ann => {
    await api.delete(
      `/classes/${classId}/announcements/${ann.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setAnnouncements(prev => prev.filter(a => a.id !== ann.id))
  }

  // Comments
  const loadComments = annId => {
    if (comments[annId]) return
    api
      .get(`/classes/${classId}/announcements/${annId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setComments(c => ({ ...c, [annId]: r.data })))
  }
  const toggleComment = annId =>
    setCommentOpen(prev => {
      const open = !prev[annId]
      if (open) loadComments(annId)
      return { ...prev, [annId]: open }
    })
  const postReply = async annId => {
    const text = (replyText[annId] || '').trim()
    if (!text) return
    const { data } = await api.post(
      `/classes/${classId}/announcements/${annId}/comments`,
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setComments(c => ({
      ...c,
      [annId]: [...(c[annId] || []), data]
    }))
    setReplyText(r => ({ ...r, [annId]: '' }))
  }

  // Sort announcements (pinned first, then by date)
  const now = new Date()
  const sorted = announcements
    .filter(a => !a.schedule || new Date(a.schedule) <= now)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (
        new Date(b.schedule || b.created_at) -
        new Date(a.schedule || a.created_at)
      )
    })

  // Draft.js handlers
  const handleKeyCmd = cmd => {
    const st = RichUtils.handleKeyCommand(editorState, cmd)
    if (st) {
      setEditorState(st)
      return 'handled'
    }
    return 'not-handled'
  }
  const toggleInline = style =>
    setEditorState(RichUtils.toggleInlineStyle(editorState, style))

  // CopyButtons
  const CopyButtons = () => (
    <Stack spacing={1} sx={{ width: 140 }}>
      <Button
        variant="outlined"
        fullWidth
        sx={{ borderRadius: '9999px', textTransform: 'none' }}
        onClick={() => navigator.clipboard.writeText(code)}
      >
        Copy code
      </Button>
      <Button
        variant="outlined"
        fullWidth
        sx={{ borderRadius: '9999px', textTransform: 'none' }}
        onClick={() =>
          navigator.clipboard.writeText(
            `${window.location.origin}/join?code=${code}`
          )
        }
      >
        Copy link
      </Button>
    </Stack>
  )

  return (
    <Box>
      {/* Cover + Info */}
      <Box sx={{ mb: 2 }}>
        <Card elevation={0} sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="180"
            image={
              coverUrl || `https://picsum.photos/seed/${classId}/800/180`
            }
          />
          <Button
            startIcon={<PhotoCameraIcon />}
            size="small"
            onClick={handleCustomize}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'rgba(255,255,255,0.7)',
              borderRadius: '9999px',
              px: 2
            }}
          >
            Customize
          </Button>
          <Box sx={{ position: 'absolute', bottom: 12, left: 12 }}>
            <Typography
              variant="h5"
              sx={{ color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {name}
            </Typography>
            <Tooltip title="More info">
              <IconButton
                onClick={() => setInfoOpen(o => !o)}
                sx={{ color: 'white', ml: 1 }}
              >
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ color: 'white', mt: 0.5 }}>
              Section: {section || '–'} • Subject: {subject || '–'}
            </Typography>
          </Box>
        </Card>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onFileChange}
        />
        <Collapse in={infoOpen}>
          <Paper sx={{ m: 2, p: 2, borderRadius: 2 }}>
            <Typography>
              <strong>Room:</strong> {room || '–'}
            </Typography>
            <Typography>
              <strong>Code:</strong> {code}
            </Typography>
            <Typography>
              <strong>Description:</strong> {description || '–'}
            </Typography>
            <MuiLink href={`/classes/${classId}`} target="_blank">
              Class Link
            </MuiLink>
          </Paper>
        </Collapse>
      </Box>

      {/* Copy + Announce Toggle */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <CopyButtons />
        <Card
          variant="outlined"
          onClick={() => setAnnOpen(o => !o)}
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            cursor: 'pointer'
          }}
        >
          <Typography variant="h6">
            {editingId ? 'Editing…' : 'Announcements'} (
            {announcements.length})
          </Typography>
          <ExpandMoreIcon
            sx={{
              transform: annOpen ? 'rotate(180deg)' : undefined,
              transition: 'transform .2s'
            }}
          />
        </Card>
      </Stack>

      {/* Announcement Form */}
      <Collapse in={annOpen} timeout="auto" unmountOnExit>
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ p: 2 }}>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={e => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <IconButton onClick={() => toggleInline('BOLD')}>
                <FormatBoldIcon />
              </IconButton>
              <IconButton onClick={() => toggleInline('ITALIC')}>
                <FormatItalicIcon />
              </IconButton>
              <IconButton onClick={() => toggleInline('UNDERLINE')}>
                <FormatUnderlinedIcon />
              </IconButton>
            </Stack>

            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                minHeight: 100,
                mb: 2
              }}
            >
              <Editor
                editorState={editorState}
                onChange={setEditorState}
                handleKeyCommand={handleKeyCmd}
              />
            </Box>

            {/* 2) Toggle switch */}
            <FormControlLabel
              control={
                <Switch
                  checked={scheduleEnabled}
                  onChange={(_, on) => {
                    setScheduleEnabled(on)
                    if (!on) setSchedule(null)
                  }}
                />
              }
              label="Schedule for later"
              sx={{ mb: 1 }}
            />

            {/* 3) Native date-time picker */}
            {
scheduleEnabled && (
              <TextField
                type="datetime-local"
                fullWidth
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                value={schedule ? schedule.toISOString().slice(0, 16) : ''}
                onChange={e => setSchedule(new Date(e.target.value))}
              />
            )}

            {/* 4) Schedule button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={saveAnnouncement}
                disabled={
                  !title.trim() ||
                  !editorState.getCurrentContent().hasText() ||
                  (scheduleEnabled &&
                    (!schedule || schedule <= new Date()))
                }
                sx={{ borderRadius: '9999px', px: 4 }}
              >
                {scheduleEnabled ? 'Schedule' : 'Publish'}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Collapse>

      {/* Announcements List */}
      <Stack spacing={2}>
        {sorted.map(ann => (
          <Card key={ann.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">
                  {ann.pinned && <PushPinIcon fontSize="small" />} {ann.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(ann.schedule || ann.created_at).toLocaleString()}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {(() => {
                  const raw = ann.contentBlocks || {}
                  const blocks = Array.isArray(raw.blocks) ? raw.blocks : []
                  return blocks.map(b => b.text).join('\n')
                })()}
              </Typography>
            </CardContent>
            <CardActions>
              <Tooltip title="Comments">
                <IconButton size="small" onClick={() => toggleComment(ann.id)}>
                  <ChatIcon
                    color={commentOpen[ann.id] ? 'primary' : 'inherit'}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Pin">
                <IconButton size="small" onClick={() => togglePin(ann)}>
                  <PushPinIcon
                    color={ann.pinned ? 'primary' : 'inherit'}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingId(ann.id)
                    setTitle(ann.title)
                    setScheduleEnabled(!!ann.schedule)
                    setSchedule(ann.schedule ? new Date(ann.schedule) : null)
                    setEditorState(
                      EditorState.createWithContent(
                        convertFromRaw(ann.contentBlocks)
                      )
                    )
                    setAnnOpen(true)
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => deleteAnn(ann)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </CardActions>
            <Collapse in={!!commentOpen[ann.id]} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {(comments[ann.id] || []).map(c => (
                    <ListItem key={c.id} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={c.authorPicture} />
                      </ListItemAvatar>
                      <ListItemText primary={c.authorName} secondary={c.text} />
                    </ListItem>
                  ))}
                  {!comments[ann.id]?.length && (
                    <Typography color="text.secondary">
                      No comments.
                    </Typography>
                  )}
                </List>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <TextField
                    placeholder="Write a reply…"
                    fullWidth
                    size="small"
                    value={replyText[ann.id] || ''}
                    onChange={e =>
                      setReplyText(r => ({
                        ...r,
                        [ann.id]: e.target.value
                      }))
                    }
                  />
                  <IconButton color="primary" onClick={() => postReply(ann.id)}>
                    <SendIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Collapse>
          </Card>
        ))}
        {!sorted.length && (
          <Typography color="text.secondary">
            No published announcements.
          </Typography>
        )}
      </Stack>
    </Box>
  )
}