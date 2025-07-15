// src/pages/LearnPeopleTab.jsx
import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  CircularProgress,
  Divider
} from '@mui/material'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function LearnPeopleTab({ classId }) {
  const { token } = useContext(AuthContext)

  const [teacher, setTeacher]     = useState(null)
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function loadPeople() {
      setLoading(true)
      try {
        // 1) Get class to find ownerId
        const {
          data: { class: cls }
        } = await api.get(`/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        // 2) Fetch teacher info
        const {
          data: { user }
        } = await api.get(`/users/${cls.ownerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setTeacher(user)

        // 3) Fetch enrolled students
        const { data: studentsList } = await api.get(
          `/classes/${classId}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setStudents(studentsList)
      } catch (err) {
        console.error('Error loading people:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPeople()
  }, [classId, token])

  if (loading) {
    return <CircularProgress sx={{ mt: 4, mx: 'auto', display: 'block' }} />
  }

  // Filter students by name
  const filteredStudents = students.filter(u => {
    const name = u.metadata?.name || u.name || ''
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <Box sx={{ mt: 2 }}>
      {/* Teachers */}
      <Typography variant="h6" gutterBottom>
        Teacher
      </Typography>
      <List dense>
        {teacher && (
          <ListItem>
            <ListItemAvatar>
              <Tooltip
                title={teacher.email || ''}
                arrow
                placement="right"
              >
                <Avatar src={teacher.metadata?.picture}>
                  {teacher.metadata?.name?.[0]?.toUpperCase() || 'T'}
                </Avatar>
              </Tooltip>
            </ListItemAvatar>
            <ListItemText
              primary={teacher.metadata?.name || teacher.name || 'Unnamed'}
            />
          </ListItem>
        )}
      </List>

      <Divider sx={{ my: 3 }} />

      {/* Students */}
      <Typography variant="h6" gutterBottom>
        Students ({filteredStudents.length})
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search students..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />

      <List dense>
        {filteredStudents.map(u => {
          const name  = u.metadata?.name || u.name || 'Unnamed'
          const email = u.email || ''
          const avatarLetter = name[0]?.toUpperCase() || 'S'

          return (
            <ListItem key={u.id}>
              <ListItemAvatar>
                <Tooltip title={email} arrow placement="right">
                  <Avatar src={u.metadata?.picture}>
                    {avatarLetter}
                  </Avatar>
                </Tooltip>
              </ListItemAvatar>
              <ListItemText primary={name} />
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}