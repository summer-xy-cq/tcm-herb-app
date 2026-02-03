import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAllQuizRecords, clearQuizHistory } from '../utils/storage'
import './HistoryPage.css'

function HistoryPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // Params
    const initialFilter = searchParams.get('filter') || 'all'
    const range = searchParams.get('range') || 'all' // 'today' or 'all'

    // State
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState(initialFilter) // 'all', 'correct', 'wrong'
    const [showClearModal, setShowClearModal] = useState(false)

    useEffect(() => {
        fetchRecords()
    }, [range])

    const fetchRecords = async () => {
        try {
            let data = await getAllQuizRecords()

            // Filter by date range first
            if (range === 'today') {
                const today = new Date().setHours(0, 0, 0, 0)
                data = data.filter(r => {
                    const rDate = new Date(r.timestamp).setHours(0, 0, 0, 0)
                    return rDate === today
                })
            }

            setRecords(data)
        } catch (error) {
            console.error('Failed to load history', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter logic
    const filteredRecords = records.filter(record => {
        if (filter === 'correct') return record.isCorrect
        if (filter === 'wrong') return !record.isCorrect
        return true
    })

    const handleClearHistory = async () => {
        await clearQuizHistory()
        setRecords([])
        setShowClearModal(false)
    }

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="page history-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
                <div className="header-title-container">
                    <h1 className="page-title">{range === 'today' ? '今日练习' : '学习历史'}</h1>
                    {records.length > 0 && (
                        <button className="btn-clear-history" onClick={() => setShowClearModal(true)}>
                            🗑️
                        </button>
                    )}
                </div>
            </header>

            <div className="filter-tabs">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    全部
                </button>
                <button
                    className={`filter-tab ${filter === 'wrong' ? 'active' : ''}`}
                    onClick={() => setFilter('wrong')}
                >
                    只看答错
                </button>
                <button
                    className={`filter-tab ${filter === 'correct' ? 'active' : ''}`}
                    onClick={() => setFilter('correct')}
                >
                    只看答对
                </button>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">
                        {filter === 'wrong' ? '✅' : '📝'}
                    </span>
                    <p className="empty-state-text">
                        {filter === 'wrong'
                            ? '太棒了，没有答错的题目！'
                            : filter === 'correct'
                                ? '还没有答对的题目记录'
                                : '还没有练习记录'}
                    </p>
                    {filter === 'all' && (
                        <button className="btn btn-primary mt-md" onClick={() => navigate('/practice')}>
                            去练习
                        </button>
                    )}
                </div>
            ) : (
                <div className="history-list">
                    {filteredRecords.map(record => (
                        <div key={record.id} className="history-item">
                            <div className="history-header">
                                <span className={`status-badge ${record.isCorrect ? 'correct' : 'wrong'}`}>
                                    {record.isCorrect ? '✅ 答对' : '❌ 答错'}
                                </span>
                                <span className="history-time">{formatDate(record.timestamp)}</span>
                            </div>

                            <div className="history-content">
                                <p className="history-question">{record.question.question}</p>
                                <div className="history-answer">
                                    <span className="label">您的选择:</span>
                                    <span className={`value ${record.isCorrect ? 'text-correct' : 'text-wrong'}`}>
                                        {record.userAnswer}
                                    </span>
                                </div>
                                {!record.isCorrect && (
                                    <div className="history-answer">
                                        <span className="label">正确答案:</span>
                                        <span className="value text-correct">{record.question.answer}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Clear Confirmation Modal */}
            {showClearModal && (
                <div className="dialog-overlay" onClick={() => setShowClearModal(false)}>
                    <div className="dialog slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">清空历史</h3>
                        <p className="dialog-text">
                            确定要清空所有的练习记录吗？<br /> 此操作不可恢复。
                        </p>
                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => setShowClearModal(false)}>
                                取消
                            </button>
                            <button className="btn btn-danger" onClick={handleClearHistory} style={{ backgroundColor: '#EF4444', color: 'white' }}>
                                确认清空
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HistoryPage
