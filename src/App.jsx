import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ParentProfile from './pages/ParentProfile'
import Children from './pages/Children'
import ChildForm from './pages/ChildForm'
import Journey from './pages/Journey'
import JourneyPicker from './pages/JourneyPicker'
import Community from './pages/Community'
import PostForm from './pages/PostForm'
import PostDetail from './pages/PostDetail'
import Consult from './pages/Consult'
import Rewards from './pages/Rewards'
import ProfessionalProfile from './pages/ProfessionalProfile'
import BookingFlow from './pages/BookingFlow'
import Payment from './pages/Payment'
import BookingDetail from './pages/BookingDetail'
import AdminHome from './pages/AdminHome'
import AdminPayments from './pages/AdminPayments'
import AdminPlaceholder from './pages/AdminPlaceholder'

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
        <Route path="/journey" element={<JourneyPicker />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/new" element={<PostForm />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/consult" element={<Consult />} />
        <Route path="/consult/:id" element={<ProfessionalProfile />} />
        <Route path="/consult/:id/book" element={<BookingFlow />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/bookings/:id/payment" element={<Payment />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route
          path="/admin/users"
          element={<AdminPlaceholder title="จัดการผู้ใช้" description="อยู่ระหว่างพัฒนา จะเปิดให้ใช้งานเร็วๆ นี้ค่ะ" />}
        />
        <Route
          path="/admin/community"
          element={<AdminPlaceholder title="จัดการคอมมูนิตี้" description="อยู่ระหว่างพัฒนา จะเปิดให้ใช้งานเร็วๆ นี้ค่ะ" />}
        />
        <Route
          path="/admin/revenue"
          element={<AdminPlaceholder title="รายได้" description="อยู่ระหว่างพัฒนา จะเปิดให้ใช้งานเร็วๆ นี้ค่ะ" />}
        />
        {/* /pro (Professional dashboard) จะสร้างในขั้นตอนถัดไป */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
