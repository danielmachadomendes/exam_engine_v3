import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import ExamRunner from './pages/ExamRunner';
import ExamResults from './pages/ExamResults';
import UserProfile from './pages/UserProfile';

const ProtectedRoute = ({ children, requireRole }) => {
    const { user, token } = useAuth();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (requireRole && user.role !== requireRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <UserProfile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/exam/:id/results"
                        element={
                            <ProtectedRoute>
                                <ExamResults />
                            </ProtectedRoute>
                        }
                    />

                    {/* User Protected */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/exam/:id"
                        element={
                            <ProtectedRoute>
                                <ExamRunner />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Protected */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute requireRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}