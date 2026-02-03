import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, clearAllData, getTotalUniqueHerbCount, getAllUserImages, getMistakes, getQuizHistory } from '../utils/storage'
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

    const handleClearCache = async () => {
        await clearAllData()
        setShowClearCacheModal(false)
        await loadStats() // Reload stats to show 0
        alert('本地学习记录已清除')
    }

    // 导出数据功能
    const handleExportData = async () => {
        const confirmExport = window.confirm('是否导出所有练习记录和图片数据？\n这将生成一个包含您所有学习历史的文件，您可以将其发送给老师。')
        if (!confirmExport) return

        try {
            // 1. 获取所有数据
            const allImages = await getAllUserImages()
            const mistakes = await getMistakes()
            const quizHistory = await getQuizHistory()

            // 2. 构造导出对象
            const exportData = {
                user: 'student', // 可以扩展为真实用户名
                timestamp: new Date().toISOString(),
                stats: stats,
                images: allImages,
                mistakes: mistakes,
                quiz_history: quizHistory
            }

            // 3. 转换为JSON字符串
            const dataStr = JSON.stringify(exportData, null, 2)

            // 4. 创建下载链接
            const blob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tcm_data_${new Date().toISOString().slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()

            // 5. 清理
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

        } catch (e) {
            console.error('导出失败', e)
            alert('导出数据失败，请稍后重试')
        }
    }

    return (
        <div className="page profile-page">
            <header className="page-header">
                <h1 className="page-title">个人中心</h1>
            </header>

            {/* 用户信息卡片 */}
            <div className="profile-card fade-in">
                <div className="avatar">
                    <span>学</span>
                </div>
                <div className="user-info">
                    <h2 className="username">中药学徒</h2>
                    <p className="user-level">等级：初窥门径</p>
                </div>
            </div>

            {/* 学习统计 */}
            <div className="stats-grid fade-in">
                <div className="stat-card">
                    <span className="stat-value">{stats?.today?.practiced || 0}</span>
                    <span className="stat-label">今日练习</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats?.today?.correct || 0}</span>
                    <span className="stat-label">今日正确</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats?.total?.practiced || 0}</span>
                    <span className="stat-label">累计练习</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{stats?.total?.correct || 0}</span>
                    <span className="stat-label">累计正确</span>
                </div>
            </div>

            {/* 成就与数据 */}
            <div className="achievements-section fade-in">
                <h3 className="section-title">学习成就</h3>
                <div className="achievement-list">
                    <div
                        className="achievement-item touchable"
                        onClick={() => navigate('/uploads')}
                    >
                        <span className="achievement-value">{totalUniqueCount}</span>
                        <span className="achievement-label">累计识别 ›</span>
                    </div>
                </div>
            </div>

            {/* 设置清单 */}
            <div className="settings-list fade-in" style={{ marginTop: '20px' }}>
                <button className="setting-item touchable" onClick={handleExportData}>
                    <span className="setting-icon">📤</span>
                    <span className="setting-label">导出学习数据 (给老师)</span>
                    <span className="setting-arrow">›</span>
                </button>

                <button className="setting-item touchable" onClick={() => setShowClearCacheModal(true)}>
                    <span className="setting-icon">🗑️</span>
                    <span className="setting-label">清除缓存数据</span>
                    <span className="setting-arrow">›</span>
                </button>

                <div className="setting-item">
                    <span className="setting-icon">ℹ️</span>
                    <span className="setting-label">当前版本</span>
                    <span className="setting-value">v1.0.0</span>
                </div>
            </div>

            {/* Clear Cache Modal */}
            {showClearCacheModal && (
                <div className="dialog-overlay" onClick={() => setShowClearCacheModal(false)}>
                    <div className="dialog slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">⚠️ 危险操作</h3>
                        <p className="dialog-text">
                            确定要清除所有本地数据吗？您的识别记录、错题本和统计数据将永久丢失，无法恢复。
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
