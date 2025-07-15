// src/pages/components/CustomIcons.jsx
import React from 'react';
import { SvgIcon } from '@mui/material';

export function GoogleIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M21.35 11.1h-9.18v2.82h5.97c-.26 1.45-1.85 4.3-5.97 4.3-3.59 0-6.52-2.96-6.52-6.6 0-3.63 2.93-6.6 
        6.52-6.6 2.04 0 3.41.87 4.2 1.62l2.87-2.77C18.9 2.14 16.41 1 13.49 1 7.51 1 2.88 5.53 2.88 11.1s4.63 
        10.1 10.61 10.1c6.15 0 10.25-4.31 10.25-10.39 0-.7-.07-1.27-.16-1.6z" />
    </SvgIcon>
  );
}

export function SitemarkIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
    </SvgIcon>
  );
}