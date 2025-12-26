import React, { useState, useEffect } from 'react';
import { BrainCircuit, Clock, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import { predictOutcome, fetchSubjects } from '../services/api';

const Predictor = () => {
    const [inputs, setInputs] = useState({
        subject: '',
        category: 'Technical',
        difficulty: 3,
        days_to_deadline: 3,
        days_started_before: 1,
    });

    const [subjects, setSubjects] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modelMetrics, setModelMetrics] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load subjects
                const subjectsData = await fetchSubjects();
                setSubjects(subjectsData);
                if (subjectsData.length > 0) {
                    setInputs(prev => ({ ...prev, subject: subjectsData[0].subject_code }));
                }

                // Load model metrics
                const metricsResponse = await fetch('http://localhost:8000/model-metrics');
                const metrics = await metricsResponse.json();
                setModelMetrics(metrics);
            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        loadData();
    }, []);

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await predictOutcome(inputs);
            setPrediction(result);
        } catch (err) {
            setError(err.response?.data?.detail || "Prediction failed. Ensure you have enough training data (5+ tasks).");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setInputs({ ...inputs, [e.target.name]: e.target.value });
    };

    // Get current subject's terror status for display
    const currentSubjectData = subjects.find(s => s.subject_code === inputs.subject);
    const isTerror = currentSubjectData?.is_terror_prof === 1;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4 shadow-lg shadow-primary/20">
                    <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-2">AI Outlook</h2>
                <p className="text-zinc-400">Simulate assignment scenarios to forecast your performance.</p>
            </header>

            {/* Model Accuracy Display */}
            {modelMetrics && modelMetrics.has_metrics && (
                <div className="mb-8 bg-surface border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <span className="text-sm text-zinc-400">Model Confidence</span>
                                <div className="flex gap-4 mt-1">
                                    <span className="text-xs text-zinc-500">
                                        Hours: <span className="text-white font-medium">{modelMetrics.duration_model.accuracy_percentage}% R²</span>
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Grade: <span className="text-white font-medium">{modelMetrics.grade_model.accuracy_percentage}% R²</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-zinc-600">Based on K-Fold CV</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Input Card */}
                <div className="bg-surface border border-zinc-800 rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BrainCircuit className="w-32 h-32" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-6">Scenario Parameters</h3>
                    <div className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">Course Context</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <select
                                        name="subject"
                                        value={inputs.subject}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                                    >
                                        {subjects.length === 0 && <option value="">No subjects found</option>}
                                        {subjects.map(sub => (
                                            <option key={sub.subject_code} value={sub.subject_code}>{sub.subject_code}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        name="category"
                                        value={inputs.category}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option>Technical</option>
                                        <option>Theory</option>
                                        <option>Project</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Terror Prof Indicator (read-only) */}
                            {isTerror && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>This subject has a "Terror Prof" — predictions adjusted accordingly.</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">Complexity & Time</label>
                            <div className="bg-background border border-zinc-800 rounded-xl p-4 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs text-zinc-400 mb-1">
                                        <span>Difficulty</span>
                                        <span>{inputs.difficulty}/5</span>
                                    </div>
                                    <input type="range" min="1" max="5" name="difficulty" value={inputs.difficulty} onChange={handleChange} className="w-full accent-primary" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Due In (Days)</span>
                                        <input type="number" name="days_to_deadline" value={inputs.days_to_deadline} onChange={handleChange} className="w-full bg-surface border border-zinc-700 rounded-lg px-2 py-1 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-400 block mb-1">Starting (Days Before)</span>
                                        <input type="number" name="days_started_before" value={inputs.days_started_before} onChange={handleChange} className="w-full bg-surface border border-zinc-700 rounded-lg px-2 py-1 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePredict}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {loading ? 'Analyzing...' : 'Generate Prediction'}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Card */}
                <div className={`bg-surface border border-zinc-800 rounded-2xl p-8 shadow-sm flex flex-col justify-center items-center text-center transition-all duration-500 ${prediction ? 'opacity-100 translate-x-0' : 'opacity-50 blur-sm'}`}>
                    {!prediction ? (
                        <div className="text-zinc-600">
                            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Run a simulation to see AI forecasts.</p>
                        </div>
                    ) : (
                        <div className="w-full space-y-8 animate-in fade-in zoom-in duration-300">
                            <div>
                                <span className="text-zinc-500 text-sm uppercase tracking-wider font-medium">Estimated Effort</span>
                                {prediction.estimated_hours <= 0 ? (
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                                            🐐 You're Goated 🐐
                                        </span>
                                        <p className="text-xs text-zinc-500 mt-2">This task is beneath you, king/queen!</p>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline justify-center gap-2 mt-2">
                                        <span className="text-5xl font-bold text-white">{prediction.estimated_hours.toFixed(1)}</span>
                                        <span className="text-zinc-400 text-xl">hours</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-px w-full bg-zinc-800" />

                            <div>
                                <span className="text-zinc-500 text-sm uppercase tracking-wider font-medium">Projected Grade</span>
                                <div className="flex items-baseline justify-center gap-2 mt-2">
                                    <span className={`text-5xl font-bold ${prediction.projected_grade >= 3.0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {prediction.projected_grade.toFixed(2)}
                                    </span>
                                    <span className="text-zinc-400 text-xl">/ 4.0</span>
                                </div>
                            </div>

                            {/* Terror indicator in results */}
                            {prediction.is_terror_prof === 1 && (
                                <div className="text-xs text-red-400 flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Terror Prof factored in
                                </div>
                            )}

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${prediction.risk_level === 'High Risk' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    prediction.risk_level === 'ACE' ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 text-yellow-300' :
                                        prediction.risk_level === 'Great Outlook' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                {prediction.risk_level === 'High Risk' ? <AlertTriangle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                <span className="font-medium">{prediction.risk_level}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Predictor;
