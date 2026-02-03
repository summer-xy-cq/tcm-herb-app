import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStats, clearAllData, getTotalUniqueHerbCount, getAllUserImages } from '../utils/storage'
import './ProfilePage.css'

function ProfilePage() {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [totalUniqueCount, setTotalUniqueCount] = useState(0)
    const [showClearCacheModal, setShowClearCacheModal] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)
    const [exportStatus, setExportStatus] = useState('idle') // idle, exporting, done

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

    // 打开导出弹窗
    const handleExportClick = () => {
        setExportStatus('idle')
        setShowExportModal(true)
    }

    // 执行导出数据
    const handleExportConfirm = async () => {
        setExportStatus('exporting')

        try {
            // 1. 获取所有数据
            const allImages = await getAllUserImages()


            // 2. 构造导出对象 (只保留图片数据用于训练)
            const exportData = {
                user: 'student',
                timestamp: new Date().toISOString(),
                stats: stats,
                // High Value Data: Only export images with their labels and verification status
                images: allImages.map(img => ({
                    id: img.id,
                    herbId: img.herbId,
                    timestamp: img.timestamp,
                    verified: img.verified || false,
                    source: img.source || 'unknown',
                    data: img.data // Base64
                })),
                // mistakes: mistakes, (Removed: low training value)
                // quiz_history: quizHistory (Removed: low training value)
            }

            // 3. 转换为JSON字符串
            const dataStr = JSON.stringify(exportData, null, 2)
            const fileName = `tcm_data_${new Date().toISOString().slice(0, 10)}.json`

            // 尝试使用现代 File System Access API (显式保存对话框)
            try {
                if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'JSON Data',
                            accept: { 'application/json': ['.json'] },
                        }],
                    })
                    const writable = await handle.createWritable()
                    await writable.write(dataStr)
                    await writable.close()
                    setExportStatus('done')
                    alert('导出成功！')
                    return
                }
            } catch (err) {
                // 用户取消或不支持，降级处理
                if (err.name === 'AbortError') {
                    setExportStatus('idle')
                    return
                }
                console.warn('FS Access failed, falling back to download:', err)
            }

            // 4. 降级方案：创建下载链接
            const blob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            // 使用.json后缀，适合程序读取
            a.download = fileName
            document.body.appendChild(a)
            a.click()

            a.click()

            // 5. 延迟清理，确保下载已触发且文件名生效
            setTimeout(() => {
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                setExportStatus('done')
            }, 1500)

        } catch (e) {
            console.error('导出失败', e)
            setExportStatus('error')
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
                <div className="avatar-wrapper">
                    <div className="avatar">学</div>
                </div>
                <div className="user-info">
                    <h2 className="username">中药学徒</h2>
                    <p className="user-level">等级：初窥门径</p>
                </div>
            </div>

            {/* 学习统计 */}
            <div className="section-card fade-in">
                <h3 className="card-title">学习数据</h3>
                <div className="stats-row">
                    <div className="stat-item" onClick={() => navigate('/history?filter=all')} style={{ cursor: 'pointer' }}>
                        <span className="stat-value">{stats?.total?.practiced || 0}</span>
                        <span className="stat-label">累计练习 ›</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item" onClick={() => navigate('/uploads')} style={{ cursor: 'pointer' }}>
                        <span className="stat-value text-primary">{totalUniqueCount}</span>
                        <span className="stat-label">累计识别 ›</span>
                    </div>
                </div>
            </div>

            {/* 设置清单 */}
            <div className="settings-section fade-in">
                <h3 className="section-title">通用设置</h3>
                <div className="settings-list">
                    <button className="setting-item touchable" onClick={handleExportClick}>
                        <div className="setting-icon-wrapper" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                            📤
                        </div>
                        <div className="setting-content">
                            <span className="setting-label">导出学习数据</span>
                            <span className="setting-desc">发送给老师检查</span>
                        </div>
                        <span className="setting-arrow">›</span>
                    </button>

                    <button className="setting-item touchable" onClick={() => setShowClearCacheModal(true)}>
                        <div className="setting-icon-wrapper" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                            🗑️
                        </div>
                        <div className="setting-content">
                            <span className="setting-label">清除缓存数据</span>
                            <span className="setting-desc">释放存储空间</span>
                        </div>
                        <span className="setting-arrow">›</span>
                    </button>

                    <div className="setting-item">
                        <div className="setting-icon-wrapper" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                            ℹ️
                        </div>
                        <div className="setting-content">
                            <span className="setting-label">当前版本</span>
                        </div>
                        <span className="setting-value">v1.0.0</span>
                    </div>
                </div>
            </div>

            {/* Export Data Modal */}
            {showExportModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>📤 导出学习数据</h3>
                        <p>这将生成一个包含您所有学习历史（包括图片）的文件，请将其发送给老师。</p>

                        {exportStatus === 'done' ? (
                            <div className="export-success-msg" style={{ color: '#10B981', marginBottom: '20px', fontWeight: 'bold' }}>
                                ✅ 导出成功！文件已下载。
                            </div>
                        ) : null}

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                                {exportStatus === 'done' ? '关闭' : '取消'}
                            </button>
                            {exportStatus !== 'done' && (
                                <button className="btn btn-primary" onClick={handleExportConfirm} disabled={exportStatus === 'exporting'}>
                                    {exportStatus === 'exporting' ? '导出中...' : '确认导出'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Cache Modal */}
            {showClearCacheModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>⚠️ 危险操作</h3>
                        <p>确定要清除所有本地数据吗？您的识别记录、错题本和统计数据将永久丢失，无法恢复。</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowClearCacheModal(false)}>取消</button>
                            <button className="btn btn-danger" onClick={handleClearCache}>确定清除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfilePage
