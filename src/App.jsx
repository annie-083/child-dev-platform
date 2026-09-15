import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ParentProfile from './pages/ParentProfile'
import Children from './pages/Children'
import ChildForm from './pages/ChildForm'
import Journey from './pages/Journey'
import Community from './pages/Community'
import PostForm from './pages/PostForm'
import PostDetail from './pages/PostDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ParentProfile />} />
        <Route path="/children" element={<Children />} />
        <Route path="/children/new" element={<ChildForm />} />
        <Route path="/children/:id" element={<ChildForm />} />
        <Route path="/children/:childId/journey" element={<Journey />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/new" element={<PostForm />} />
        <Route path="/community/:id" element={<PostDetail />} />
        {/* /pro และ /admin จะสร้างในขั้นตอนถัดไป (Professional Dashboard, Admin Dashboard) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
