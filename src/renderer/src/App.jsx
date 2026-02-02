import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import Locations from './pages/Locations'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<h1>Dashboard</h1>} />
          <Route path="/upload" element={<h1>Upload</h1>} />
          <Route path="/search" element={<h1>Search</h1>} />
          <Route path="/locations" element={<Locations />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
