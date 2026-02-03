import herbs from '../data/herbs.json'

// 获取所有药材
export const getAllHerbs = () => {
    return herbs
}

// 根据ID获取药材
export const getHerbById = (id) => {
    return herbs.find(herb => herb.id === id)
}

// 根据名称搜索药材
export const searchHerbs = (query) => {
    if (!query) return herbs

    const lowerQuery = query.toLowerCase()
    return herbs.filter(herb =>
        herb.name.includes(query) ||
        herb.pinyin.toLowerCase().includes(lowerQuery) ||
        herb.alias.some(a => a.includes(query))
    )
}
