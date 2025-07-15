// src/pages/LearnClassworkTab.jsx
import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SchoolIcon        from '@mui/icons-material/School'
import AssignmentIcon    from '@mui/icons-material/Assignment'
import QuizIcon          from '@mui/icons-material/Quiz'
import HelpOutlineIcon   from '@mui/icons-material/HelpOutline'
import DescriptionIcon   from '@mui/icons-material/Description'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function LearnClassworkTab({ classId }) {
  const navigate = useNavigate()
  const { token } = useContext(AuthContext)

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [openUpcoming, setOpenUpcoming] = useState(false)

  // icon map
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
    async function load() {
      setLoading(true)
      try {
        const { data } = await api.get(
          `/classes/${classId}/assignments`,
          { headers:{ Authorization:`Bearer ${token}` }}
        )
        setAssignments(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [classId, token])

  if (loading) {
    return <CircularProgress sx={{ mt:4, mx:'auto', display:'block' }}/>
  }

  // Next 10 due
  const now = new Date()
  const upcoming = assignments
    .filter(a => a.due && new Date(a.due) >= now)
    .sort((a,b)=> new Date(a.due) - new Date(b.due))
    .slice(0,10)

  return (
    <Box>
      {/* Upcoming Assignments */}
      <Card variant="outlined" sx={{ mb:4, borderColor:'divider' }}>
        <CardContent sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Typography variant="subtitle1">
            Upcoming Assignments ({upcoming.length})
          </Typography>
          <IconButton
            onClick={()=>setOpenUpcoming(o=>!o)}
            sx={{
              transform: openUpcoming ? 'rotate(180deg)' : 'rotate(0deg)',
              transition:'transform .3s'
            }}
          >
            <ExpandMoreIcon/>
          </IconButton>
        </CardContent>
        <Collapse in={openUpcoming}>
          <List dense sx={{ borderTop:1,borderColor:'divider' }}>
            {upcoming.length ? upcoming.map(a=>(
              <ListItem key={a.id} sx={{ pl:2, pr:2 }}>
                <Chip
                  label={new Date(a.due).toLocaleDateString()}
                  size="small"
                  sx={{ mr:1 }}
                />
                <ListItemText
                  primary={a.title}
                  secondary={new Date(a.due)
                    .toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                />
              </ListItem>
            )) : (
              <ListItem sx={{ pl:2 }}>
                <ListItemText secondary="No upcoming items"/>
              </ListItem>
            )}
          </List>
        </Collapse>
      </Card>

      {/* All Classworks */}
      <Stack spacing={2}>
        {assignments.map(a => {
          const { Icon, color } = typeMap[a.type] || typeMap.default
          const posted = new Date(a.created_at).toLocaleDateString()
          const dueStr = a.due
            ? ` • Due ${new Date(a.due).toLocaleDateString()}`
            : ''

          return (
            <Card
              key={a.id}
              variant="outlined"
              sx={{ borderColor:'divider', cursor:'pointer' }}
              onClick={()=>navigate(
                `/classes/${classId}/assignments/${a.id}/details`
              )}
            >
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Icon sx={{ fontSize:28, color }} />
                    <Box>
                      <Typography noWrap>
                        {a.type}: {a.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display:'block', mt:0.5 }}
                      >
                        {posted}{dueStr}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}