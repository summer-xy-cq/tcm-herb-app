import { NavLink, useLocation } from 'react-router-dom'
import './BottomNav.css'

const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/scan', icon: '📷', label: '识别' },
    { path: '/practice', icon: '📝', label: '练习' },
    { path: '/profile', icon: '👤', label: '我的' },
]

function BottomNav() {
    const location = useLocation()

    // 在某些页面隐藏底部导航
    const hideOnPaths = ['/quiz']
    const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path))

    if (shouldHide) return null

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `bottom-nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <span className="bottom-nav-icon">{item.icon}</span>
                    <span className="bottom-nav-label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    )
}

export default BottomNav
