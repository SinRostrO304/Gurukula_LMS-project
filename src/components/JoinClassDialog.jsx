// src/components/JoinClassDialog.jsx
import React, { useState, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Avatar, Typography, Box, Paper, CircularProgress
} from '@mui/material';
import { AuthContext } from '../auth/AuthProvider';

export default function JoinClassDialog({ open, onClose, onSubmit }) {
  const { user } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleJoin = async () => {
    setLoading(true);
    try {
      await onSubmit(code.trim());
    } finally {
      setLoading(false);
    }
  };

  const seed = encodeURIComponent(user.email || user.name);
  const avatarUrl = user.picture || `https://api.dicebear.com/6.x/identicon/svg?seed=${seed}`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Join Class</DialogTitle>
      <DialogContent>
        <Paper
          variant="outlined"
          sx={{ borderRadius:2, p:2, mb:2, display:'flex', alignItems:'center' }}
        >
          <Avatar src={avatarUrl} sx={{ width:48, height:48, mr:2 }} />
          <Box>
            <Typography>You’re signed in as</Typography>
            <Typography fontWeight="bold">{user.name}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
          </Box>
        </Paper>

        <TextField
          label="Class Code"
          fullWidth
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          inputProps={{ maxLength:8 }}
          disabled={loading}
          sx={{ mb:2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleJoin}
          disabled={loading || code.trim().length !== 8}
          variant="contained"
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Joining…' : 'Join'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}