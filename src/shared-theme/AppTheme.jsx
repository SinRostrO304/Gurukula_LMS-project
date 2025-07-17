// src/shared-theme/AppTheme.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// 1) Create a context for mode + setter
export const ColorModeContext = React.createContext({
  mode: 'light',
  setMode: () => {},
});

export default function AppTheme({ children }) {
  // 2) Initialize mode from localStorage (or default to 'light')
  const [mode, setModeRaw] = React.useState(() => {
    return localStorage.getItem('colorMode') || 'light';
  });

  // 3) Wrap setter so it persists to localStorage
  const setMode = (newMode) => {
    localStorage.setItem('colorMode', newMode);
    setModeRaw(newMode);
  };

  // 4) Memoize the MUI theme based on `mode`
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          background: {
            default: mode === 'dark' ? '#1e2330' : '#eef1f8',
            paper:   mode === 'dark' ? '#2a2f3e' : '#ffffff',
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

AppTheme.propTypes = {
  children: PropTypes.node,
};
