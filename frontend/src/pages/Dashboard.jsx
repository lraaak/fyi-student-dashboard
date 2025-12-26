import React from 'react';
import { Trophy, Target, Clock, BookOpen } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-surface border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-zinc-500 text-xs uppercase font-medium">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Overview</h2>
                <p className="text-zinc-400">Welcome back! Here's your productivity activity.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard icon={Trophy} label="Great Grades" value="4" color="bg-green-500" />
                <StatCard icon={Target} label="Tasks Logged" value="12" color="bg-blue-500" />
                <StatCard icon={Clock} label="Study Hours" value="45.5" color="bg-purple-500" />
                <StatCard icon={BookOpen} label="Courses" value="5" color="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 h-64 flex items-center justify-center text-zinc-500">
                    Chart Placeholder (Integrate Recharts here for history)
                </div>
                <div className="bg-surface border border-zinc-800 rounded-xl p-6 h-64 flex items-center justify-center text-zinc-500">
                    Category Distribution Placeholder
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
