// src/pages/LearnClassPage.jsx
import React, { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

import LearnGeneralTab   from './LearnGeneralTab'
import LearnClassworkTab from './LearnClassworkTab'
import LearnPeopleTab from './LearnPeopleTab'

export default function LearnClassPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  if (!id) return <Navigate to="/learning" replace />

  const handleTabChange = (_, newValue) => {
    setTab(newValue)
  }

  const goToCalendar = () => navigate('/calendar')

  return (
    <Box>
      {/* Tabs + Calendar icon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          px: 2,
          py: 1
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{ flexGrow: 1 }}
        >
          <Tab label="General" />
          <Tab label="Classwork" />
          <Tab label="People" />
        </Tabs>
        <IconButton onClick={goToCalendar}>
          <CalendarTodayIcon />
        </IconButton>
      </Box>

      {/* Tab panels */}
      <Box sx={{ px: 2, pb: 2 }}>
        {tab === 0 && <LearnGeneralTab classId={id} />}
        {tab === 1 && <LearnClassworkTab classId={id} />}
        {tab === 2 && <LearnPeopleTab classId={id} />}
      </Box>
    </Box>
  )
}