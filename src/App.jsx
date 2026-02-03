import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import ScanPage from './pages/ScanPage'
import HerbDetailPage from './pages/HerbDetailPage'
import PracticePage from './pages/PracticePage'
import QuizPage from './pages/QuizPage'
import ProfilePage from './pages/ProfilePage'
import MyUploadsPage from './pages/MyUploadsPage'
import HistoryPage from './pages/HistoryPage'
import GalleryPage from './pages/GalleryPage'
import './App.css'

function App() {
    return (
        <div className="app">
            <Routes>
                <Route path="/uploads" element={<MyUploadsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/herb/:herbId" element={<HerbDetailPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/quiz/:mode/:category?" element={<QuizPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
            </Routes>
            <BottomNav />
        </div>
    )
}

export default App
