// src/components/StudentDashboard.jsx
import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Stack,
  Avatar,
  CircularProgress,
  Button
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function StudentDashboard() {
  const { token, user } = useContext(AuthContext)
  const navigate = useNavigate()

  const [courses, setCourses] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/classes/enrolled', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setCourses(res.data.classes)
      })
      .catch(() => {
        setCourses([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return <CircularProgress sx={{ mt:4, mx:'auto', display:'block' }}/>
  }

  if (!courses.length) {
    return (
      <Box sx={{ textAlign:'center', mt:4 }}>
        <Typography variant="h6">You’re not enrolled in any courses yet.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/join?mode=join')}
          sx={{ mt:2 }}
        >
          Join a Class
        </Button>
      </Box>
    )
  }

  // card width for responsive grid
  const width = `calc((100% - 32px * 2) / 3)`
  const smWidth = `calc((100% - 16px * 1) / 2)`

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        My Courses
      </Typography>
      <Box
        sx={{
          display:'flex',
          flexWrap:'wrap',
          gap:2,
          justifyContent:'flex-start'
        }}
      >
        {courses.map(cls => (
          <Box
            key={cls.id}
            sx={{
              flex: `0 0 ${width}`,
              maxWidth: width,
              '@media(max-width:900px)': {
                flex: `0 0 ${smWidth}`,
                maxWidth: smWidth
              },
              '@media(max-width:600px)': {
                flex: '0 0 100%',
                maxWidth:'100%'
              }
            }}
          >
            <Card variant="outlined">
              <CardActionArea
                sx={{ display:'flex', flexDirection:'column' }}
                onClick={() => navigate(`/learn/${cls.id}`)}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={cls.coverUrl || `https://picsum.photos/seed/${cls.id}/400/140`}
                  alt={cls.name}
                />
                <CardContent sx={{ width:'100%' }}>
                  <Typography variant="h6" noWrap>
                    {cls.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt:1 }}>
                    <Avatar src={cls.ownerPicture} sx={{ width:24, height:24 }}/>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {cls.ownerName}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  )
}