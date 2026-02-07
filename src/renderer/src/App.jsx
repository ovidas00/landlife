import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Locations from './pages/Locations'
import UploadDocument from './pages/UploadDocument'
import RecordsSearch from './pages/RecordsSearch'
import Dashboard from './pages/Dashboard'
import ReportsPage from './pages/Reports'
import ExportPage from './pages/Export'
import UpdateDocument from './pages/UpdateDocument'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadDocument />} />
          <Route path="/search" element={<RecordsSearch />} />
          <Route path="/search/edit-document" element={<UpdateDocument />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
