import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRandomQuestions, getAllQuestions, getQuestionsByCategory } from '../utils/questionData'
import { getMistakes, saveMistake, removeMistake, saveQuizResult, saveQuizRecord } from '../utils/storage'
import './QuizPage.css'

function QuizPage() {
    const { mode, category } = useParams()
    const navigate = useNavigate()

    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [showAnswer, setShowAnswer] = useState(false)
    const [answers, setAnswers] = useState({})
    const [isFinished, setIsFinished] = useState(false)
    const [startTime] = useState(Date.now())

    useEffect(() => {
        loadQuestions()
    }, [mode, category])

    const loadQuestions = async () => {
        let q = []
        try {
            switch (mode) {
                case 'random':
                    q = getRandomQuestions(10)
                    break
                case 'category':
                    q = getQuestionsByCategory(category)
                    break
                case 'mistakes':
                    const mistakes = await getMistakes()
                    q = mistakes.map(m => m.question)
                    break
                case 'exam':
                    q = getRandomQuestions(50)
                    break
                default:
                    q = getAllQuestions()
            }
        } catch (e) {
            console.error(e)
        }
        setQuestions(q || [])
    }

    const handleSelectAnswer = (startLetter) => {
        if (showAnswer) return
        setSelectedAnswer(startLetter)
    }

    const handleCheckAnswer = async () => {
        setShowAnswer(true)

        const isCorrect = selectedAnswer === question.answer
        setAnswers(prev => ({
            ...prev,
            [question.id]: {
                selected: selectedAnswer,
                correct: isCorrect
            }
        }))

        if (!isCorrect) {
            // 答错：加入/更新错题本
            await saveMistake(question)
        } else {
            // 答对：从错题本移除（如果存在）
            await removeMistake(question.id)
        }

        // 保存详细练习记录
        await saveQuizRecord({
            question: question,
            userAnswer: selectedAnswer,
            isCorrect: isCorrect,
            mode: mode || 'practice'
        })
    }

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setShowAnswer(false)
        } else {
            finishQuiz()
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            const prevQuestion = questions[currentIndex - 1]
            if (answers[prevQuestion.id]) {
                setSelectedAnswer(answers[prevQuestion.id].selected)
                setShowAnswer(true)
            } else {
                setSelectedAnswer(null)
                setShowAnswer(false)
            }
        }
    }

    const finishQuiz = async () => {
        const correctCount = Object.values(answers).filter(a => a.correct).length
        const totalTime = Math.round((Date.now() - startTime) / 1000)

        await saveQuizResult({
            mode,
            total: questions.length,
            correct: correctCount,
            time: totalTime,
            timestamp: Date.now()
        })

        setIsFinished(true)
    }

    const getModeTitle = () => {
        switch (mode) {
            case 'random': return '随机练习'
            case 'exam': return '模拟考试'
            case 'mistakes': return '错题重练'
            case 'category': return '分类练习'
            default: return '练习'
        }
    }

    if (questions.length === 0) {
        return (
            <div className="page quiz-page">
                <div className="loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        )
    }

    const question = questions[currentIndex]

    if (isFinished) {
        const correctCount = Object.values(answers).filter(a => a.correct).length
        const accuracy = Math.round((correctCount / questions.length) * 100)
        const totalTime = Math.round((Date.now() - startTime) / 1000)
        const minutes = Math.floor(totalTime / 60)
        const seconds = totalTime % 60

        return (
            <div className="page quiz-page quiz-result">
                <div className="result-card fade-in">
                    <div className="result-icon">
                        {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
                    </div>
                    <h2 className="result-title">
                        {accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '不错！' : '继续加油！'}
                    </h2>

                    <div className="result-stats">
                        <div className="result-stat">
                            <span className="stat-value">{correctCount}/{questions.length}</span>
                            <span className="stat-label">正确题数</span>
                        </div>
                        <div className="result-stat">
                            <span className="stat-value">{accuracy}%</span>
                            <span className="stat-label">正确率</span>
                        </div>
                        <div className="result-stat">
                            <span className="stat-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                            <span className="stat-label">用时</span>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn btn-secondary" onClick={() => navigate('/practice')}>
                            返回练习
                        </button>
                        <button className="btn btn-primary" onClick={() => {
                            setIsFinished(false)
                            setCurrentIndex(0)
                            setAnswers({})
                            setSelectedAnswer(null)
                            setShowAnswer(false)
                            loadQuestions()
                        }}>
                            再练一次
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page quiz-page">
            {/* 头部 */}
            <header className="quiz-header">
                <button className="back-btn" onClick={() => navigate('/practice')}>
                    ← 退出
                </button>
                <span className="quiz-title">{getModeTitle()}</span>
                <span className="quiz-progress">{currentIndex + 1}/{questions.length}</span>
            </header>

            {/* 进度条 */}
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* 题目 */}
            <div className="question-container fade-in">
                <div className="question-meta">
                    <span className="question-type">
                        {question.type === 'single' ? '单选题' : '多选题'}
                    </span>
                    <span className="question-source">{question.source}</span>
                </div>

                <p className="question-text">{question.question}</p>

                <div className="options-list">
                    {question.options.map((option, index) => {
                        const letter = option.charAt(0)
                        const isSelected = selectedAnswer === letter
                        const isCorrect = letter === question.answer
                        let optionClass = 'option-item'

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
                                <span className="option-letter">{letter}</span>
                                <span className="option-text">{option.substring(2).trim()}</span>
                            </button>
                        )
                    })}
                </div>

                {showAnswer && (
                    <div className="explanation-box fade-in">
                        <h4>📖 答案解析</h4>
                        <p>{question.explanation}</p>
                    </div>
                )}
            </div>

            {/* 底部操作 */}
            <div className="quiz-actions">
                <button
                    className="btn btn-secondary"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
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
                        onClick={handleNext}
                    >
                        {currentIndex === questions.length - 1 ? '完成' : '下一题'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default QuizPage
