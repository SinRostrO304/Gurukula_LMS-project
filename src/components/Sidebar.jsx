// src/pages/Sidebar.jsx
import React from 'react';
import {
  Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Box
} from '@mui/material';
import Badge from '@mui/material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTheme } from '@mui/material/styles';

export default function Sidebar({
  activeSection,
  onSectionChange,
  collapsed,
  toggleCollapsed,
  isDarkMode,
  onThemeToggle,
  teachingCount = 0
}) {
  const theme = useTheme();
  const width = collapsed ? 80 : 240;
  const headerH = theme.mixins.toolbar.minHeight;

  const items = [
    { id:'dashboard', label:'Home',     icon:<HomeIcon/> },
    { id:'calendar',  label:'Calendar', icon:<CalendarTodayIcon/> },
    { id:'learning',  label:'Learning', icon:<SchoolIcon/> },
    {
      id:'teaching',
      label:'Teaching',
      icon:(
        <Badge badgeContent={teachingCount} color="primary">
          <MenuBookIcon/>
        </Badge>
      )
    },
    { id:'admin',     label:'Admin',    icon:<AdminPanelSettingsIcon/> },
  ];

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        '& .MuiDrawer-paper': {
          boxSizing:'border-box',
          width,
          top: `${headerH}px`,
          height: `calc(100vh - ${headerH}px)`,
          bgcolor:'#f8fafd',
          borderRight:'none',
          position:'relative'
        }
      }}
    >
      <Box sx={{ flexGrow:1, mt:2 }}>
        <List disablePadding>
          {items.map(({id,label,icon}) => (
            <ListItemButton
              key={id}
              selected={activeSection===id}
              onClick={()=>onSectionChange(id)}
              sx={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                px:2.5, mb:1,
                '&.Mui-selected': {
                  bgcolor: theme.palette.action.selected,
                  '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                    color: theme.palette.primary.main
                  }
                }
              }}
            >
              <ListItemIcon sx={{
                minWidth:0,
                mr: collapsed? 0: 2,
                justifyContent:'center',
                color: activeSection===id
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary
              }}>
                {icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={label}/>}
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box>
        <List disablePadding>
          <ListItemButton onClick={onThemeToggle} sx={{ justifyContent:collapsed?'center':'flex-start', px:2.5 }}>
            <ListItemIcon sx={{minWidth:0, mr:collapsed?0:3, justifyContent:'center'}}>
              {isDarkMode ? <Brightness7Icon/> : <Brightness4Icon/>}
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Theme"/>}
          </ListItemButton>
          <ListItemButton onClick={toggleCollapsed} sx={{ justifyContent:collapsed?'center':'flex-start', px:2.5 }}>
            <ListItemIcon sx={{minWidth:0, mr:collapsed?0:3, justifyContent:'center'}}>
              <SettingsIcon/>
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Settings"/>}
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
