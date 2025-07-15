// src/shared-theme/AppTheme.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// 1a) Create a context for mode + setter
export const ColorModeContext = React.createContext({
  mode: 'light',
  setMode: () => {},
});

export default function AppTheme({ children }) {
  // 1b) Track mode in state
  const [mode, setMode] = React.useState('light');

  // 1c) Memoize theme
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          background: {
            default: mode === 'dark' ? '#1e2330' : '#eef1f8', // light tone of rgb(233,238,246)
            paper:   mode === 'dark' ? '#2a2f3e' : '#fff',
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