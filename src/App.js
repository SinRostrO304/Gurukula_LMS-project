// src/App.js
import React from 'react'
import {
  Routes,
  Route,
  Navigate,
  useOutletContext
} from 'react-router-dom'

import IntroPage          from './pages/IntroPage'
import LoginPage          from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'

import Dashboard          from './pages/Dashboard'
import ProtectedRoute     from './auth/ProtectedRoute'

import MainContent        from './components/MainContent'
import TeachingDashboard  from './components/TeachingDashboard'
import ManageClassPage    from './pages/ManageClassPage'
import CalendarPage       from './pages/CalendarPage'
import JoinClassLink from './pages/JoinClassLink'
import StudentDashboard   from './components/StudentDashboard'
import LearnClassPage from './pages/LearnClassPage'
import ClassworkDetailPage from './pages/ClassworkDetailPage'

// pull `collapsed` from Dashboard’s Outlet context
function TeachingDashboardWrapper() {
  const { collapsed } = useOutletContext()
  return <TeachingDashboard collapsed={collapsed} />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"       element={<IntroPage />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset"  element={<ResetPasswordPage />} />

      {/* Protected layout: Header + Sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        {/* default landing → /dashboard */}
        <Route index              element={<Navigate to="dashboard" replace />} />

        {/* inner pages */}
        <Route path="dashboard"   element={<MainContent />} />
        <Route path="teaching"    element={<TeachingDashboardWrapper />} />
        <Route path="calendar"    element={<CalendarPage />} />
        <Route path="classes/:id" element={<ManageClassPage />} />
        <Route path="learning" element={<StudentDashboard />} />
        <Route path="learn/:id"   element={<LearnClassPage />} />
        <Route
          path="classes/:id/assignments/:aid/details"
          element={<ClassworkDetailPage />}
        />
        {/* Auto-join via shared link */}
        <Route path="join" element={<JoinClassLink />} />
      </Route>
    </Routes>
  )
}