"use client"

import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import LoadingSpinner from "./LoadingSpinner"

interface PrivateRouteProps {
  children: ReactNode
  allowedRoles: string[]
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} />
  }

  return <>{children}</>
}

export default PrivateRoute
