import React, { useState, useEffect } from 'react';
import { Plus, Clock, Award, Calendar } from 'lucide-react';
import { fetchTasks, createTask } from '../services/api';

const TaskTracker = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        subject_code: 'CSADPRG',
        assignment_name: '',
        task_category: 'Technical',
        difficulty_rating: 3,
        days_to_deadline: 3,
        days_started_before_deadline: 1,
        predicted_hours: 2.0,
        actual_hours_spent: 0.0,
        final_grade_received: 0.0,
    });

    const loadTasks = async () => {
        try {
            const data = await fetchTasks();
            setTasks(data);
        } catch (error) {
            console.error("Failed to load tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTask(formData);
            loadTasks();
            // Reset critical fields
            setFormData(prev => ({ ...prev, assignment_name: '' }));
        } catch (error) {
            alert("Error creating task");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Task Tracker</h2>
                <p className="text-zinc-400">Log assignments to train your personal productivity AI.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-surface border border-zinc-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            New Entry
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Subject & Task</label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input
                                        name="subject_code"
                                        value={formData.subject_code}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white"
                                        placeholder="Code"
                                    />
                                    <select
                                        name="task_category"
                                        value={formData.task_category}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white"
                                    >
                                        <option>Technical</option>
                                        <option>Theory</option>
                                        <option>Project</option>
                                    </select>
                                </div>
                                <input
                                    name="assignment_name"
                                    value={formData.assignment_name}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-white"
                                    placeholder="Assignment Name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Metrics</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Difficulty (1-5)</span>
                                        <input type="number" name="difficulty_rating" min="1" max="5" value={formData.difficulty_rating} onChange={handleChange} className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Deadline (Days)</span>
                                        <input type="number" name="days_to_deadline" min="0" value={formData.days_to_deadline} onChange={handleChange} className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">Actuals (For Training)</label>
                                <div className="space-y-4 bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                            <span className="text-xs text-zinc-300 font-medium">Time Spent (Hours)</span>
                                        </div>
                                        <input type="number" step="0.5" name="actual_hours_spent" value={formData.actual_hours_spent} onChange={handleChange} className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. 4.5" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Award className="w-3.5 h-3.5 text-zinc-400" />
                                            <span className="text-xs text-zinc-300 font-medium">Final Grade (0.0 - 4.0)</span>
                                        </div>
                                        <input type="number" step="0.1" name="final_grade_received" value={formData.final_grade_received} onChange={handleChange} className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. 3.5" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                            <span className="text-xs text-zinc-300 font-medium">Started (Days Before Due)</span>
                                        </div>
                                        <input type="number" name="days_started_before_deadline" value={formData.days_started_before_deadline} onChange={handleChange} className="w-full bg-background border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. 2" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-primary hover:bg-indigo-600 text-white font-medium py-2.5 rounded-lg transition-colors mt-4 shadow-lg shadow-indigo-500/20">
                                Log Task
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden shadow-sm h-full">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                            <h3 className="font-semibold text-white">Recent Activity</h3>
                            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">{tasks.length} entries</span>
                        </div>

                        <div className="overflow-auto max-h-[600px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Subject</th>
                                        <th className="px-6 py-3">Task</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Hours</th>
                                        <th className="px-6 py-3">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                                    {tasks.map((task, i) => (
                                        <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{task.subject_code}</td>
                                            <td className="px-6 py-4">{task.assignment_name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium 
                          ${task.task_category === 'Technical' ? 'bg-blue-500/10 text-blue-400' :
                                                        task.task_category === 'Project' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-700/30 text-zinc-400'}`}>
                                                    {task.task_category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{task.actual_hours_spent || '-'} hrs</td>
                                            <td className="px-6 py-4">
                                                {task.final_grade_received !== 0 ? (
                                                    <span className={task.final_grade_received >= 3.5 ? 'text-green-400' : task.final_grade_received < 2 ? 'text-red-400' : 'text-yellow-400'}>
                                                        {task.final_grade_received}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {tasks.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                                                No tasks logged yet. Start adding manually!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskTracker;
