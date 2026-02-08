import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { getStats, getTodayUniqueHerbCount } from '../utils/storage'
import { getAllHerbs } from '../utils/herbData'
import './HomePage.css'

function HomePage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        today: { recognized: 0, practiced: 0, correct: 0 }
    })
    const [uniqueRecognizedCount, setUniqueRecognizedCount] = useState(0)

    // Daily Random Herb
    const dailyHerb = useMemo(() => {
        const herbs = getAllHerbs()
        if (!herbs.length) return null
        // Seed with date to make it consistent for the day, or just random on mount?
        // User asked for "Daily random play", usually implies consistent for the day or random each open.
        // Let's do random on each mount for "Daily random play" feel as requested text "random play".
        const randomIndex = Math.floor(Math.random() * herbs.length)
        return herbs[randomIndex]
    }, [])

    useEffect(() => {
        loadStats()
    }, [location])

    const loadStats = async () => {
        const data = await getStats()
        const uniqueCount = await getTodayUniqueHerbCount()

        if (data) {
            setStats(data)
        }
        setUniqueRecognizedCount(uniqueCount)
    }

    const todayStats = stats.today || { recognized: 0, practiced: 0, correct: 0 }
    const accuracy = todayStats.practiced > 0
        ? Math.round((todayStats.correct / todayStats.practiced) * 100)
        : 0

    const features = [
        {
            icon: '📷',
            title: '拍照识别',
            desc: '识别中药饮片',
            path: '/scan',
            color: '#10B981'
        },
        {
            icon: '📚',
            title: '饮片图鉴',
            desc: '我拍即我得', // Updated text
            path: '/gallery',
            color: '#8B5CF6'
        },
        {
            icon: '📝',
            title: '题库练习',
            desc: '真题与模拟考',
            path: '/practice',
            color: '#F59E0B'
        }
    ]

    return (
        <div className="page home-page">
            {/* 头部 */}
            <header className="home-header">
                <div className="home-logo">🌿</div>
                <h1 className="home-title">药瞳·智考</h1>
                <p className="home-subtitle">你的随身AI中药导师</p>
            </header>

            {/* 功能入口 */}
            <section className="home-features">
                <div className="features-grid">
                    {features.map(feature => (
                        <Link
                            key={feature.path}
                            to={feature.path}
                            className="feature-card touchable"
                            style={{ '--feature-color': feature.color }}
                        >
                            <span className="feature-icon">{feature.icon}</span>
                            <span className="feature-title">{feature.title}</span>
                            <span className="feature-desc">{feature.desc}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 学习统计 */}
            <section className="home-stats">
                <h2 className="section-title">今日学习</h2>
                <div className="stats-grid">
                    <div className="stat-item touchable" onClick={() => navigate('/uploads?filter=today')}>
                        <span className="stat-value">{uniqueRecognizedCount}</span>
                        <span className="stat-label">识别饮片</span>
                        <span className="stat-arrow">→</span>
                    </div>
                    <div className="stat-item touchable" onClick={() => navigate('/history?range=today')}>
                        <span className="stat-value">{todayStats.practiced}</span>
                        <span className="stat-label">练习题目</span>
                        <span className="stat-arrow">→</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{accuracy}%</span>
                        <span className="stat-label">正确率</span>
                    </div>
                </div>
            </section>

            {/* 智记 (Daily Herb) */}
            <section className="home-tips">
                <div className="tip-card">
                    <span className="tip-icon">💡</span>
                    <div className="tip-content">
                        <span className="tip-title">智考</span>
                        {dailyHerb ? (
                            <span className="tip-text">
                                <strong>{dailyHerb.name}</strong>，
                                {dailyHerb.properties.nature}。
                                归{dailyHerb.properties.channel}。
                                {dailyHerb.effects}
                            </span>
                        ) : (
                            <span className="tip-text">今天也要加油学习中药哦！</span>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default HomePage
