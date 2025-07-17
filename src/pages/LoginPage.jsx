// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  TextField,
  Typography,
  Stack,
  IconButton,
  InputAdornment,
  Alert,
  Tooltip,
  // List,
  // ListItem,
  // ListItemIcon,
  // ListItemText,
  // FormHelperText,
} from '@mui/material'
// import CheckIcon from '@mui/icons-material/Check';
import MuiCard from '@mui/material/Card'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { styled } from '@mui/material/styles'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ColorModeSelect from '../shared-theme/ColorModeSelect'
import { SitemarkIcon } from './components/CustomIcons'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { AuthContext } from '../auth/AuthProvider'
import api from '../utils/api'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import { GoogleLogin } from '@react-oauth/google'

//  STYLED COMPONENTS
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: { width: 450 },
  boxShadow:
    'hsla(220,30%,5%,.05) 0 5px 15px, hsla(220,25%,10%,.05) 0 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220,30%,5%,.5) 0 5px 15px, hsla(220,25%,10%,.08) 0 15px 35px -5px',
  }),
}))

const ContainerStack = styled(Stack)(({ theme }) => ({
  height: '100dvh',
  padding: theme.spacing(2),
  position: 'relative',
  [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210,100%,97%), hsl(0,0%,100%))',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(ellipse at 50% 50%, hsla(210,100%,16%,.5), hsl(220,30%,5%))',
    }),
  },
}))

//  COMPONENT
export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const justVerified = searchParams.get('verified') === 'true'
  const justSignedUp = searchParams.get('signup') === 'true'
  const [isSignup, setIsSignup]     = useState(false)
  const [formData, setFormData]     = useState({ name: '', email: '', password: '' })
  const [errors, setErrors]         = useState({ name: '', email: '', password: '' })
  const [loading, setLoading]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function validate() {
    const next = { name: '', email: '', password: '' }
    let ok = true

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      next.email = 'Enter a valid email.'
      ok = false
    }
    if (formData.password.length < 6) {
      next.password = '≥ 6 characters.'
      ok = false
    }
    if (isSignup && !formData.name.trim()) {
      next.name = 'Name required.'
      ok = false
    }
    setErrors(next)
    return ok
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      // 1) call signup or login
      const endpoint = isSignup ? '/signup' : '/login'
      const payload  = isSignup
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password }

      const { data } = await api.post(endpoint, payload)

      if (isSignup) {
        // 2a) on signup: redirect back to login, show notice
        navigate('/login?mode=login&signup=true', { replace: true })
      } else {
        // 2b) on login: store token & user, go to dashboard
        login({ user: data.user, token: data.token })
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      console.error(isSignup ? 'Signup error:' : 'Login error:', err)
      const msg = err.response?.data?.error || err.message
      setErrors((prev) => ({ ...prev, email: msg, password: msg }))
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setFormData((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleGoogle = async (credentialResponse) => {
    try {
      const { data } = await api.post('/auth/google', {
        token: credentialResponse.credential
      });
      login({ user: data.user, token: data.token });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  };

  return (
    <>
      <ColorModeSelect sx={{ position: 'fixed', top: 16, right: 16 }} />

      <ContainerStack justifyContent="center" alignItems="center">
        {justVerified && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your email has been confirmed—please sign in below.
          </Alert>
        )}
        {justSignedUp && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Signup successful—check your email for a verification link.
          </Alert>
        )}

        <Card variant="outlined">
          <SitemarkIcon />
          <Typography variant="h4" sx={{ fontSize: 'clamp(2rem,10vw,2.15rem)' }}>
            {isSignup ? 'Sign up' : 'Sign in'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isSignup && (
              <FormControl>
                <FormLabel htmlFor="name">Full name</FormLabel>
                <TextField
                  id="name"
                  name="name"
                  required
                  fullWidth
                  value={formData.name}
                  error={!!errors.name}
                  helperText={errors.name}
                  onChange={handleChange}
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                id="email"
                name="email"
                required
                fullWidth
                value={formData.email}
                error={!!errors.email}
                helperText={errors.email}
                onChange={handleChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                value={formData.password}
                error={!!errors.password}
                helperText={errors.password}
                onChange={(e) => {handleChange(e)
                  if (errors.password) setErrors((p) => ({ ...p, password: '' }))
                }}
                InputProps={{
                  endAdornment: (
                    <>
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                      {isSignup && (
                        <InputAdornment position="end">
                          <Tooltip
                            placement="right"
                            arrow
                            title={
                              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                {[
                                  'At least 8 characters',
                                  'One lowercase letter',
                                  'One uppercase letter',
                                  'One digit',
                                  'One special character',
                                ].map((rule) => (
                                  <Box
                                    component="li"
                                    key={rule}
                                    sx={{ typography: 'body2' }}
                                  >
                                    {rule}
                                  </Box>
                                ))}
                              </Box>
                            }
                          >
                            <InfoOutlinedIcon color="action" />
                          </Tooltip>
                        </InputAdornment>
                      )}
                    </>
                  ),
                }}
                />
              {isSignup && (
                <PasswordStrengthMeter password={formData.password} />
            )}
            </FormControl>

            {!isSignup && (
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/forgot')}
                sx={{ alignSelf: 'flex-end' }}
              >
                Forgot password?
              </Link>
            )}

            {!isSignup && (
              <FormControlLabel
                control={<Checkbox defaultChecked color="primary" />}
                label="Remember me"
              />
            )}

            <Button type="submit" variant="contained" fullWidth disabled={loading || (isSignup && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(formData.password))}>
              {loading
                ? isSignup
                  ? 'Signing up…'
                  : 'Signing in…'
                : isSignup
                ? 'Sign up'
                : 'Sign in'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>or</Divider>
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => console.error('Google Login Error')}
            text={isSignup ? 'signup_with' : 'signin_with'}
          />

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <Link component="button" onClick={() => setIsSignup(false)}>
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don’t have an account?{' '}
                  <Link component="button" onClick={() => setIsSignup(true)}>
                    Sign up
                  </Link>
                </>
              )}
            </Typography>
          </Box>
        </Card>
      </ContainerStack>
    </>
  )
}