import React from 'react';
import { LayoutDashboard, CheckSquare, BrainCircuit, BookOpen, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/tasks', label: 'Task Tracker', icon: CheckSquare },
        { path: '/subjects', label: 'Subjects', icon: BookOpen },
        { path: '/predict', label: 'AI Predictor', icon: BrainCircuit },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-surface border-r border-zinc-800 h-screen flex flex-col p-4">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BrainCircuit className="text-white w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">FYI App</h1>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="space-y-3">
                <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 font-medium">Student Performance</p>
                    <div className="mt-2 text-sm text-zinc-300 font-mono">
                        GPA Goal: <span className="text-green-400">4.0</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
