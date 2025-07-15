// src/components/PasswordStrengthMeter.js
import React from 'react'
import zxcvbn from 'zxcvbn'
import { Box, LinearProgress, Typography } from '@mui/material'

const labels = ['Too weak','Weak','Fair','Good','Strong']

export default function PasswordStrengthMeter({ password }) {
  const { score } = zxcvbn(password || '')
  const percent   = (score * 100) / 4

  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 6,
          borderRadius: 3,
          '& .MuiLinearProgress-bar': {
            bgcolor:
              score < 2
                ? 'error.main'
                : score < 3
                ? 'warning.main'
                : 'success.main',
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 0.5, color:
          score < 2
            ? 'error.main'
            : score < 3
            ? 'warning.main'
            : 'success.main' }}
      >
        {labels[score]}
      </Typography>
    </Box>
  )
}