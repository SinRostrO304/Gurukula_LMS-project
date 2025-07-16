// src/pages/CalendarPage.jsx
import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListSubheader,
  useMediaQuery,
  Button,
  Collapse,
  Paper,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin    from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'

// FullCalendar CSS is already loaded via your index.html <link>

import SchoolIcon       from '@mui/icons-material/School'
import QuizIcon         from '@mui/icons-material/Quiz'
import AssignmentIcon   from '@mui/icons-material/Assignment'
import HelpOutlineIcon  from '@mui/icons-material/HelpOutline'

import { AuthContext } from '../auth/AuthProvider'
import api from '../utils/api'

export default function CalendarPage() {
  const { token } = useContext(AuthContext)
  const navigate  = useNavigate()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'))

  // Data
  const [classesList, setClassesList]   = useState([])
  const [assignments, setAssignments]   = useState([])
  const [events, setEvents]             = useState([])
  const [upcoming, setUpcoming]         = useState([])

  // Filters & UI state
  const [selectedClasses, setSelectedClasses] = useState([])
  const [searchTerm, setSearchTerm]           = useState('')
  const [legendOpen, setLegendOpen]           = useState(false)

  // Map assignment types to icons/colors
  const typeMap = {
    homework:   { label: 'Homework',   Icon: SchoolIcon,     color: theme.palette.primary.main },
    quiz:       { label: 'Quiz',       Icon: QuizIcon,       color: theme.palette.secondary.main },
    assignment: { label: 'Assignment', Icon: AssignmentIcon, color: theme.palette.warning.main },
    question:   { label: 'Question',   Icon: HelpOutlineIcon,color: theme.palette.info.main },
  }

  // Fetch classes + assignments
  useEffect(() => {
    ;(async () => {
      const res = await api.get('/classes/teaching', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const clsList = res.data.classes
      setClassesList(clsList)
      setSelectedClasses(clsList.map(c => c.id))

      const all = clsList.flatMap((cls) =>
        [...cls.ongoing, ...cls.toReview].map(a => ({
          ...a,
          classId:   cls.id,
          className: cls.name,
          color:     cls.color || theme.palette.primary.main,
          type:      a.type || 'assignment'
        }))
      )
      setAssignments(all)

      const evs = all.map(a => ({
        id:    `${a.classId}-${a.id}`,
        title: a.title,
        date:  a.dueDate,
        backgroundColor: a.color,
        borderColor:     a.color,
        extendedProps:   { classId: a.classId, type: a.type }
      }))
      setEvents(evs)
    })()
  }, [token, theme.palette.primary.main])

  // Filtered events for calendar
  const filteredEvents = events.filter(e =>
    selectedClasses.includes(e.extendedProps.classId) &&
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Next 5 upcoming
  useEffect(() => {
    const now = new Date()
    const list = assignments
      .filter(a =>
        selectedClasses.includes(a.classId) &&
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        new Date(a.dueDate) >= now
      )
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
    setUpcoming(list)
  }, [assignments, selectedClasses, searchTerm])

  // Handlers
  // const handleClassToggle = (id) =>
  //  setSelectedClasses(prev =>
  //    prev.includes(id)
  //      ? prev.filter(x=>x!==id)
  //      : [...prev, id]
  //  )

  // Render custom event content with icon
  const renderEventContent = (eventInfo) => {
    const { type } = eventInfo.event.extendedProps
    const { Icon } = typeMap[type] || typeMap.assignment
    return (
      <Box sx={{ display:'flex', alignItems:'center', gap:0.5, px: 0.2 }}>
        <Icon sx={{ fontSize:'0.8rem', color: eventInfo.backgroundColor }} />
        <Typography
          variant="caption"
          noWrap
          sx={{ color: 'white', lineHeight: 1 }}
        >
          {eventInfo.event.title}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Filters / Search / Legend toggle */}
      <Box sx={{ px:2, pt:2, display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
        <FormControl sx={{ minWidth:200 }}>
          <InputLabel>Filter Classes</InputLabel>
          <Select
            multiple
            label="Filter Classes"
            value={selectedClasses}
            renderValue={vals =>
              vals.map(id => classesList.find(c=>c.id===id)?.name).join(', ')
            }
          >
            {classesList.map(c=>(
              <MenuItem key={c.id} value={c.id}>
                <Checkbox checked={selectedClasses.includes(c.id)} />
                <ListItemText primary={c.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Search assignments…"
          size="small"
          value={searchTerm}
          onChange={e=>setSearchTerm(e.target.value)}
          sx={{ flexGrow:1, minWidth:200 }}
        />

        <Button onClick={()=>setLegendOpen(o=>!o)}>
          {legendOpen ? 'Hide Legend' : 'Show Legend'}
        </Button>
      </Box>

      {/* Legend overlay */}
      <Collapse in={legendOpen}>
        <Paper
          elevation={1}
          sx={{ m:2, p:2, bgcolor:'background.paper' }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Legend
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            {Object.entries(typeMap).map(([type,{label,Icon,color}])=>(
              <Stack key={type} direction="row" alignItems="center" spacing={1}>
                <Icon sx={{ color }} />
                <Typography variant="body2">{label}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Collapse>

      {/* Calendar + Upcoming list */}
      <Stack direction={{ xs:'column', md:'row' }} sx={{ flex:1, overflow:'hidden' }}>
        <Box sx={{ flex:1, p:2, overflow:'auto' }}>
          <FullCalendar
            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
            initialView={isMobile ? 'listDay' : 'dayGridMonth'}
            headerToolbar={{
              left:   'prev,next today',
              center: 'title',
              right:  isMobile
                ? 'listDay,listWeek'
                : 'dayGridMonth,dayGridWeek,listWeek'
            }}
            events={filteredEvents}
            eventContent={renderEventContent}
            eventClick={info => {
              const clsId = info.event.extendedProps.classId
              navigate(`/classes/${clsId}`)
            }}
            height="auto"
          />
        </Box>

        <Box
          sx={{
            width:        { xs:'100%', md:300 },
            borderLeft:   { md:1 },
            borderColor:  'divider',
            p:            2,
            bgcolor:      'background.paper',
            overflow:     'auto'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Upcoming Deadlines
          </Typography>
          <List dense subheader={<ListSubheader disableSticky>Next 5</ListSubheader>}>
            {upcoming.map(a => (
              <React.Fragment key={a.id}>
                <ListItem
                  button
                  onClick={()=>navigate(`/classes/${a.classId}`)}
                  sx={{
                    borderLeft: `4px solid ${a.color}`,
                    pl:2
                  }}
                >
                  <ListItemText
                    primary={a.title}
                    secondary={new Date(a.dueDate).toLocaleDateString()}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
            {!upcoming.length && (
              <Typography color="text.secondary">
                No upcoming deadlines
              </Typography>
            )}
          </List>
        </Box>
      </Stack>
    </Box>
  )
}