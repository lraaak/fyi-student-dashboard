import React, { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, Check } from 'lucide-react';
import { fetchSubjects, updateSubject } from '../services/api';

const SubjectManager = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSubject, setNewSubject] = useState({ subject_code: '', subject_name: '' });

    const loadSubjects = async () => {
        try {
            const data = await fetchSubjects();
            setSubjects(data);
        } catch (error) {
            console.error("Failed to load subjects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubjects();
    }, []);

    const toggleTerror = async (subject) => {
        const newStatus = subject.is_terror_prof === 1 ? 0 : 1;
        try {
            await updateSubject({
                subject_code: subject.subject_code,
                subject_name: subject.subject_name,
                is_terror_prof: newStatus
            });
            loadSubjects();
        } catch (error) {
            alert("Failed to update subject");
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.subject_code.trim()) return;
        try {
            await updateSubject({
                subject_code: newSubject.subject_code.toUpperCase(),
                subject_name: newSubject.subject_name || newSubject.subject_code.toUpperCase(),
                is_terror_prof: 0
            });
            setNewSubject({ subject_code: '', subject_name: '' });
            loadSubjects();
        } catch (error) {
            alert("Failed to add subject");
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
                    <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Subject Manager</h2>
                <p className="text-zinc-400">Manage your courses and mark professors as "terror" for better predictions.</p>
            </header>

            {/* Add New Subject */}
            <div className="bg-surface border border-zinc-800 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Subject</h3>
                <form onSubmit={handleAddSubject} className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Subject Code (e.g. CSADPRG)"
                        value={newSubject.subject_code}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, subject_code: e.target.value }))}
                        className="flex-1 bg-background border border-zinc-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Full Name (optional)"
                        value={newSubject.subject_name}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, subject_name: e.target.value }))}
                        className="flex-1 bg-background border border-zinc-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                    <button type="submit" className="bg-primary hover:bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg transition-colors">
                        Add
                    </button>
                </form>
            </div>

            {/* Subject List */}
            <div className="bg-surface border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="font-semibold text-white">Your Subjects</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-zinc-500">Loading...</div>
                ) : subjects.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                        No subjects yet. Add one above or log a task to auto-create.
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {subjects.map((subject) => (
                            <div key={subject.subject_code} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                                <div>
                                    <span className="font-medium text-white">{subject.subject_code}</span>
                                    {subject.subject_name && subject.subject_name !== subject.subject_code && (
                                        <span className="text-zinc-500 ml-2">— {subject.subject_name}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    {subject.is_terror_prof === 1 && (
                                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                                            <AlertTriangle className="w-3 h-3" />
                                            Terror
                                        </span>
                                    )}
                                    <button
                                        onClick={() => toggleTerror(subject)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${subject.is_terror_prof === 1 ? 'bg-red-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${subject.is_terror_prof === 1 ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectManager;
