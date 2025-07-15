// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, Stack, Alert
} from '@mui/material'
import api from '../utils/api'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate      = useNavigate()
  const token         = searchParams.get('token') || ''
  const [pass, setPass]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (pass.length < 6) {
      return setError('Password needs ≥ 6 characters')
    }
    if (pass !== confirm) {
      return setError('Passwords do not match')
    }
    setError('')
    try {
      await api.post('/users/reset', { token, password: pass })
      setSuccess('Password reset! Redirecting to login…')
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed')
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
        Choose a New Password
      </Typography>
      {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="New Password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            fullWidth
          />
          <PasswordStrengthMeter password={pass} />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" fullWidth disabled={ pass !== confirm || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(pass)}>
            Reset Password
          </Button>
        </Stack>
      </form>
    </Box>
  )
}