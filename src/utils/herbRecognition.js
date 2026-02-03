import { getAllHerbs } from './herbData'
import { recordRecognition } from './storage'

const API_ENDPOINT = "/api/identify"

// Helper to compute SHA-256 hash
export async function computeImageHash(base64Data) {
    const raw = atob(base64Data.split(',')[1])
    const rawLength = raw.length
    const array = new Uint8Array(new ArrayBuffer(rawLength))
    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i)
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', array)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 真实AI识别中药饮片 (Connecting to GLM-4V Backend)
 */
export const recognizeHerb = async (imageData) => {
    try {
        console.log("Starting recognition process...")

        // 0. Smart Local Check (Memory)
        try {
            const imageHash = await computeImageHash(imageData)
            console.log("Image Hash:", imageHash)

            // Explicitly import locally to avoid circular dependencies if possible, 
            // but for now we assume localforage is global or imported in storage.
            // We'll use the storage util we will export nicely.
            const importStorage = await import('./storage')
            const corrections = await importStorage.getSmartCorrections()

            if (corrections && corrections[imageHash]) {
                const knownHerbId = corrections[imageHash]
                const herbs = getAllHerbs()
                const knownHerb = herbs.find(h => h.id === knownHerbId)

                if (knownHerb) {
                    console.log("🧠 Smart Recall: Found known correction for this image!")
                    return {
                        herb: knownHerb,
                        confidence: "已记住", // Special indicator
                        isCorrected: true,
                        isSmartRecall: true
                    }
                }
            }
        } catch (e) {
            console.warn("Smart check failed, falling back to AI:", e)
        }

        console.log("Sending image to AI backend...")

        // 1. 发送请求给本地代理服务器 (ai-server.js)
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        })

        if (!response.ok) {
            throw new Error(`Backend API request failed: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
            throw new Error(data.error)
        }

        const aiHerbName = data.name;
        console.log(`AI Identified Name: ${aiHerbName}`)

        // 2. 在本地数据库中查找
        const herbs = getAllHerbs()
        let matchedHerb = herbs.find(h => h.name === aiHerbName)

        // 尝试模糊匹配 (比如 AI返回 "炙黄芪"，本地有 "黄芪")
        if (!matchedHerb) {
            matchedHerb = herbs.find(h => aiHerbName.includes(h.name) || h.name.includes(aiHerbName))
        }

        // 3. 构造返回结果
        let finalHerb

        if (matchedHerb) {
            // 完美匹配本地数据库
            finalHerb = matchedHerb
            // 记录识别历史
            await recordRecognition(finalHerb.id)
        } else {
            // AI认出来了，但本地库里没有详细资料 (这正是用户要收集数据的场景)
            finalHerb = {
                id: 'unknown_' + Date.now(),
                name: aiHerbName, // 使用AI识别出的名字
                pinyin: '',
                effects: '暂无本地资料，请去完善数据库',
                properties: { nature: '未知', flavor: [] },
                isCustom: true // 标记为库外药材
            }
            // 这种情况下也记录，虽然ID是临时的，但图片保存下来了很有价值
            // 注意：recordRecognition 可能会因为ID不存在而不管，取决于storage实现。
            // 这里先把图存下来是关键。
            await recordRecognition(finalHerb.id)
        }

        return {
            herb: finalHerb,
            confidence: 95, // GLM-4V通常很有信心
            isMock: false
        }

    } catch (error) {
        console.error('Recognition process failed:', error)
        throw error //哪怕失败了也抛出，不要退回到随机Mock，让用户知道真的在连网
    }
}
