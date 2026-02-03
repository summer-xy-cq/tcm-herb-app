import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, getTotalUniqueHerbCount } from '../utils/storage'
import './ProfilePage.css'

function ProfilePage() {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [totalUniqueCount, setTotalUniqueCount] = useState(0)
    const [showClearCacheModal, setShowClearCacheModal] = useState(false)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        const statsData = await getStats()
        const uniqueCount = await getTotalUniqueHerbCount()
        setStats(statsData)
        setTotalUniqueCount(uniqueCount)
    }

    const totalStats = stats?.total || { recognized: 0, practiced: 0, correct: 0 }

    // Settings Menu Items
    const menuItems = [
        { icon: '🔒', title: '账号安全', desc: '修改密码、绑定手机', path: '#' },
        { icon: '⚙️', title: '通用设置', desc: '通知、语言、深色模式', path: '#' },
        { icon: '🗑️', title: '清除缓存', desc: '释放空间', onClick: () => setShowClearCacheModal(true) },
        { icon: 'ℹ️', title: '关于我们', desc: '当前版本 v1.0.0', path: '#' },
    ]

    const handleClearCache = async () => {
        // Mock clearing cache logic
        setShowClearCacheModal(false)
    }

    return (
        <div className="page profile-page">
            {/* User Header */}
            <header className="user-header">
                <div className="avatar-container">
                    <div className="avatar">👤</div>
                </div>
                <div className="user-info">
                    <h1 className="user-name">中药学员</h1>
                    <p className="user-id">ID: 8848</p>
                </div>
                <button className="btn-edit-profile">编辑</button>
            </header>

            {/* Achievement Section */}
            <section className="achievement-section">
                <div className="achievement-card">
                    <div
                        className="achievement-item touchable"
                        onClick={() => navigate('/uploads')}
                    >
                        <span className="achievement-value">{totalUniqueCount}</span>
                        <span className="achievement-label">累计识别 ›</span>
                    </div>
                    <div className="divider"></div>
                    <div
                        className="achievement-item touchable"
                        onClick={() => navigate('/history?filter=all')}
                    >
                        <span className="achievement-value">{totalStats.practiced}</span>
                        <span className="achievement-label">累计练习 ›</span>
                    </div>
                </div>
            </section>

            {/* Menu List */}
            <section className="menu-list">
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className="menu-item touchable"
                        onClick={item.onClick || (() => { })}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <div className="menu-content">
                            <span className="menu-title">{item.title}</span>
                            {item.desc && <span className="menu-desc">{item.desc}</span>}
                        </div>
                        <span className="menu-arrow">›</span>
                    </div>
                ))}
            </section>

            {/* Logout */}
            <button className="btn btn-secondary btn-block logout-btn" style={{ marginTop: 'auto', marginBottom: '20px' }}>
                退出登录
            </button>

            {/* Custom Clear Cache Modal */}
            {showClearCacheModal && (
                <div className="dialog-overlay" onClick={() => setShowClearCacheModal(false)}>
                    <div className="dialog slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">清除缓存</h3>
                        <p className="dialog-text">
                            确定要清除应用缓存吗？这不会删除您的学习记录。
                        </p>
                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => setShowClearCacheModal(false)}>
                                取消
                            </button>
                            <button className="btn btn-primary" onClick={handleClearCache}>
                                确认清除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfilePage
