// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, TextField, Typography, Stack, Alert } from '@mui/material'
import api from '../utils/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/\S+@\S+\.\S+/.test(email)) {
      return setError('Enter a valid email address.')
    }
    setLoading(true)

    try {
      await api.post('/users/forgot', { email })
      setSuccess(
        'If that email exists, we’ve sent a reset link. Check your inbox!'
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 8,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" mb={2}>
        Forgot your password?
      </Typography>

      {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {!success && (
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </Stack>
        </form>
      )}

      {success && (
        <Button
          variant="text"
          sx={{ mt: 2 }}
          onClick={() => navigate('/login', { replace: true })}
        >
          Back to Sign In
        </Button>
      )}
    </Box>
  )
}