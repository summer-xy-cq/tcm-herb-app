import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { recognizeHerb, computeImageHash } from '../utils/herbRecognition'
import { saveUserImage, saveSmartCorrection } from '../utils/storage'
import { getAllHerbs } from '../utils/herbData'
import './ScanPage.css'

function ScanPage() {
    const navigate = useNavigate()
    const fileInputRef = useRef(null)
    const [image, setImage] = useState(null)
    const [isRecognizing, setIsRecognizing] = useState(false)
    const [result, setResult] = useState(null)
    const [showSaveDialog, setShowSaveDialog] = useState(false)

    // Correction Modal State
    const [showCorrectModal, setShowCorrectModal] = useState(false)
    const [correctSearch, setCorrectSearch] = useState('')
    const allHerbs = useMemo(() => getAllHerbs(), [])

    // 处理图片选择
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const imageData = event.target.result
            setImage(imageData)
            setResult(null)
            // 不自动开始识别，等待用户点击
        }
        reader.readAsDataURL(file)
    }

    // 开始识别
    const handleStartRecognition = async () => {
        if (!image) return

        setIsRecognizing(true)
        setResult(null) // 清除旧结果

        try {
            const recognitionResult = await recognizeHerb(image)
            if (!recognitionResult) throw new Error('返回结果为空')
            setResult(recognitionResult)
        } catch (error) {
            console.error('识别流程异常:', error)
            setResult({ error: 'AI识图繁忙中，请稍后重试' })
        } finally {
            setIsRecognizing(false)
        }
    }

    // 使用相机
    const handleCamera = () => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('capture', 'environment')
            fileInputRef.current.click()
        }
    }

    // 从相册选择
    const handleGallery = () => {
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture')
            fileInputRef.current.click()
        }
    }

    // ... (save/view/reset handlers remain same)

    // 重置状态
    const handleReset = () => {
        setImage(null)
        setResult(null)
        setIsRecognizing(false)
        setShowSaveDialog(false)
        // 清理文件输入
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // 查看详情
    const handleViewDetail = () => {
        if (result?.herb?.id) {
            navigate(`/herb/${result.herb.id}`)
        }
    }

    // 保存图片
    const handleSaveImage = async () => {
        if (result?.herb?.id && image) {
            await saveUserImage(result.herb.id, image)
            setShowSaveDialog(false)
            // 可以添加一个简单的提示，这里简化处理
            alert('图片已保存到图库')
        }
    }

    // 处理纠错保存
    const handleCorrectSave = async (targetHerbId) => {
        if (image) {
            await saveUserImage(targetHerbId, image)

            // 🧠 Smart Learning: Save this correction
            try {
                const imageHash = await computeImageHash(image)
                await saveSmartCorrection(imageHash, targetHerbId)
            } catch (e) {
                console.error('Failed to learn correction:', e)
            }

            setShowCorrectModal(false)

            // 获取正确药材信息并更新结果显示，而不是重置
            const correctHerb = allHerbs.find(h => h.id === targetHerbId)
            if (correctHerb) {
                setResult({
                    herb: correctHerb,
                    confidence: '已修正', // 标记为人工修正
                    isCorrected: true
                })
                alert('已修正并保存，系统已“记住”这张图片！')
            } else {
                handleReset()
            }
        }
    }

    // 过滤供选择的药材列表
    const filteredHerbs = useMemo(() => {
        if (!correctSearch) return allHerbs
        const lower = correctSearch.toLowerCase()
        return allHerbs.filter(h =>
            h.name.includes(correctSearch) ||
            h.pinyin.toLowerCase().includes(lower)
        )
    }, [allHerbs, correctSearch])

    return (
        <div className="page scan-page">
            <header className="page-header">
                <h1 className="page-title">拍照识别</h1>
                <p className="page-subtitle">拍摄或上传中药饮片图片进行识别</p>
            </header>

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0,0,0,0)',
                    border: 0,
                    opacity: 0
                }}
            />

            {/* 识别区域 */}
            <div className="scan-area">
                {!image ? (
                    <div className="scan-empty">
                        <div className="scan-icon">📷</div>
                        <p className="scan-hint">点击下方按钮拍照或上传图片</p>
                    </div>
                ) : (
                    <div className="scan-preview">
                        <img src={image} alt="待识别图片" className="preview-image" />
                        {isRecognizing && (
                            <div className="scan-loading">
                                <div className="loading-spinner"></div>
                                <p>正在识别...</p>
                            </div>
                        )}
                        {!isRecognizing && !result && (
                            <div className="preview-actions">
                                <button className="btn btn-primary start-recognize-btn fade-in" onClick={handleStartRecognition}>
                                    🔍 开始识别
                                </button>
                                <button className="btn btn-danger-light discard-btn fade-in" onClick={handleReset}>
                                    🗑️ 丢弃
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 操作按钮 */}
            {!image && (
                <div className="scan-actions">
                    <button className="scan-btn camera-btn touchable" onClick={handleCamera}>
                        <span className="scan-btn-icon">📷</span>
                        <span>拍照</span>
                    </button>
                    <button className="scan-btn gallery-btn touchable" onClick={handleGallery}>
                        <span className="scan-btn-icon">🖼️</span>
                        <span>相册</span>
                    </button>
                </div>
            )}

            {/* 识别结果 */}
            {result && !result.error && (
                <div className="scan-result fade-in">
                    <div className="result-header">
                        <div className="result-confidence">
                            <span className="confidence-label">识别置信度</span>
                            <span className="confidence-value">{result.confidence}%</span>
                        </div>
                    </div>

                    <div className="result-herb card">
                        <div className="herb-header">
                            <h2 className="herb-name">{result.herb?.name}</h2>
                            <span className="herb-pinyin">{result.herb?.pinyin}</span>
                        </div>

                        <div className="herb-tags">
                            <span className="tag">{result.herb?.properties?.nature}</span>
                            {result.herb?.properties?.flavor?.map((f, i) => (
                                <span key={i} className="tag tag-secondary">{f}</span>
                            ))}
                        </div>

                        <p className="herb-effects">{result.herb?.effects}</p>

                        <div className="result-actions">
                            <button className="btn btn-secondary" onClick={() => setShowSaveDialog(true)}>
                                💾 保存图片
                            </button>
                            <button className="btn btn-primary" onClick={handleViewDetail}>
                                查看详情 & 相关题目 →
                            </button>
                        </div>
                        <button className="btn btn-text error-report-btn" onClick={() => setShowCorrectModal(true)}>
                            识别错误？点此修正
                        </button>
                    </div>

                    <button className="btn btn-secondary btn-block mt-md" onClick={handleReset}>
                        重新识别
                    </button>
                </div>
            )}

            {/* 识别错误 */}
            {result?.error && (
                <div className="scan-error fade-in">
                    <div className="error-icon">❌</div>
                    <p className="error-text">{result.error}</p>
                    <button className="btn btn-primary" onClick={handleReset}>
                        重新识别
                    </button>
                </div>
            )}

            {/* 保存图片对话框 */}
            {showSaveDialog && (
                <div className="dialog-overlay" onClick={() => setShowSaveDialog(false)}>
                    <div className="dialog slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">保存到我的图库</h3>
                        <p className="dialog-text">
                            将此图片保存到「{result?.herb?.name}」的图库中，方便日后复习查看。
                        </p>
                        <div className="dialog-actions">
                            <button className="btn btn-secondary" onClick={() => setShowSaveDialog(false)}>
                                取消
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveImage}>
                                确认保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 纠错弹窗 */}
            {showCorrectModal && (
                <div className="dialog-overlay" onClick={() => setShowCorrectModal(false)}>
                    <div className="dialog slide-up correct-dialog" onClick={e => e.stopPropagation()}>
                        <h3 className="dialog-title">修正识别结果</h3>
                        <p className="dialog-text">请输入正确的饮片名称，我们将保存到正确的图库中。</p>

                        <input
                            type="text"
                            className="search-input"
                            placeholder="搜索正确名称..."
                            value={correctSearch}
                            onChange={(e) => setCorrectSearch(e.target.value)}
                            autoFocus
                        />

                        <div className="herb-list-scroll" style={{ maxHeight: '40vh' }}>
                            {filteredHerbs.map(h => (
                                <div key={h.id} className="herb-option" onClick={() => handleCorrectSave(h.id)}>
                                    <span className="herb-name">{h.name}</span>
                                    <span className="action-tag">保存</span>
                                </div>
                            ))}
                        </div>

                        <div className="dialog-actions mt-md">
                            <button className="btn btn-danger-text" onClick={() => {
                                setShowCorrectModal(false)
                                handleReset() // 删除/丢弃
                            }}>
                                🗑️ 删除并重新拍摄
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowCorrectModal(false)}>
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScanPage
