// src/pages/ManageClassPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon      from '@mui/icons-material/Settings';
import { useTheme }      from '@mui/material/styles';
import { ColorModeContext } from '../shared-theme/AppTheme';
import api               from '../utils/api';

import GeneralTab   from './GeneralTab';
import ClassworkTab from './ClassworkTab';
import PeopleTab    from './PeopleTab';
import GradeTab     from './GradeTab';

export default function ManageClassPage() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const { mode } = useContext(ColorModeContext);
  const { id }   = useParams();

  // -- State Hooks --
  const [tab, setTab]                   = useState(0);
  const [openSettings, setOpenSettings] = useState(false);
  const [form, setForm]                 = useState({ name: '', section: '' });
  const [loading, setLoading]           = useState(false);

  // -- Load class details when settings dialog opens --
  useEffect(() => {
    if (!openSettings) return;

    api.get(`/classes/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name,
          section: data.section
        });
      })
      .catch((err) => {
        console.error('Error fetching class details:', err);
      });
  }, [openSettings, id]);

  // -- Redirect if no valid class ID --
  if (!id) {
    return <Navigate to="/dashboard" replace />;
  }

  // -- Handlers --
  const handleTabChange = (_e, value) => {
    setTab(value);
  };

  const handleCalendarClick = () => {
    navigate('/calendar');
  };

  const handleSettingsClick = () => {
    setOpenSettings(true);
  };
  const handleSettingsClose = () => {
    setOpenSettings(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch(`/classes/${id}`, {
        name: form.name,
        section: form.section
      });
      setOpenSettings(false);
    } catch (err) {
      console.error('Error saving class settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/classes/${id}`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting class:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Tabs + Calendar & Settings Icons */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          px: 2,
          py: 1,
          bgcolor:
            mode === 'light'
              ? '#ffffff'
              : theme.palette.background.paper
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          sx={{ flexGrow: 1 }}
        >
          <Tab label="General" />
          <Tab label="Classwork" />
          <Tab label="People" />
          <Tab label="Grades" />
        </Tabs>

        <IconButton
          onClick={handleCalendarClick}
          sx={{ color: theme.palette.text.primary, mr: 1 }}
        >
          <CalendarTodayIcon />
        </IconButton>

        <IconButton
          onClick={handleSettingsClick}
          sx={{ color: theme.palette.text.primary }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ px: 2, pb: 2 }}>
        {tab === 0 && <GeneralTab   classId={id} />}
        {tab === 1 && <ClassworkTab classId={id} />}
        {tab === 2 && <PeopleTab    classId={id} />}
        {tab === 3 && <GradeTab     classId={id} />}
      </Box>

      {/* Settings Dialog */}
      <Dialog
        open={openSettings}
        onClose={handleSettingsClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Class Settings</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            margin="dense"
            label="Class Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Section"
            name="section"
            value={form.section}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Button
              color="error"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting…' : 'Delete Class'}
            </Button>
          </Box>
          <Box>
            <Button
              onClick={handleSettingsClose}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
