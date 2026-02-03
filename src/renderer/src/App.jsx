import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Locations from './pages/Locations'
import UploadDocument from './pages/UploadDocument'
import RecordsSearch from './pages/RecordsSearch'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<h1>Dashboard</h1>} />
          <Route path="/upload" element={<UploadDocument />} />
          <Route path="/search" element={<RecordsSearch />} />
          <Route path="/locations" element={<Locations />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
