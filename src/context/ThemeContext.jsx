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
        // Update data-theme attribute
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('app-theme', theme)

        // Update browser theme-color for Status Bar / Top Area compatibility
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
            // Light Mode: Primary Green (#10B981), Dark Mode: Dark Background (#111827)
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#111827' : '#10B981')
        }
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
