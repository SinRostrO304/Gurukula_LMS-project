// src/pages/LearnGeneralTab.jsx
import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Collapse,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Chip,
  CircularProgress,
  Stack
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SchoolIcon        from '@mui/icons-material/School'
import AssignmentIcon    from '@mui/icons-material/Assignment'
import QuizIcon          from '@mui/icons-material/Quiz'
import HelpOutlineIcon   from '@mui/icons-material/HelpOutline'
import DescriptionIcon   from '@mui/icons-material/Description'
import ChatIcon          from '@mui/icons-material/ChatBubbleOutline'
import SendIcon          from '@mui/icons-material/Send'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function LearnGeneralTab({ classId }) {
  const navigate = useNavigate()
  const { token } = useContext(AuthContext)

  const [cls, setCls]                     = useState(null)
  const [owner, setOwner]                 = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [assignments, setAssignments]     = useState([])
  const [loading, setLoading]             = useState(true)
  const [upcomingOpen, setUpcomingOpen]   = useState(false)
  const [commentOpen, setCommentOpen]     = useState({})
  const [comments, setComments]           = useState({})
  const [replyText, setReplyText]         = useState({})

  const typeMap = {
    Announcement: { Icon: NotificationsIcon, color: 'primary.main' },
    Homework:     { Icon: SchoolIcon,        color: 'success.main' },
    Assignment:   { Icon: AssignmentIcon,    color: 'warning.main' },
    Quiz:         { Icon: QuizIcon,          color: 'secondary.main' },
    Question:     { Icon: HelpOutlineIcon,   color: 'info.main' },
    Material:     { Icon: DescriptionIcon,   color: 'text.primary' },
    default:      { Icon: NotificationsIcon, color: 'grey.500' }
  }

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        // class info
        const { data:{ class: c } } = await api.get(
          `/classes/${classId}`,
          { headers:{ Authorization:`Bearer ${token}` }}
        )
        setCls(c)

        // teacher info
        const { data:{ user } } = await api.get(
          `/users/${c.ownerId}`,
          { headers:{ Authorization:`Bearer ${token}` }}
        )
        setOwner(user)

        // announcements
        const { data: anns } = await api.get(
          `/classes/${classId}/announcements`,
          { headers:{ Authorization:`Bearer ${token}` }}
        )
        setAnnouncements(anns)

        // assignments (classwork)
        const { data: asgs } = await api.get(
          `/classes/${classId}/assignments`,
          { headers:{ Authorization:`Bearer ${token}` }}
        )
        setAssignments(asgs)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [classId, token])

  const loadComments = async annId => {
    if (comments[annId]) return
    const { data } = await api.get(
      `/classes/${classId}/announcements/${annId}/comments`,
      { headers:{ Authorization:`Bearer ${token}` }}
    )
    setComments(prev=>({ ...prev, [annId]: data }))
  }

  const toggleComment = annId => {
    const open = !commentOpen[annId]
    setCommentOpen(prev=>({ ...prev, [annId]:open }))
    if (open) loadComments(annId)
  }

  const postReply = async annId => {
    const text = (replyText[annId]||'').trim()
    if (!text) return
    const { data } = await api.post(
      `/classes/${classId}/announcements/${annId}/comments`,
      { text },
      { headers:{ Authorization:`Bearer ${token}` }}
    )
    setComments(prev=>({
      ...prev,
      [annId]: [...(prev[annId]||[]), data]
    }))
    setReplyText(prev=>({ ...prev, [annId]: '' }))
  }

  if (loading || !cls || !owner) {
    return <CircularProgress sx={{ mt:4, mx:'auto', display:'block' }}/>
  }

  // next 10 due assignments
  const now      = new Date()
  const upcoming = assignments
    .filter(a => a.due && new Date(a.due)>=now)
    .sort((a,b)=> new Date(a.due)-new Date(b.due))
    .slice(0,10)

  // build feed
  const feed = [
    ...announcements.map(a => ({
      key:      `ann-${a.id}`,
      type:     'Announcement',
      title:    a.title,
      postedAt: new Date(a.created_at),
      due:      null,
      id:       a.id
    })),
    ...assignments.map(a => ({
      key:      `cw-${a.id}`,
      type:     a.type,
      title:    a.title,
      postedAt: new Date(a.created_at),
      due:      a.due ? new Date(a.due):null,
      id:       a.id
    }))
  ].sort((x,y)=> y.postedAt - x.postedAt)

  return (
    <Box>
      {/* cover + details */}
      <Card sx={{ mb:4 }}>
        <CardMedia
          component="img"
          height="180"
          image={cls.coverUrl || `https://picsum.photos/seed/${cls.id}/800/180`}
          alt={cls.name}
        />
        <CardContent>
          <Typography variant="h5">{cls.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Section: {cls.section||'–'} • Subject: {cls.subject||'–'}
          </Typography>
          {cls.description && (
            <Typography variant="body2" sx={{ mt:1 }}>
              {cls.description}
            </Typography>
          )}
        </CardContent>
        <CardActions disableSpacing>
          <Typography sx={{ flexGrow:1 }}>
            Upcoming ({upcoming.length})
          </Typography>
          <IconButton
            onClick={()=>setUpcomingOpen(o=>!o)}
            sx={{
              transform: upcomingOpen?'rotate(180deg)':'rotate(0deg)',
              transition:'transform .3s'
            }}
          >
            <ExpandMoreIcon/>
          </IconButton>
        </CardActions>
        <Collapse in={upcomingOpen}>
          <List dense sx={{ borderTop:1,borderColor:'divider' }}>
            {upcoming.length ? upcoming.map(a=>(
              <ListItem key={a.id} sx={{ pl:2,pr:2 }}>
                <Chip
                  label={new Date(a.due).toLocaleDateString()}
                  size="small"
                  sx={{ mr:1 }}
                />
                <ListItemText
                  primary={a.title}
                  secondary={new Date(a.due).toLocaleTimeString([],{
                    hour:'2-digit', minute:'2-digit'
                  })}
                />
              </ListItem>
            )) : (
              <ListItem sx={{ pl:2 }}>
                <ListItemText secondary="No upcoming assignments" />
              </ListItem>
            )}
          </List>
        </Collapse>
      </Card>

      {/* feed */}
      <Stack spacing={2}>
        {feed.map(item => {
          const isAnn = item.type==='Announcement'
          const { Icon, color } = typeMap[item.type]||typeMap.default

          return (
            <Card
              key={item.key}
              variant="outlined"
              sx={{
                borderColor:'divider',
                cursor: !isAnn
                  ? 'pointer'
                  : 'default'
              }}
              onClick={() => {
                if (!isAnn) {
                  navigate(
                    `/classes/${classId}/assignments/${item.id}/details`
                  )
                }
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Icon sx={{ fontSize:32, color }} />
                    <Box>
                      <Typography noWrap>
                        {owner.name} posted a new {item.type} : {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.postedAt.toLocaleDateString()}
                        {item.due &&
                          ` • Due ${item.due.toLocaleDateString()}`}
                      </Typography>
                    </Box>
                  </Stack>
                  {isAnn && (
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation()
                        toggleComment(item.id)
                      }}
                    >
                      <ChatIcon />
                    </IconButton>
                  )}
                </Stack>
              </CardContent>

              {isAnn && (
                <Collapse in={commentOpen[item.id]}>
                  <Box sx={{ p:2, borderTop:1, borderColor:'divider' }}>
                    <List
                      dense
                      sx={{ maxHeight:200, overflow:'auto' }}
                    >
                      {(comments[item.id]||[]).map(c => (
                        <ListItem
                          key={c.id}
                          alignItems="flex-start"
                        >
                          <ListItemText
                            primary={c.authorName}
                            secondary={c.text}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mt:1 }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Write a reply…"
                        value={replyText[item.id]||''}
                        onChange={e => setReplyText(prev => ({
                          ...prev,
                          [item.id]: e.target.value
                        }))}
                      />
                      <IconButton
                        color="primary"
                        onClick={() => postReply(item.id)}
                      >
                        <SendIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                </Collapse>
              )}
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}