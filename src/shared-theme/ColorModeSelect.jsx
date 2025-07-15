// src/shared-theme/ColorModeSelect.jsx
import React, { useContext } from 'react';
import { Select, MenuItem, Box } from '@mui/material';
import { ColorModeContext } from './AppTheme';

export default function ColorModeSelect(props) {
  const { mode, setMode } = useContext(ColorModeContext);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1300, // above Card
      }}
    >
      <Select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        size="small"
        {...props}
      >
        <MenuItem value="light">Light</MenuItem>
        <MenuItem value="dark">Dark</MenuItem>
      </Select>
    </Box>
  );
}