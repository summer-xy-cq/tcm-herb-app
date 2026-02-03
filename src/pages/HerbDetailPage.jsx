import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getHerbById } from '../utils/herbData'
import { getQuestionsByHerbId } from '../utils/questionData'
import { getUserImages, deleteUserImage } from '../utils/storage'
import './HerbDetailPage.css'

function HerbDetailPage() {
    const { herbId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [herb, setHerb] = useState(null)
    const [questions, setQuestions] = useState([])
    const [userImages, setUserImages] = useState([])
    const [activeTab, setActiveTab] = useState('info')
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showAnswer, setShowAnswer] = useState(false)

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [imageToDelete, setImageToDelete] = useState(null)

    useEffect(() => {
        const herbData = getHerbById(herbId)
        if (herbData) {
            setHerb(herbData)
            setQuestions(getQuestionsByHerbId(herbId))
            loadUserImages()
        }

        // 如果从识别页跳转过来，自动切换到题目标签
        if (location.state?.showQuestions) {
            setActiveTab('questions')
        }
    }, [herbId, location.state])

    const loadUserImages = async () => {
        const images = await getUserImages(herbId)
        setUserImages(images)
    }

    const handleSelectAnswer = (option) => {
        if (showAnswer) return
        setSelectedAnswer(option)
    }

    const handleCheckAnswer = () => {
        setShowAnswer(true)
    }

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1)
            setSelectedAnswer(null)
            setShowAnswer(false)
        }
    }

    const handlePrevQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1)
            setSelectedAnswer(null)
            setShowAnswer(false)
        }
    }

    // 删除图片逻辑 - 打开弹窗
    const handleDeleteImage = (imgId) => {
        // Ensure ID is string for comparison
        setImageToDelete(String(imgId))
        setShowDeleteModal(true)
    }

    // 确认删除
    const confirmDelete = async () => {
        if (!imageToDelete) return

        try {
            // 1. 乐观更新UI (Optimistic Update)
            setUserImages(prev => prev.filter(img => String(img.id) !== imageToDelete))
            setShowDeleteModal(false)

            // 2. 执行实际删除
            await deleteUserImage(herbId, imageToDelete)
        } catch (error) {
            console.error('Delete failed:', error)
            alert('删除失败，请重试')
            loadUserImages()
        }
    }

    if (!herb) {
        return (
            <div className="page herb-detail-page">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        )
    }

    const question = questions[currentQuestion]

    return (
        <div className="page herb-detail-page">
            {/* 返回按钮 */}
            <button className="back-btn" onClick={() => navigate(-1)}>
                ← 返回
            </button>

            {/* 药材头部 */}
            <header className="herb-detail-header">
                <h1 className="herb-detail-name">{herb.name}</h1>
                <p className="herb-detail-pinyin">{herb.pinyin} · {herb.latinName}</p>
                <div className="herb-detail-tags">
                    <span className="tag">{herb.category}</span>
                </div>
            </header>

            {/* 标签切换 */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    饮片信息
                </button>
                <button
                    className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('questions')}
                >
                    相关题目 {questions.length > 0 && <span className="tab-badge">{questions.length}</span>}
                </button>
                <button
                    className={`tab ${activeTab === 'images' ? 'active' : ''}`}
                    onClick={() => setActiveTab('images')}
                >
                    我的图片 {userImages.length > 0 && <span className="tab-badge">{userImages.length}</span>}
                </button>
            </div>

            {/* 药材信息 */}
            {activeTab === 'info' && (
                <div className="herb-info fade-in">
                    <section className="info-section">
                        <h3 className="info-title">来源</h3>
                        <p className="info-content">{herb.source}</p>
                    </section>

                    <section className="info-section">
                        <h3 className="info-title">性味归经</h3>
                        <div className="property-grid">
                            <div className="property-item">
                                <span className="property-label">性</span>
                                <span className="property-value">{herb.properties?.nature}</span>
                            </div>
                            <div className="property-item">
                                <span className="property-label">味</span>
                                <span className="property-value">{herb.properties?.flavor?.join('、')}</span>
                            </div>
                            <div className="property-item">
                                <span className="property-label">归经</span>
                                <span className="property-value">{herb.properties?.meridians?.join('、')}经</span>
                            </div>
                        </div>
                    </section>

                    <section className="info-section">
                        <h3 className="info-title">功效</h3>
                        <p className="info-content">{herb.effects}</p>
                    </section>

                    <section className="info-section">
                        <h3 className="info-title">主治</h3>
                        <p className="info-content">{herb.indications}</p>
                    </section>

                    <section className="info-section">
                        <h3 className="info-title">用法用量</h3>
                        <p className="info-content">{herb.dosage}</p>
                    </section>

                    {herb.caution && (
                        <section className="info-section caution-section">
                            <h3 className="info-title">⚠️ 使用注意</h3>
                            <p className="info-content">{herb.caution}</p>
                        </section>
                    )}

                    {herb.alias?.length > 0 && (
                        <section className="info-section">
                            <h3 className="info-title">别名</h3>
                            <p className="info-content">{herb.alias.join('、')}</p>
                        </section>
                    )}
                </div>
            )}

            {/* 相关题目 */}
            {activeTab === 'questions' && (
                <div className="herb-questions fade-in">
                    {questions.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">📝</span>
                            <p className="empty-state-text">暂无相关题目</p>
                        </div>
                    ) : (
                        <>
                            <div className="question-progress">
                                <span>第 {currentQuestion + 1} / {questions.length} 题</span>
                                <span className="question-source">{question.source}</span>
                            </div>

                            <div className="question-card card">
                                <p className="question-text">{question.question}</p>

                                <div className="question-options">
                                    {question.options.map((option, index) => {
                                        const letter = option.charAt(0)
                                        const isSelected = selectedAnswer === letter
                                        const isCorrect = letter === question.answer
                                        let optionClass = 'option-btn'

                                        if (showAnswer) {
                                            if (isCorrect) optionClass += ' correct'
                                            else if (isSelected) optionClass += ' wrong'
                                        } else if (isSelected) {
                                            optionClass += ' selected'
                                        }

                                        return (
                                            <button
                                                key={index}
                                                className={optionClass}
                                                onClick={() => handleSelectAnswer(letter)}
                                            >
                                                {option}
                                            </button>
                                        )
                                    })}
                                </div>

                                {showAnswer && (
                                    <div className="question-explanation fade-in">
                                        <h4>解析</h4>
                                        <p>{question.explanation}</p>
                                    </div>
                                )}
                            </div>

                            <div className="question-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestion === 0}
                                >
                                    上一题
                                </button>

                                {!showAnswer ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleCheckAnswer}
                                        disabled={!selectedAnswer}
                                    >
                                        确认答案
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleNextQuestion}
                                        disabled={currentQuestion === questions.length - 1}
                                    >
                                        下一题
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 我的图片 */}
            {activeTab === 'images' && (
                <div className="herb-images fade-in">
                    {userImages.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">📷</span>
                            <p className="empty-state-text">还没有拍摄此饮片的图片</p>
                            <button
                                className="btn btn-primary mt-md"
                                onClick={() => navigate('/scan')}
                            >
                                去拍照
                            </button>
                        </div>
                    ) : (
                        <div className="image-grid">
                            {userImages.map((img, index) => (
                                <div key={index} className="image-item-wrapper">
                                    <div className="image-item">
                                        <img src={img.data} alt={`${herb.name} ${index + 1}`} onClick={() => { }} />
                                    </div>
                                    <div className="image-actions">
                                        <span className="image-date">
                                            {new Date(img.timestamp).toLocaleDateString()}
                                        </span>
                                        <div className="action-buttons">
                                            <button className="action-btn delete-btn" onClick={() => handleDeleteImage(img.id)}>删除</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 自定义删除确认弹窗 */}
            {showDeleteModal && (
                <div className="dialog-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="dialog slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">确认删除</h3>
                        <p className="dialog-text">
                            确定要删除这张图片吗？此操作无法撤销。
                        </p>
                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                取消
                            </button>
                            <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={confirmDelete}>
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HerbDetailPage
