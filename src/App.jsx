import { Routes, Route} from 'react-router-dom'
import  Home  from './pages/Home'
import Profile from './pages/Profile'
import Header from './components/Header'

import './App.css'

function App() {

  return (
    <>
    <Header />
    <Routes>
        <Route path='/' element={<Home />} />
        <Route path='profile/:id' element={<Profile />} />
    </Routes>
    </>
  )
}

export default App
