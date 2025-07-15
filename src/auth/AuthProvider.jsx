// src/auth/AuthProvider.jsx
import React, { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../utils/api'

export const AuthContext = createContext({
  user:       null,
  token:      null,
  login:      () => {},
  logout:     () => {},
  updateUser: () => {},
})

export function AuthProvider({ children }) {
  // 1) Load token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  // 2) Store full user profile here
  const [user, setUser]   = useState(null)

  // 3) Whenever token changes: decode and rehydrate user
  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    let payload
    try {
      payload = jwtDecode(token) // contains userId, email, name
    } catch {
      logout()
      return
    }

    // Show id/email/name/picture immediately
    setUser({
      id:    payload.userId,
      email: payload.email,
      name:  payload.name,
      picture: payload.picture,
    })

    // Optional: fetch fresh user data (e.g. created_at, roles)
    api.get('/users/me')
      .then((res) => {
        setUser(res.data.user)
      })
      .catch((err) => {
        console.warn('Could not fetch /users/me', err)
      })
  }, [token])

  // 4) login() stores token & immediate user object
  const login = ({ user, token }) => {
    localStorage.setItem('authToken', token)
    setToken(token)
    setUser(user)
  }

  // 5) logout() clears state & storage
  const logout = () => {
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
  }

  // 6) updateUser() merges in updated fields (e.g. name)
  const updateUser = (upd) => {
    setUser((prev) => ({ ...prev, ...upd }))
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}