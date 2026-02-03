import localforage from 'localforage'

// 配置存储
localforage.config({
    name: 'tcm-herb-app',
    storeName: 'user_data'
})

// 获取初始数据副本
const getInitialStats = () => ({
    today: { recognized: 0, practiced: 0, correct: 0 },
    total: { recognized: 0, practiced: 0, correct: 0 }
})

// 保存用户拍摄的图片
export const saveUserImage = async (herbId, imageData) => {
    try {
        const key = `images_${herbId}`
        const currentImages = (await localforage.getItem(key)) || []

        const newImage = {
            id: Date.now().toString(),
            data: imageData,
            timestamp: Date.now(),
            verified: false, // Default verification status
            source: 'ai'     // Default source
        }

        await localforage.setItem(key, [newImage, ...currentImages])
        return newImage
    } catch (e) {
        console.error('Save image failed', e)
    }
}

// 获取用户拍摄的图片
export const getUserImages = async (herbId) => {
    const key = `images_${herbId}`
    return (await localforage.getItem(key)) || []
}

// 获取用户所有拍摄的图片
export const getAllUserImages = async () => {
    try {
        const keys = await localforage.keys()
        const imageKeys = keys.filter(k => k.startsWith('images_'))

        let allImages = []
        for (const key of imageKeys) {
            const images = await localforage.getItem(key)
            if (Array.isArray(images)) {
                // 为每个图片添加关联的药材ID（从key中提取）
                const herbId = key.replace('images_', '')
                allImages = [...allImages, ...images.map(img => ({ ...img, herbId }))]
            }
        }

        // 按时间倒序排列
        return allImages.sort((a, b) => b.timestamp - a.timestamp)
    } catch (e) {
        console.error('Get all images failed', e)
        return []
    }
}

// 删除用户图片
export const deleteUserImage = async (herbId, imageId) => {
    try {
        const key = `images_${herbId}`
        const currentImages = (await localforage.getItem(key)) || []
        const newImages = currentImages.filter(img => String(img.id) !== String(imageId))
        await localforage.setItem(key, newImages)
    } catch (e) {
        console.error('Delete image failed', e)
        throw e
    }
}

// 修正用户图片标注 (移动图片到新的药材ID下)
export const updateUserImageHerb = async (oldHerbId, newHerbId, imageId) => {
    try {
        // 1. 从旧列表获取图片
        const oldKey = `images_${oldHerbId}`
        const oldImages = (await localforage.getItem(oldKey)) || []
        const targetImage = oldImages.find(img => img.id === imageId)

        if (!targetImage) throw new Error('Image not found')

        // 2. 从旧列表删除
        const newOldImages = oldImages.filter(img => img.id !== imageId)
        await localforage.setItem(oldKey, newOldImages)

        // 3. 更新图片元数据 (人工校验)
        const updatedImage = {
            ...targetImage,
            herbId: newHerbId, // Update ID
            verified: true,    // Marked as verified
            source: 'user_correction', // Marked as manual correction
            correctionTimestamp: Date.now()
        }

        // 4. 添加到新列表
        const newKey = `images_${newHerbId}`
        const newImages = (await localforage.getItem(newKey)) || []

        // 保持原有的 timestamp 和 id, 但更新了verified状态
        await localforage.setItem(newKey, [updatedImage, ...newImages])

    } catch (e) {
        console.error('Update image herb failed', e)
        throw e
    }
}

// 保存错题
export const saveMistake = async (question) => {
    try {
        if (!question?.id) return

        const mistakes = (await localforage.getItem('mistakes')) || []

        // 过滤掉无效数据和当前题目的旧记录
        const validMistakes = mistakes.filter(m => m && m.question && m.question.id !== question.id)

        const newMistake = {
            question,
            timestamp: Date.now()
        }

        // 新错题放最前
        validMistakes.unshift(newMistake)

        await localforage.setItem('mistakes', validMistakes)
        console.log('✅ Mistake saved:', validMistakes.length)
    } catch (error) {
        console.error('Save mistake error:', error)
    }
}

// 获取错题
export const getMistakes = async () => {
    return (await localforage.getItem('mistakes')) || []
}

// 移除单个错题
export const removeMistake = async (questionId) => {
    try {
        const mistakes = (await localforage.getItem('mistakes')) || []
        const newMistakes = mistakes.filter(m => m.question.id !== questionId)

        // 只有当数量发生变化时才保存，减少IO
        if (newMistakes.length !== mistakes.length) {
            await localforage.setItem('mistakes', newMistakes)
        }
    } catch (e) {
        // Silent error
    }
}

// 清空错题
export const clearMistakes = async () => {
    await localforage.removeItem('mistakes')
}

