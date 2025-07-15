// src/shared-theme/ColorModeIconDropdown.jsx
import * as React from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useColorScheme } from '@mui/material/styles';

export default function ColorModeIconDropdown(props) {
  const { mode, systemMode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleMode = (m) => () => {
    setMode(m);
    handleClose();
  };

  const active = systemMode || mode;
  const Icon = active === 'dark' ? DarkModeIcon : LightModeIcon;

  return (
    <>
      <IconButton onClick={handleClick} {...props}>
        <Icon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: { variant: 'outlined', elevation: 0, sx: { my: 1 } },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem selected={active === 'system'} onClick={handleMode('system')}>System</MenuItem>
        <MenuItem selected={active === 'light'} onClick={handleMode('light')}>Light</MenuItem>
        <MenuItem selected={active === 'dark'} onClick={handleMode('dark')}>Dark</MenuItem>
      </Menu>
    </>
  );
}