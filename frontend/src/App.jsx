import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TaskTracker from './pages/TaskTracker';
import Predictor from './pages/Predictor';
import Dashboard from './pages/Dashboard';
import SubjectManager from './pages/SubjectManager';

function App() {
  return (
    <Router>
      <div className="flex bg-background min-h-screen font-sans text-zinc-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskTracker />} />
            <Route path="/subjects" element={<SubjectManager />} />
            <Route path="/predict" element={<Predictor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
