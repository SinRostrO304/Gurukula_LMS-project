// src/pages/ManageClassPage.jsx
import React, { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import SettingsIcon      from '@mui/icons-material/Settings'

import GeneralTab    from './GeneralTab'
import ClassworkTab  from './ClassworkTab'
import PeopleTab from './PeopleTab'
import GradeTab      from './GradeTab'

export default function ManageClassPage() {
  const { id } = useParams()
  const [tab, setTab] = useState(0)

  // Redirect if no class ID
  if (!id) return <Navigate to="/dashboard" />

  const handleTabChange = (_, value) => {
    setTab(value)
  }

  return (
    <Box>
      {/* Tabs Header */}
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
          <Tab label="Grades" />
        </Tabs>
        <IconButton><CalendarTodayIcon/></IconButton>
        <IconButton><SettingsIcon/></IconButton>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ px: 2, pb: 2 }}>
        {tab === 0 && (
          <GeneralTab classId={id}/>
        )}

        {tab === 1 && (
          <ClassworkTab classId={id}/>
        )}

        {tab === 2 && (
          <PeopleTab classId={id}/>
        )}

        {tab === 3 && (
          <GradeTab classId={id} />
        )}
      </Box>
    </Box>
  )
}