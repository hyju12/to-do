import { BrowserRouter, Routes, Route } from 'react-router'
import Home from './pages/Home.tsx'
import Home_1 from './pages/Home_1.tsx'
import Home_2 from './pages/Home_2.tsx'
import Home_3 from './pages/Home_3.tsx'
import BrightnessTool from './pages/BrightnessTool.tsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BrightnessTool />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Home_1" element={<Home_1 />} />
        <Route path="/Home_2" element={<Home_2 />} />
        <Route path="/Home_3" element={<Home_3 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
