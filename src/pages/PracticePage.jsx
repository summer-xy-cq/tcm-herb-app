import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAllHerbs } from '../utils/herbData'
import './PracticePage.css'

function PracticePage() {
    const navigate = useNavigate()
    const herbs = getAllHerbs()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    // 获取所有分类
    const categories = ['all', ...new Set(herbs.map(h => h.category))]

    // 过滤药材
    const filteredHerbs = herbs.filter(herb => {
        const matchesSearch = herb.name.includes(searchQuery) ||
            herb.pinyin.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || herb.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const practiceOptions = [
        {
            icon: '🎯',
            title: '随机练习',
            desc: '从题库中随机抽取题目',
            path: '/quiz/random',
            color: '#10B981'
        },
        {
            icon: '📚',
            title: '分类练习',
            desc: '按药物类别分类练习',
            path: '/quiz/category',
            color: '#8B5CF6'
        },
        {
            icon: '❌',
            title: '错题重练',
            desc: '巩固之前答错的题目',
            path: '/quiz/mistakes',
            color: '#EF4444'
        },
        {
            icon: '📝',
            title: '模拟考试',
            desc: '100题限时模拟测试',
            path: '/quiz/exam',
            color: '#F59E0B'
        }
    ]

    // State for Category Modal
    const [showCategoryModal, setShowCategoryModal] = useState(false)

    const handleModeClick = (e, option) => {
        if (option.path === '/quiz/category') {
            e.preventDefault() // Stop navigation
            setShowCategoryModal(true)
        }
    }

    const startCategoryQuiz = (cat) => {
        setShowCategoryModal(false)
        navigate(`/quiz/category/${cat}`)
    }

    return (
        <div className="page practice-page">
            <header className="page-header">
                <h1 className="page-title">题库练习</h1>
                <p className="page-subtitle">执业中药师考试真题与模拟题</p>
            </header>

            {/* 练习模式选择 */}
            <section className="practice-modes">
                <div className="modes-grid">
                    {practiceOptions.map(option => (
                        <Link
                            key={option.path}
                            to={option.path}
                            onClick={(e) => handleModeClick(e, option)}
                            className="mode-card touchable"
                            style={{ '--mode-color': option.color }}
                        >
                            <span className="mode-icon">{option.icon}</span>
                            <div className="mode-info">
                                <span className="mode-title">{option.title}</span>
                                <span className="mode-desc">{option.desc}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 按药材练习 */}
            <section className="practice-by-herb">
                <h2 className="section-title">按饮片练习</h2>

                {/* 搜索框 */}
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="搜索饮片名称或拼音..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* 分类筛选 */}
                <div className="category-filter">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat === 'all' ? '全部' : cat}
                        </button>
                    ))}
                </div>

                {/* 药材列表 */}
                <div className="herb-list">
                    {filteredHerbs.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-state-icon">🔍</span>
                            <p className="empty-state-text">未找到匹配的饮片</p>
                        </div>
                    ) : (
                        filteredHerbs.map(herb => (
                            <Link
                                key={herb.id}
                                to={`/herb/${herb.id}`}
                                state={{ showQuestions: true }}
                                className="herb-list-item touchable"
                            >
                                <div className="herb-item-info">
                                    <span className="herb-item-name">{herb.name}</span>
                                    <span className="herb-item-pinyin">{herb.pinyin}</span>
                                </div>
                                <span className="herb-item-category">{herb.category}</span>
                                <span className="herb-item-arrow">→</span>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            {/* Category Selection Modal */}
            {showCategoryModal && (
                <div className="dialog-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="dialog slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">选择练习分类</h3>
                        <p className="dialog-text" style={{ marginBottom: '16px' }}>请选择要专项突破的章节：</p>

                        <div className="category-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {categories.filter(c => c !== 'all').map(cat => (
                                <button
                                    key={cat}
                                    className="btn btn-secondary"
                                    onClick={() => startCategoryQuiz(cat)}
                                    style={{ fontSize: '14px', padding: '8px 4px' }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowCategoryModal(false)}
                            style={{ marginTop: '20px', width: '100%' }}
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PracticePage
