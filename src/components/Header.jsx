// src/components/Header.jsx
import React, { useState, useContext } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Popover,
  Button,
  Avatar,
  Stack,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AddIcon  from '@mui/icons-material/Add'
import { useTheme } from '@mui/material/styles'
import api      from '../utils/api'
import { AuthContext } from '../auth/AuthProvider'
import CropAvatarDialog from './CropAvatarDialog'

export default function Header({ collapsed, onSidebarToggle, onJoinCreate, onNameChange }) {
  const { user, logout, updateUser } = useContext(AuthContext)
  const theme = useTheme()

  // 1) Join/Create menu state
  const [joinAnchorEl, setJoinAnchorEl] = useState(null)
  const openJoinMenu  = (e) => setJoinAnchorEl(e.currentTarget)
  const closeJoinMenu = () => setJoinAnchorEl(null)
  const handleJoinCreate = (action) => {
    closeJoinMenu()
    onJoinCreate(action)      // passed in from Dashboard
  }

  // 2) Profile menu & cropper state
  const [profileAnchorEl, setProfileAnchorEl] = useState(null)
  const openProfile = (e)     => setProfileAnchorEl(e.currentTarget)
  const closeProfile= ()      => setProfileAnchorEl(null)

  const [rawFile, setRawFile]   = useState(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  if (!user) return null

  // avatar fallback
  const seed = encodeURIComponent(user.email || user.name)
  const avatarUrl = user.picture
    ? user.picture
    : `https://api.dicebear.com/6.x/identicon/svg?seed=${seed}`

  // 3) File picker → crop → upload
  const handlePickFile = () => {
    closeProfile()
    document.getElementById('avatar-input').click()
  }
  const handleCropped = async (blob) => {
    setUploading(true)
    const form = new FormData()
    form.append('avatar', blob, blob.name)
    const { data } = await api.put('/users/avatar', form)
    updateUser({ picture: data.picture })
    setUploading(false)
    setCropOpen(false)
    setRawFile(null)
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex:        (t) => t.zIndex.drawer + 1,
          bgcolor:       '#f8fafd',
          boxShadow:     'none',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={onSidebarToggle}
            sx={{ mr: 2, color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>LMS</Typography>
          <Box sx={{ flexGrow: 1 }}/>

          {/* Join/Create */}
          <IconButton onClick={openJoinMenu} sx={{ mr: 1, color: theme.palette.text.primary }}>
            <AddIcon />
          </IconButton>
          <Menu
            anchorEl={joinAnchorEl}
            open={Boolean(joinAnchorEl)}
            onClose={closeJoinMenu}
          >
            <MenuItem onClick={() => handleJoinCreate('join')}>Join Class</MenuItem>
            <MenuItem onClick={() => handleJoinCreate('create')}>Create Class</MenuItem>
          </Menu>

          {/* Profile */}
          <IconButton onClick={openProfile} sx={{ color: theme.palette.text.primary }}>
            <Avatar src={avatarUrl} alt={user.name}/>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Popover */}
      <Popover
        open={Boolean(profileAnchorEl)}
        anchorEl={profileAnchorEl}
        onClose={closeProfile}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top',    horizontal: 'right' }}
        PaperProps={{ sx:{ p:2, width:300, bgcolor:'rgb(233,238,246)' } }}
      >
        <Stack alignItems="center" spacing={2}>
          <Avatar src={avatarUrl} sx={{ width:80, height:80 }} />
          <Typography variant="h6">{`Hello, ${user.name}`}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Box sx={{ width:'100%', height:1, bgcolor:'divider', my:1 }}/>

          {/* Change Name */}
          <Button variant="outlined" fullWidth onClick={() => onNameChange?.()}>
            Change User Name
          </Button>
          {/* Change Avatar */}
          <Button variant="outlined" fullWidth onClick={handlePickFile}>
            Change Profile Picture
          </Button>
          {/* Sign Out */}
          <Button variant="contained" fullWidth color="error" onClick={logout}>
            Sign Out
          </Button>
        </Stack>
      </Popover>

      {/* Hidden file input */}
      <input
        id="avatar-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) {
            setRawFile(f)
            setCropOpen(true)
          }
        }}
      />

      {/* Crop Dialog */}
      {cropOpen && rawFile && (
        <CropAvatarDialog
          open={cropOpen}
          imageFile={rawFile}
          uploading={uploading}
          onCropComplete={handleCropped}
          onClose={() => setCropOpen(false)}
        />
      )}
    </>
  )
}