// 保存答题详情记录
export const saveQuizRecord = async (record) => {
    try {
        const history = (await localforage.getItem('quiz_history')) || []
        const newRecord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            timestamp: Date.now(),
            ...record
        }
        // 新记录放最前
        await localforage.setItem('quiz_history', [newRecord, ...history])
    } catch (e) {
        console.error('Save quiz history failed', e)
    }
}

// 获取答题详情记录
export const getAllQuizRecords = async () => {
    return (await localforage.getItem('quiz_history')) || []
}

// 清空答题记录并重置练习统计
// 获取练习历史
export const getQuizHistory = async () => {
    return (await localforage.getItem('quiz_history')) || []
}

export const clearQuizHistory = async () => {
    try {
        await localforage.removeItem('quiz_history')

        // Reset practiced stats
        const storedStats = await localforage.getItem('stats')
        if (storedStats) {
            // Reset cumulative practice stats (User Request)
            if (storedStats.total) {
                storedStats.total.practiced = 0
                storedStats.total.correct = 0
            }
            await localforage.setItem('stats', storedStats)
            console.log('Quiz history and stats cleared')
        }
    } catch (e) {
        console.error('Failed to clear quiz history', e)
    }
}

// 保存答题结果并更新统计
export const saveQuizResult = async (result) => {
    try {
        // Deep copy or fresh object
        const storedStats = await localforage.getItem('stats')
        const stats = storedStats || getInitialStats()

        // 确保结构完整
        if (!stats.today) stats.today = getInitialStats().today
        if (!stats.total) stats.total = getInitialStats().total

        // 更新数据
        stats.today.practiced += result.total
        stats.today.correct += result.correct

        stats.total.practiced += result.total
        stats.total.correct += result.correct

        await localforage.setItem('stats', stats)
    } catch (e) {
        console.error('Save quiz result failed', e)
    }
}

// 记录识别次数
export const recordRecognition = async (herbId) => {
    try {
        // 使用 Promise.race 增加超时保护，防止存储操作卡死UI
        const updateStats = async () => {
            const storedStats = await localforage.getItem('stats')
            const stats = storedStats || getInitialStats()

            // 确保结构完整
            if (!stats.today) stats.today = getInitialStats().today
            if (!stats.total) stats.total = getInitialStats().total

            stats.today.recognized += 1
            stats.total.recognized += 1

            await localforage.setItem('stats', stats)
            console.log('Recognition recorded')
        }

        // 1秒超时，如果存储太慢则忽略，不阻塞主流程
        await Promise.race([
            updateStats(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 1000))
        ])

    } catch (e) {
        console.warn('Record recognition failed or timed out:', e)
        // 统计失败不应影响用户使用
    }
}

// 获取统计数据
export const getStats = async () => {
    let stats = (await localforage.getItem('stats')) || getInitialStats()

    // Check if date has rolled over
    const todayStr = new Date().toDateString()
    if (stats.lastDate !== todayStr) {
        console.log('📅 New day detected, resetting daily stats...')
        stats.today = { recognized: 0, practiced: 0, correct: 0 }
        stats.lastDate = todayStr
        await localforage.setItem('stats', stats)
    }

    return stats
}

// 获取智能修正记忆
export const getSmartCorrections = async () => {
    return (await localforage.getItem('smart_corrections')) || {}
}

// 保存智能修正记忆
export const saveSmartCorrection = async (imageHash, herbId) => {
    try {
        const corrections = (await localforage.getItem('smart_corrections')) || {}
        corrections[imageHash] = herbId
        await localforage.setItem('smart_corrections', corrections)
        console.log(`🧠 Learned: Hash ${imageHash.substring(0, 8)}... = Herb ${herbId}`)
    } catch (e) {
        console.error('Failed to save correction memory', e)
    }
}

// 获取今日识别的唯一饮片数量 (去重)
export const getTodayUniqueHerbCount = async () => {
    try {
        const allImages = await getAllUserImages()
        const todayStr = new Date().toDateString()

        const todayImages = allImages.filter(img =>
            new Date(img.timestamp).toDateString() === todayStr
        )

        // Count unique herbIds
        const uniqueHerbs = new Set(todayImages.map(img => img.herbId))
        return uniqueHerbs.size
    } catch (e) {
        console.error('Get today unique stats failed', e)
        return 0
    }
}
// 清除所有数据
export const clearAllData = async () => {
    try {
        await localforage.clear()
        // Re-initialize stats
        await localforage.setItem('stats', getInitialStats())
    } catch (e) {
        console.error('Clear all data failed', e)
    }
}
// 获取累计识别的唯一饮片数量 (去重)
export const getTotalUniqueHerbCount = async () => {
    try {
        const allImages = await getAllUserImages()
        // Count unique herbIds across ALL images
        const uniqueHerbs = new Set(allImages.map(img => img.herbId))
        return uniqueHerbs.size
    } catch (e) {
        console.error('Get total unique stats failed', e)
        return 0
    }
}
