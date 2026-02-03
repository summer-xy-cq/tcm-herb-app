import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAllUserImages } from '../utils/storage'
import herbsData from '../data/herbs.json'
import './MyUploadsPage.css'

function MyUploadsPage() {
    const navigate = useNavigate()
    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)

    const [searchParams] = useSearchParams()
    const isTodayFilter = searchParams.get('filter') === 'today'

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const data = await getAllUserImages()
                // 补充药材名称
                let enrichedData = data.map(img => {
                    const herb = herbsData.find(h => h.id === img.herbId)
                    return {
                        ...img,
                        herbName: herb ? herb.name : '未知饮片'
                    }
                })

                // Apply date filter if needed
                if (isTodayFilter) {
                    const today = new Date().setHours(0, 0, 0, 0)
                    enrichedData = enrichedData.filter(img => {
                        const imgDate = new Date(img.timestamp).setHours(0, 0, 0, 0)
                        return imgDate === today
                    })
                }

                setImages(enrichedData)
            } catch (error) {
                console.error('Failed to load images', error)
            } finally {
                setLoading(false)
            }
        }
        fetchImages()
    }, [isTodayFilter])

    const handleImageClick = (herbId) => {
        navigate(`/herb/${herbId}`)
    }

    return (
        <div className="page uploads-page">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
                <h1 className="page-title">{isTodayFilter ? '今日识别' : '我的上传'}</h1>
                <p className="page-subtitle">{isTodayFilter ? '今天拍摄的中药饮片' : '您拍摄和保存的所有中药饮片'}</p>
            </header>

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            ) : images.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">🖼️</span>
                    <p className="empty-state-text">您还没有保存任何图片</p>
                    <button className="btn btn-primary mt-md" onClick={() => navigate('/scan')}>
                        去拍照识别
                    </button>
                </div>
            ) : (
                <div className="uploads-grid">
                    {images.map(img => (
                        <div key={img.id} className="upload-card touchable" onClick={() => handleImageClick(img.herbId)}>
                            <img src={img.data} alt={img.herbName} className="upload-image" />
                            <div className="upload-info">
                                <span className="upload-name">{img.herbName}</span>
                                <span className="upload-date">
                                    {new Date(img.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyUploadsPage
