// import { useState } from 'react'
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Pendents from './pages/Pendents';
import UserPage from './pages/UserPage';
import ListsPage from './pages/ListsPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { ShoppingListProvider } from './contexts/ShoppingListContext';
import { CalendarProvider } from './contexts/CalendarContext';
import CalendarPage from './pages/CalendarPage';
import './App.css'
import { BrowserRouter, Routes, Route }  from 'react-router-dom';

function App() {
  // const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <ShoppingListProvider>
        <CalendarProvider>
          <Navbar/>
          <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/pendents" element={<Pendents/>}/>
            <Route path="/profile" element={<UserPage/>}/>
            <Route path="/lists" element={<ListsPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/mapa" element={<MapPage/>}/>
            <Route path="/calendari" element={<CalendarPage/>}/>
            <Route path="/grafics" element={<AnalyticsPage/>}/>
          </Routes>
        </CalendarProvider>
      </ShoppingListProvider>
    </BrowserRouter>
  )
}

export default App
