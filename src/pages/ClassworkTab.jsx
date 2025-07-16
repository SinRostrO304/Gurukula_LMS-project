// src/pages/ClassworkTab.jsx
import React, { useState, useEffect, useContext, useRef } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  IconButton,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Avatar,
  CircularProgress,
  FormControlLabel,
  Switch,
  List,            
  ListItem,        
  ListItemText,    
  // Divider,
  // stack
} from '@mui/material'
import ChatIcon   from '@mui/icons-material/Chat'       // public
import LockIcon   from '@mui/icons-material/Lock'       // private

import AddIcon           from '@mui/icons-material/Add'
import AttachFileIcon    from '@mui/icons-material/AttachFile'
import DeleteIcon        from '@mui/icons-material/Delete'
// import DateRangeIcon     from '@mui/icons-material/DateRange'
import Autocomplete      from '@mui/material/Autocomplete'

import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  convertFromRaw
} from 'draft-js'
import FormatBoldIcon       from '@mui/icons-material/FormatBold'
import FormatItalicIcon     from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  // arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import Papa from 'papaparse'
import { saveAs } from 'file-saver'

import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

function SortableAttachment({ file, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: index })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Avatar
        variant="square"
        src={URL.createObjectURL(file)}
        sx={{ width: 48, height: 48 }}
      />
      <IconButton size="small" onClick={() => onRemove(index)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </div>
  )
}

