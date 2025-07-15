// src/pages/JoinClassLink.jsx
import React, { useEffect, useContext, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CircularProgress, Typography, Box } from '@mui/material'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function JoinClassLink() {
  const { token } = useContext(AuthContext)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No class code provided.')
      return
    }
    api.post('/classes/join', { code }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const classId = res.data.classId  // ensure your backend returns this
      navigate(`/classes/${classId}`, { replace: true })
    })
    .catch(err => {
      console.error(err)
      setError('Failed to join class. The code may be invalid.')
    })
  }, [searchParams, token, navigate])

  if (error) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Joining class...</Typography>
    </Box>
  )
}