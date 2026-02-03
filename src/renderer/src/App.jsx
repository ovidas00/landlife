import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Locations from './pages/Locations'
import UploadDocument from './pages/UploadDocument'
import RecordsSearch from './pages/RecordsSearch'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<UploadDocument />} />
          <Route path="/search" element={<RecordsSearch />} />
          <Route path="/locations" element={<Locations />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
