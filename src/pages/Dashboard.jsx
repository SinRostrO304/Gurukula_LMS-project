// src/pages/Dashboard.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Box, CircularProgress, } from '@mui/material';
import {  Outlet, useNavigate, useLocation } from 'react-router-dom';
// import { Box, CircularProgress, Typography } from '@mui/material';
// import { Routes, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import JoinClassDialog from '../components/JoinClassDialog';
import CreateClassDialog from '../components/CreateClassDialog';
import api from '../utils/api';
import { AuthContext } from '../auth/AuthProvider';
import { ColorModeContext } from '../shared-theme/AppTheme';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);
  const { mode, setMode } = useContext(ColorModeContext);
  const isDarkMode = mode === 'dark';

  // active section for sidebar
  const [activeSection, setActiveSection] = useState('dashboard');
  useEffect(() => {
    const seg = location.pathname.split('/')[1] || 'dashboard';
    setActiveSection(seg);
  }, [location.pathname]);

  // dialog states
  const [joinOpen, setJoinOpen]     = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // sidebar collapse
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(c => !c);

  // class lists
  const [teaching, setTeaching]   = useState(null);
  const [enrolled, setEnrolled]   = useState(null);

  useEffect(() => {
    api.get('/classes/teaching').then(r => setTeaching(r.data.classes));
    api.get('/classes/enrolled').then(r => setEnrolled(r.data.classes));
  }, [token]);

  // handle join click → return promise
  const handleJoinSubmit = (code) => {
    return api.post('/classes/join', { code })
      .then(({ data }) => {
        setJoinOpen(false);
        navigate(`/classes/${data.classId}`, { replace: true });
      });
  };

  const handleCreateSubmit = (form) => {
    return api.post('/classes/create', form)
      .then(() => setCreateOpen(false));
  };

  const handleSectionChange = (sec) => {
    navigate(
      sec === 'dashboard' ? '/dashboard' :
      sec === 'teaching'  ? '/teaching'  :
      sec === 'calendar'  ? '/calendar'  :
      sec === 'admin'     ? '/admin'     :
      `/${sec}`
    );
  };

  if (teaching === null || enrolled === null) {
    return <CircularProgress sx={{ mt:4, mx:'auto', display:'block' }}/>;
  }

  return (
    <Box sx={{ display:'flex' }}>
      <Header
        collapsed={collapsed}
        onSidebarToggle={toggleSidebar}
        onJoinCreate={action => action==='join' ? setJoinOpen(true) : setCreateOpen(true)}
      />

      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        collapsed={collapsed}
        toggleCollapsed={toggleSidebar}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setMode(isDarkMode?'light':'dark')}
        teachingCount={teaching.length}
      />

      <Box
        component="main"
        sx={(theme)=>({
          flexGrow:1,
          ml:`${(collapsed?80:240) + theme.spacing(2)}px`,
          mt:`${theme.mixins.toolbar.minHeight}px`,
          p:3,
          height:`calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
          overflow:'auto',
          bgcolor: theme.palette.background.paper,
        })}
      >
        <Outlet context={{ teaching, enrolled, collapsed }}/>
      </Box>

      <JoinClassDialog
        open={joinOpen}
        onClose={()=>setJoinOpen(false)}
        onSubmit={handleJoinSubmit}
      />
      <CreateClassDialog
        open={createOpen}
        onClose={()=>setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </Box>
  );
}
