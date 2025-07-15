// src/components/TeachingDashboard.jsx
import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Divider,
} from '@mui/material'
import api from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'

export default function TeachingDashboard({ collapsed }) {
  const { token } = useContext(AuthContext)
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/classes/teaching')
      .then(res => setClasses(res.data.classes))
      .catch(() => setError('Failed to load your classes.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <CircularProgress sx={{ mt: 4, mx: 'auto', display: 'block' }} />
  }
  if (error) {
    return <Typography color="error" align="center" mt={4}>{error}</Typography>
  }
  if (!classes.length) {
    return (
      <Typography align="center" mt={4}>
        You’re not teaching any classes yet.
      </Typography>
    )
  }

  // gap = theme.spacing(2) = 16px
  const GAP = 2
  // compute card width subtracting the horizontal gaps
  const width = collapsed
    ? `calc((100% - ${2 * GAP}*${8}px) / 3)`
    : `calc((100% - ${1 * GAP}*${8}px) / 2)`

  return (
    <Box
      component="section"
      sx={{
        pt: 2,
        pb: 2,
        pl: 2,
        pr: 2,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: GAP,
      }}
    >
      {classes.map((cls) => {
        const ongoing  = Array.isArray(cls.ongoing)  ? cls.ongoing  : []
        const toReview = Array.isArray(cls.toReview) ? cls.toReview : []
        const cover = cls.coverUrl
          ? cls.coverUrl
          : `https://picsum.photos/seed/${cls.id}/800/200`

        return (
          <Box
            key={cls.id}
            sx={{
              flex:     `0 0 ${width}`,
              maxWidth: width,
              display:  'flex',
            }}
          >
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
                transition: 'box-shadow 0.3s',
                '&:hover': { boxShadow: 3 },
              }}
            >
              <CardActionArea
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={cover}
                  alt={`${cls.name} cover`}
                />

                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" noWrap>
                    {cls.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    Section: {cls.section || '–'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ mt: 0.5 }}
                  >
                    Subject: {cls.subject || '–'}
                  </Typography>
                </Box>

                <Divider />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ongoing Assignments
                  </Typography>
                  <List dense disablePadding>
                    {ongoing.length
                      ? ongoing.map((a) => (
                          <ListItem key={a.id} disablePadding>
                            <ListItemText
                              primary={a.title}
                              primaryTypographyProps={{ noWrap: true }}
                            />
                          </ListItem>
                        ))
                      : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            None
                          </Typography>
                        )}
                  </List>

                  <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                    To Review
                  </Typography>
                  <List dense disablePadding>
                    {toReview.length
                      ? toReview.map((a) => (
                          <ListItem key={a.id} disablePadding>
                            <ListItemText
                              primary={a.title}
                              primaryTypographyProps={{ noWrap: true }}
                            />
                          </ListItem>
                        ))
                      : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            None
                          </Typography>
                        )}
                  </List>
                </CardContent>

                <Box sx={{ height: 48 }} />
              </CardActionArea>
            </Card>
          </Box>
        )
      })}
    </Box>
  )
}