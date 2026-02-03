import questions from '../data/questions.json'
import herbs from '../data/herbs.json'

// Helper: Shuffle options and remap answer
const shuffleQuestionOptions = (question) => {
    // 1. Identify current correct answer text
    const correctLetter = question.answer // "A"
    const correctOptionString = question.options.find(opt => opt.startsWith(correctLetter))
    if (!correctOptionString) return question

    const correctContent = correctOptionString.substring(2).trim() // Remove "A. "

    // 2. Extract content from all options
    const optionsContent = question.options.map(opt => opt.substring(2).trim())

    // 3. Shuffle content (Fisher-Yates)
    for (let i = optionsContent.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsContent[i], optionsContent[j]] = [optionsContent[j], optionsContent[i]];
    }

    // 4. Rebuild options with standard prefixes
    const LETTERS = ['A', 'B', 'C', 'D', 'E']
    const newOptions = optionsContent.map((content, idx) => `${LETTERS[idx]}. ${content}`)

    // 5. Find new correct answer key
    const newCorrectIndex = optionsContent.findIndex(content => content === correctContent)
    const newAnswer = LETTERS[newCorrectIndex]

    return {
        ...question,
        options: newOptions,
        answer: newAnswer
    }
}

// 获取所有题目
export const getAllQuestions = () => {
    return questions.map(shuffleQuestionOptions)
}

// 根据药材ID获取相关题目
export const getQuestionsByHerbId = (herbId) => {
    return questions.filter(q => q.herbId === herbId).map(shuffleQuestionOptions)
}

// 随机获取题目
export const getRandomQuestions = (count) => {
    const shuffled = [...questions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count).map(shuffleQuestionOptions)
}

// 获取分类题目（随机）
export const getQuestionsByCategory = (categoryName, count = 10) => {
    // 1. Find all herbs in this category
    const targetHerbIds = herbs
        .filter(h => h.category === categoryName)
        .map(h => h.id)

    // 2. Filter questions matching these herbs
    const fastFilter = questions.filter(q => targetHerbIds.includes(q.herbId))

    // 3. Shuffle selection
    const randomized = [...fastFilter].sort(() => 0.5 - Math.random())

    // 4. Shuffle options for selected questions
    return randomized.slice(0, count).map(shuffleQuestionOptions)
}
