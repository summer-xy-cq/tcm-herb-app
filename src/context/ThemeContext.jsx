import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    // Get theme from local storage or default to 'light'
    // User requested "Manual Day/Night mode", so we default to light and let them toggle.
    // If they have a saved preference, use that.
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme')
        return savedTheme || 'light'
    })

    useEffect(() => {
        // Update the document attribute when theme changes
        document.documentElement.setAttribute('data-theme', theme)
        // Save to local storage
        localStorage.setItem('app-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    return useContext(ThemeContext)
}
