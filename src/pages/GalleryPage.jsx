import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllHerbs } from '../utils/herbData'
import './GalleryPage.css'

function GalleryPage() {
    const [herbs, setHerbs] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    useEffect(() => {
        setHerbs(getAllHerbs())
    }, [])

    // 获取所有分类
    const categories = ['all', ...new Set(herbs.map(h => h.category))]

    // 过滤药材
    const filteredHerbs = herbs.filter(herb => {
        const matchesSearch = herb.name.includes(searchQuery) ||
            herb.pinyin.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || herb.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    // 按分类分组
    const groupedHerbs = filteredHerbs.reduce((acc, herb) => {
        const category = herb.category
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(herb)
        return acc
    }, {})

    return (
        <div className="page gallery-page">
            <header className="page-header">
                <h1 className="page-title">饮片图鉴</h1>
                <p className="page-subtitle">收录220种常见中药饮片</p>
            </header>

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
            <div className="category-tabs">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat === 'all' ? '全部' : cat}
                    </button>
                ))}
            </div>

            {/* 药材列表 */}
            <div className="gallery-content">
                {selectedCategory === 'all' ? (
                    // 分组展示
                    Object.entries(groupedHerbs).map(([category, herbList]) => (
                        <div key={category} className="category-group">
                            <h3 className="category-title">{category}</h3>
                            <div className="herb-grid">
                                {herbList.map(herb => (
                                    <Link
                                        key={herb.id}
                                        to={`/herb/${herb.id}`}
                                        className="herb-card touchable"
                                    >
                                        <div className="herb-card-icon">🌿</div>
                                        <span className="herb-card-name">{herb.name}</span>
                                        <span className="herb-card-nature">
                                            {herb.properties?.nature}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // 单分类展示
                    <div className="herb-grid">
                        {filteredHerbs.map(herb => (
                            <Link
                                key={herb.id}
                                to={`/herb/${herb.id}`}
                                className="herb-card touchable"
                            >
                                <div className="herb-card-icon">🌿</div>
                                <span className="herb-card-name">{herb.name}</span>
                                <span className="herb-card-nature">
                                    {herb.properties?.nature}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}

                {filteredHerbs.length === 0 && (
                    <div className="empty-state">
                        <span className="empty-state-icon">🔍</span>
                        <p className="empty-state-text">未找到匹配的饮片</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GalleryPage
