import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useApp } from './lib/store'
import { dayKey } from './lib/dates'
import Auth from './screens/Auth'
import Today from './screens/Today'
import DayView from './screens/DayView'
import MonthView from './screens/MonthView'
import YearView from './screens/YearView'
import People from './screens/People'
import Settings from './screens/Settings'
import HighlightReminder from './components/HighlightReminder'

function ProfileHome() {
  const { username } = useParams()
  return <Navigate replace to={`/u/${username}/m/${dayKey().slice(0, 7)}`} />
}

export default function App() {
  const { user, profile } = useApp()
  if (user === undefined || (user && !profile)) return <div className="splash"><span className="wordmark">Days</span></div>
  if (!user) return <Auth />
  return (
    <>
    <HighlightReminder />
    <Routes>
      <Route path="/" element={<Today />} />
      <Route path="/u/:username" element={<ProfileHome />} />
      <Route path="/u/:username/m/:ym" element={<MonthView />} />
      <Route path="/u/:username/y/:year" element={<YearView />} />
      <Route path="/u/:username/d/:day" element={<DayView />} />
      <Route path="/people" element={<People />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
    </>
  )
}