export default function ClassworkTab({ classId }) {
  const { token } = useContext(AuthContext)
  const fileInput = useRef()

  // --- COMMENTS STATES & DIALOG FLOW ---
  const [classCommentsOpen, setClassCommentsOpen]         = useState(false)
  const [privateListOpen, setPrivateListOpen]             = useState(false)
  const [privateThreadOpen, setPrivateThreadOpen]         = useState(false)

  const [currentAsg, setCurrentAsg]                       = useState(null)
  const [classComments, setClassComments]                 = useState([])

  // list of all private comments (returns array of { studentId, studentName, text, createdAt })
  const [privateCommentsAll, setPrivateCommentsAll]       = useState([])
  const [selectedStudent, setSelectedStudent]             = useState(null)
  const [commentsList, setCommentsList]                   = useState([]) // for private thread
  const [newCommentText, setNewCommentText]               = useState('')


  // State
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & search
  const [filterType, setFilterType] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dueRange, setDueRange] = useState({ from: null, to: null })

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [bulkSchedule, setBulkSchedule] = useState(null)

  // Dialog & form
  const initialForm = {
    title: '',
    files: [],
    due: null,
    publishNow: true,
    assignTo: ['All Students'],
    points: '',
    quizLink: '',
    questionInstruction: '',
    questionType: 'Short answer',
    questionOptions: ['', '', '', ''],
    reuseClass: null,
    reuseItem: null,
    rubric: []
  }
  const [open, setOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [type, setType] = useState('Homework')
  const [form, setForm] = useState(initialForm)
  const [editorState, setEditorState] = useState(
    () => EditorState.createEmpty()
  )
  const [previewMode, setPreviewMode] = useState(false)

  // Reuse & students
  const [otherClasses, setOtherClasses] = useState([])
  const [otherItems, setOtherItems] = useState([])
  const [students, setStudents] = useState([])

  // Draft autosave
  const draftKey = `cw-draft-${classId}`
  useEffect(() => {
    if (open && isNew) {
    const saved = localStorage.getItem(draftKey)
    if (saved && window.confirm('Restore unsaved draft?')) {
      const { form: f, raw } = JSON.parse(saved)
      setForm(f)
      setEditorState(EditorState.createWithContent(convertFromRaw(raw)))
    }
  }
}, [open, isNew, draftKey])
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent())
      localStorage.setItem(draftKey, JSON.stringify({ form, raw }))
    }, 2000)
    return () => clearTimeout(id)
  }, [open, form, editorState, draftKey])

  // Load assignments with filters
  const load = async () => {
    const params = {
      type: filterType || undefined,
      search: searchText || undefined,
      dueFrom: dueRange.from?.toISOString(),
      dueTo: dueRange.to?.toISOString()
    }
    const { data } = await api.get(
      `/classes/${classId}/assignments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    )
    setAssignments(data)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [classId, token, filterType, searchText, dueRange, load])

  // Load students & other classes
  useEffect(() => {
    api
      .get(`/classes/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setStudents(r.data))
      .catch(() => {})
    api
      .get(`/classes/teaching`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setOtherClasses(r.data.classes))
      .catch(() => {})
  }, [classId, token])

  // Load reuse items
  useEffect(() => {
    if (!form.reuseClass) return
    api
      .get(`/classes/${form.reuseClass}/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => setOtherItems(r.data))
      .catch(() => setOtherItems([]))
  }, [form.reuseClass, token])

  // Handlers
  const resetForm = () => {
    setType('Homework')
    setForm(initialForm)
    setEditorState(EditorState.createEmpty())
    setPreviewMode(false)
    localStorage.removeItem(draftKey)
  }
  const handleOpen = () => {
    setIsNew(true)
    resetForm()
    setOpen(true)
  }
  const handleClose = () => setOpen(false)

  const handleSave = async () => {
    const descRaw = convertToRaw(
      editorState.getCurrentContent()
    )
    const payload = {
      type,
      title: form.title,
      description: JSON.stringify(descRaw),
      due: form.publishNow ? null : form.due,
      assignTo: form.assignTo,
      points:
        type === 'Homework' ? null : Number(form.points || 0),
      quizLink: type === 'Quiz' ? form.quizLink : null,
      question: type === 'Question' ? form.title : null,
      instruction:
        type === 'Question' ? form.questionInstruction : null,
      questionType:
        type === 'Question' ? form.questionType : null,
      options:
        type === 'Question' ? form.questionOptions : null,
      reuse:
        type === 'Reuse post'
          ? {
              classId: form.reuseClass,
              itemId: form.reuseItem
            }
          : null,
      rubric: form.rubric
    }
    const fd = new FormData()
    fd.append('payload', JSON.stringify(payload))
    form.files.forEach(f => fd.append('files', f))

    const { data } = await api.post(
      `/classes/${classId}/assignments`,
      fd,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    setAssignments(a => [data, ...a])
    setOpen(false)
  }

  const handleBulk = async () => {
    await api.post(
      `/classes/${classId}/assignments/bulk`,
      {
        action: bulkAction,
        ids: selectedIds,
        schedule:
          bulkAction === 'schedule' ? bulkSchedule : null
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setSelectedIds([])
    setBulkAction('')
    setBulkSchedule(null)
    load()
  }

  const applyStyle = s =>
    setEditorState(RichUtils.toggleInlineStyle(editorState, s))
  const handleKeyCommand = cmd => {
    const nxt = RichUtils.handleKeyCommand(editorState, cmd)
    if (nxt) {
      setEditorState(nxt)
      return 'handled'
    }
    return 'not-handled'
  }

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  )

  const onDragEnd = event => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setForm(f => {
        const items = Array.from(f.files)
        const oldIndex = Number(active.id)
        const newIndex = Number(over.id)
        const moved = items.splice(oldIndex, 1)[0]
        items.splice(newIndex, 0, moved)
        return { ...f, files: items }
      })
    }
  }

  const exportCSV = () => {
    const rows = assignments.map(a => ({
      title: a.title,
      type: a.type,
      due: a.due,
      points: a.points
    }))
    const csv = Papa.unparse(rows)
    saveAs(
      new Blob([csv], {
        type: 'text/csv;charset=utf-8'
      }),
      `classwork-${classId}.csv`
    )
  }

  if (loading) {
    return (
      <CircularProgress sx={{ mx: 'auto', mt: 4 }} />
    )
  }

  // VIEW assignment (read-only dialog)
  const handleView = a => {
    // set type & dialog into preview
    setIsNew(false)
    setType(a.type)
    setPreviewMode(true)
    // build form shape from assignment
    setForm({
      title: a.title,
      files: [],                   // skip existing file blobs
      due: a.due ? new Date(a.due) : null,
      publishNow: !a.schedule,
      assignTo: a.assign_to || ['All Students'],
      points: a.points?.toString() || '',
      quizLink: a.quizLink || '',
      questionInstruction: a.instruction || '',
      questionType: a.questionType || 'Short answer',
      questionOptions: a.questionOpts || ['', '', '', ''],
      reuseClass: a.reuse?.classId || null,
      reuseItem:  a.reuse?.itemId   || null,
      rubric:     a.rubric || []
    })

    // load raw editorState
    try {
      const raw = JSON.parse(a.description || '{"blocks":[]}')
      setEditorState(EditorState.createWithContent(convertFromRaw(raw)))
    } catch {
      setEditorState(EditorState.createEmpty())
    }

    setOpen(true)
  }

  // EDIT assignment (dialog → edit mode)
  const handleEdit = a => {
    setIsNew(false)
    handleView(a)
    setPreviewMode(false)
  }

  // DELETE assignment
  const handleDelete = async a => {
    if (!window.confirm('Delete this assignment?')) return
    await api.delete(`/classes/${classId}/assignments/${a.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setAssignments(prev => prev.filter(x => x.id !== a.id))
  }

  // Open Public/Class Comments
  const openClassComments = async asg => {
    setCurrentAsg(asg)
    setClassCommentsOpen(true)
    const { data } = await api.get(
      `/classes/${classId}/assignments/${asg.id}/comments`,
      { headers: { Authorization:`Bearer ${token}` } }
    )
    setClassComments(data)
  }

  // Open Private: stage 1 = fetch the list of students who have any private comments
  const openPrivateList = async asg => {
    setCurrentAsg(asg)
    setPrivateListOpen(true)
    const { data } = await api.get(
      `/classes/${classId}/assignments/${asg.id}/private-comments`,
      { headers: { Authorization:`Bearer ${token}` } }
    )
    // data is all threads; group by student
    setPrivateCommentsAll(data)
  }

  // Stage 2: pick a student and fetch just their thread
  const openPrivateThread = async student => {
    setSelectedStudent(student)
    setPrivateListOpen(false)
    setPrivateThreadOpen(true)
    const { data } = await api.get(
      `/classes/${classId}/assignments/${currentAsg.id}/private-comments`,
      {
        headers: { Authorization:`Bearer ${token}` },
        params: { studentId: student.studentId }
      }
    )
    setCommentsList(data)
  }

  // Send new private feedback
  const sendPrivateComment = async () => {
    await api.post(
      `/classes/${classId}/assignments/${currentAsg.id}/private-comments`,
      { studentId: selectedStudent.studentId, text: newCommentText },
      { headers:{ Authorization:`Bearer ${token}` }}
    )
    setCommentsList(cl => [
      ...cl,
      { authorName:'You', text:newCommentText, createdAt:new Date() }
    ])
    setNewCommentText('')
  }

  // sort for display
  const now = new Date()
  const sorted = assignments
    .filter(a => !a.due || new Date(a.due) <= now)
    .sort(
      (a, b) =>
        new Date(b.due || b.created_at) -
        new Date(a.due || a.created_at)
    )

  return (
    <Box>
      <Box sx={{ py: 2, textAlign: 'left' }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{ borderRadius: '9999px' }}
      >
        New Classwork
      </Button>
    </Box>
      {/* Toolbar */}
      <Stack
        direction="row"
        spacing={2}
        mb={2}
        alignItems="center"
      >
        <TextField
          placeholder="Search..."
          value={searchText}
          onChange={e =>
            setSearchText(e.target.value)
          }
        />
        <FormControl sx={{ width: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={filterType}
            onChange={e =>
              setFilterType(e.target.value)
            }
          >
            <MenuItem value="">
              All
            </MenuItem>
            {[
              'Homework',
              'Assignment',
              'Quiz',
              'Question',
              'Material',
              'Reuse post'
            ].map(t => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          type="date"
          label="Due From"
          InputLabelProps={{
            shrink: true
          }}
          value={
            dueRange
              .from?.toISOString()
              .slice(0, 10) || ''
          }
          onChange={e =>
            setDueRange(dr => ({
              ...dr,
              from: new Date(e.target.value)
            }))
          }
        />
        <TextField
          type="date"
          label="Due To"
          InputLabelProps={{
            shrink: true
          }}
          value={
            dueRange
              .to?.toISOString()
              .slice(0, 10) || ''
          }
          onChange={e =>
            setDueRange(dr => ({
              ...dr,
              to: new Date(e.target.value)
            }))
          }
        />

        <FormControl
          sx={{ ml: 'auto', width: 200 }}
        >
          <InputLabel>
            Bulk action
          </InputLabel>
          <Select
            label="Bulk action"
            value={bulkAction}
            onChange={e =>
              setBulkAction(e.target.value)
            }
          >
            <MenuItem value="">
              None
            </MenuItem>
            <MenuItem value="publish">
              Publish Now
            </MenuItem>
            <MenuItem value="schedule">
              Schedule
            </MenuItem>
            <MenuItem value="archive">
              Archive
            </MenuItem>
            <MenuItem value="delete">
              Delete
            </MenuItem>
          </Select>
        </FormControl>
        {bulkAction === 'schedule' && (
          <TextField
            type="datetime-local"
            label="Pick date"
            InputLabelProps={{
              shrink: true
            }}
            value={
              bulkSchedule
                ?.toISOString()
                .slice(0, 16) || ''
            }
            onChange={e =>
              setBulkSchedule(
                new Date(e.target.value)
              )
            }
          />
        )}
        <Button
          variant="outlined"
          onClick={handleBulk}
          disabled={
            !bulkAction ||
            !selectedIds.length ||
            (bulkAction === 'schedule' &&
              (!bulkSchedule ||
                bulkSchedule <= new Date()))
          }
        >
          Apply
        </Button>

        <Button
          variant="text"
          onClick={exportCSV}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Grid */}
      <Stack container spacing={2}>
        {sorted.map(a => {
        const isSel = selectedIds.includes(a.id)
        const stats = a.stats ?? { submitted: 0, assigned: 0, graded: 0 }

        // calculate % safely (avoid divide by zero)
        const pct = stats.assigned
          ? (stats.graded / stats.assigned) * 100
          : 0
          
        return (
          <Stack item xs={12} key={a.id}>
            <Card variant="outlined" sx={{ width: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={e =>
                      setSelectedIds(ids =>
                        e.target.checked
                          ? [...ids, a.id]
                          : ids.filter(x => x !== a.id)
                      )
                    }
                  />
                  <Typography variant="h6" noWrap>
                    {a.title}
                  </Typography>
                </Stack>

                <Box sx={{ my: 1 }}>
                  <Typography variant="caption">
                    {stats.submitted}/{stats.assigned} submitted • {stats.graded} graded
                  </Typography>
                  <Box
                    sx={{
                      height: 6,
                      bgcolor: '#eee',
                      borderRadius: 3,
                      overflow: 'hidden',
                      mt: 0.5
                    }}
                  >
                    <Box
                      sx={{
                        width: `${pct}%`,
                        height: '100%',
                        bgcolor: 'primary.main'
                      }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" noWrap>
                  Type: {a.type} • Due:{' '}
                  {a.due ? new Date(a.due).toLocaleString() : '–'}
                </Typography>
              </CardContent>
            <CardActions>
              <Button size="small" onClick={() => handleView(a)}>
                View
              </Button>
              <Button size="small" onClick={() => handleEdit(a)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => handleDelete(a)}>
                Delete
              </Button>
              {/* Public / Class Comments */}
              <IconButton
                size="small"
                onClick={() => {
                  console.log('openClassComments for', a.id)
                  openClassComments(a)
                }}
                title="Class Comments"
              >
                <ChatIcon fontSize="small" />
              </IconButton>

              {/* Private Comments */}
              <IconButton
                size="small"
                onClick={() => {
                  console.log('openPrivateList for', a.id)
                  openPrivateList(a)
                }}
                title="Private Comments"
              >
                <LockIcon fontSize="small" />
              </IconButton>
            </CardActions>
            </Card>
          </Stack>
        )
      })}
      </Stack>

      {/* --- MOVE THESE DIALOGS HERE --- */}
      {/* —————————————— CLASS COMMENTS DIALOG —————————————— */}
      <Dialog
        open={classCommentsOpen}
        onClose={() => setClassCommentsOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Class Comments — {currentAsg?.title}
        </DialogTitle>
        <DialogContent dividers>
          <List dense>
            {classComments.map((c,i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={c.authorName}
                  secondary={
                    <>
                      {c.text}
                      <Typography variant="caption" display="block">
                        {new Date(c.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
            {!classComments.length && (
              <Typography color="text.secondary" sx={{ pl:2 }}>
                No class comments yet.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassCommentsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ————— PRIVATE COMMENTS: STUDENT LIST ————— */}
      <Dialog
        open={privateListOpen}
        onClose={() => setPrivateListOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Private Threads — {currentAsg?.title}
        </DialogTitle>
        <DialogContent dividers>
          <List dense>
            {Object.entries(
              privateCommentsAll.reduce((map,c) => {
                map[c.studentId] = map[c.studentId] || []
                map[c.studentId].push(c)
                return map
              }, {})
            ).map(([sid, comments], idx) => (
              <ListItem
                button
                key={idx}
                onClick={() =>
                  openPrivateThread({
                    studentId: sid,
                    studentName: comments[0].studentName
                  })
                }
              >
                <ListItemText
                  primary={comments[0].studentName}
                  secondary={`${comments.length} messages`}
                />
              </ListItem>
            ))}
            {!privateCommentsAll.length && (
              <Typography color="text.secondary" sx={{ pl:2 }}>
                No private threads yet.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivateListOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ————— PRIVATE COMMENTS: CONVERSATION ————— */}
      <Dialog
        open={privateThreadOpen}
        onClose={() => setPrivateThreadOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Private Feedback for {selectedStudent?.studentName}
        </DialogTitle>
        <DialogContent dividers>
          <List dense sx={{ maxHeight:300, overflowY:'auto', mb:2 }}>
            {commentsList.map((c,i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={c.authorName}
                  secondary={c.text}
                />
              </ListItem>
            ))}
            {!commentsList.length && (
              <Typography color="text.secondary" sx={{ pl:2 }}>
                No feedback yet.
              </Typography>
            )}
          </List>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Reply privately…"
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrivateThreadOpen(false)}>Cancel</Button>
          <Button onClick={sendPrivateComment}>Send Feedback</Button>
        </DialogActions>
      </Dialog>

      {/* Assignment create/edit dialog (existing code) */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {previewMode
            ? 'Preview as Student'
            : `Create ${type}`}
        </DialogTitle>
        <DialogContent dividers>
          <FormControl
            fullWidth
            sx={{ mb: 2 }}
          >
            <InputLabel>Type</InputLabel>
            <Select
              label="Type"
              value={type}
              onChange={e =>
                setType(e.target.value)
              }
            >
              {[
                'Homework',
                'Assignment',
                'Quiz',
                'Question',
                'Material',
                'Reuse post'
              ].map(opt => (
                <MenuItem
                  key={opt}
                  value={opt}
                >
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={previewMode}
                onChange={(_, v) =>
                  setPreviewMode(v)
                }
              />
            }
            label="Preview as Student"
            sx={{ mb: 2 }}
          />

          {!previewMode ? (
            <>
              {(type !== 'Question' &&
                type !== 'Reuse post') && (
                <TextField
                  label={
                    type === 'Question'
                      ? 'Question'
                      : 'Title'
                  }
                  fullWidth
                  required
                  value={form.title}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      title: e.target.value
                    }))
                  }
                  sx={{ mb: 2 }}
                />
              )}

              {type === 'Reuse post' && (
                <>
                  <FormControl
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    <InputLabel>
                      From Class
                    </InputLabel>
                    <Select
                      value={
                        form.reuseClass || ''
                      }
                      label="From Class"
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          reuseClass:
                            e.target.value
                        }))
                      }
                    >
                      {otherClasses.map(c => (
                        <MenuItem
                          key={c.id}
                          value={c.id}
                        >
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Autocomplete
                    options={otherItems}
                    getOptionLabel={o =>
                      o.title
                    }
                    onChange={(_, val) =>
                      setForm(f => ({
                        ...f,
                        reuseItem:
                          val?.id
                      }))
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Select post"
                        fullWidth
                      />
                    )}
                    sx={{ mb: 2 }}
                  />
                </>
              )}

              {[
                'Homework',
                'Assignment',
                'Quiz',
                'Question'
              ].includes(type) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Rubric
                  </Typography>
                  <Button
                    onClick={() =>
                      setForm(f => ({
                        ...f,
                        rubric: [
                          ...(f.rubric || []),
                          {
                            criteria: '',
                            points: ''
                          }
                        ]
                      }))
                    }
                  >
                    Add Criterion
                  </Button>
                  {(form.rubric || []).map(
                    (r, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        <TextField
                          label="Criteria"
                          value={
                            form.rubric[i]
                              .criteria
                          }
                          onChange={e => {
                            const arr = [
                              ...(form.rubric || [])
                            ]
                            arr[i].criteria =
                              e.target.value
                            setForm(f => ({
                              ...f,
                              rubric: arr
                            }))
                          }}
                        />
                        <TextField
                          label="Points"
                          type="number"
                          value={
                            form.rubric[i].points
                          }
                          onChange={e => {
                            const arr = [
                              ...(form.rubric ||
                                [])
                            ]
                            arr[i].points =
                              e.target.value
                            setForm(f => ({
                              ...f,
                              rubric: arr
                            }))
                          }}
                        />
                        <IconButton
                          onClick={() => {
                            const arr = [
                              ...(form.rubric || [])
                            ]
                            arr.splice(i, 1)
                            setForm(f => ({
                              ...f,
                              rubric: arr
                            }))
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    )
                  )}
                </Box>
              )}

              <Typography mb={1}>
                {type === 'Question'
                  ? 'Instruction'
                  : 'Description'}{' '}
                (optional)
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <IconButton
                  onClick={() =>
                    applyStyle('BOLD')
                  }
                >
                  <FormatBoldIcon />
                </IconButton>
                <IconButton
                  onClick={() =>
                    applyStyle('ITALIC')
                  }
                >
                  <FormatItalicIcon />
                </IconButton>
                <IconButton
                  onClick={() =>
                    applyStyle('UNDERLINE')
                  }
                >
                  <FormatUnderlinedIcon />
                </IconButton>
              </Stack>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  mb: 2
                }}
              >
                <Editor
                  editorState={editorState}
                  onChange={setEditorState}
                  handleKeyCommand={handleKeyCommand}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={
                    closestCenter
                  }
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={form.files.map(
                      (_, i) => i
                    )}
                    strategy={
                      rectSortingStrategy
                    }
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                    >
                      {form.files.map(
                        (file, i) => (
                          <SortableAttachment
                            key={i}
                            file={file}
                            index={i}
                            onRemove={idx => {
                              setForm(fm => {
                                const arr = [
                                  ...fm.files
                                ]
                                arr.splice(idx, 1)
                                return {
                                  ...fm,
                                  files: arr
                                }
                              })
                            }}
                          />
                        )
                      )}
                      <IconButton
                        onClick={() =>
                          fileInput.current.click()
                        }
                      >
                        <AttachFileIcon />
                      </IconButton>
                    </Stack>
                  </SortableContext>
                </DndContext>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  hidden
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      files: [
                        ...f.files,
                        ...Array.from(
                          e.target.files
                        )
                      ]
                    }))
                  }
                />
              </Box>

              <TextField
                type="datetime-local"
                label="Due date & time"
                fullWidth
                InputLabelProps={{
                  shrink: true
                }}
                value={
                  form.due
                    ? form.due
                        .toISOString()
                        .slice(0, 16)
                    : ''
                }
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    due: new Date(
                      e.target.value
                    )
                  }))
                }
                sx={{ mb: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.publishNow}
                    onChange={(_, on) =>
                      setForm(f => ({
                        ...f,
                        publishNow: on
                      }))
                    }
                  />
                }
                label="Publish immediately"
                sx={{ mb: 2 }}
              />

              {[
                'Assignment',
                'Quiz',
                'Question'
              ].includes(type) && (
                <TextField
                  label="Points (optional)"
                  type="number"
                  fullWidth
                  value={form.points}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      points: e.target.value
                    }))
                  }
                  sx={{ mb: 2 }}
                />
              )}

              {type !== 'Reuse post' && (
                <Autocomplete
                  multiple
                  options={[
                    'All Students',
                    ...students.map(
                      s => s.name
                    )
                  ]}
                  value={form.assignTo}
                  onChange={(_, val) =>
                    setForm(f => ({
                      ...f,
                      assignTo: val
                    }))
                  }
                  renderTags={(
                    value,
                    getTagProps
                  ) =>
                    value.map((opt, idx) => (
                      <Chip
                        key={idx}
                        label={opt}
                        {...getTagProps({
                          index: idx
                        })}
                      />
                    ))
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Assign to"
                    />
                  )}
                  sx={{ mb: 2 }}
                />
              )}
            </>
          ) : (
            <Box>
              <Typography variant="h6">
                {form.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', mt: 1 }}
              >
                {convertToRaw(
                  editorState.getCurrentContent()
                ).blocks
                  .map(b => b.text)
                  .join('\n')}
              </Typography>
              <Typography
                variant="caption"
                sx={{ mt: 2, display: 'block' }}
              >
                Due:{' '}
                {form.due
                  ? form.due.toLocaleString()
                  : '–'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          {!previewMode && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={
                !form.title.trim()
              }
            >
              {type === 'Question'
                ? 'Ask'
                : 'Assign'}…

            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}