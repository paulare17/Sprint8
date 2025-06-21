// import { useState } from 'react'
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Pendents from './pages/Pendents';
import UserPage from './pages/UserPage';
import FirebaseErrorHandler from './components/FirebaseErrorHandler';
import './App.css'
import { BrowserRouter, Routes, Route }  from 'react-router-dom';

function App() {
  // const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <FirebaseErrorHandler>
        <Navbar/>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/pendents" element={<Pendents/>}/>
          <Route path="/profile" element={<UserPage/>}/>
        </Routes>
      </FirebaseErrorHandler>
    </BrowserRouter>
  )
}

export default App
