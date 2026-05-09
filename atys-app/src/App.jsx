import React, { useState, useEffect } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCards from './components/StatCards';
import SensorChart from './components/SensorChart';
import SensorMap from './components/SensorMap';
import AIRecommendations from './components/AIRecommendations';
import DetailedMap from './components/DetailedMap';
import DetailedAnalytics from './components/DetailedAnalytics';
import DetailedAIHub from './components/DetailedAIHub';
import DetailedSettings from './components/DetailedSettings';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const data = useDashboardData();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <StatCards stats={data.stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <SensorChart data={data.sensorHistory} />
                <SensorMap sensors={data.sensors} />
              </div>
              <div className="lg:col-span-1">
                <AIRecommendations recommendations={data.aiRecommendations} />
              </div>
            </div>
          </motion.div>
        );
      case 'map':
        return <DetailedMap sensors={data.sensors} />;
      case 'analytics':
        return <DetailedAnalytics data={data} />;
      case 'ai':
        return <DetailedAIHub theme={theme} />;
      case 'settings':
        return <DetailedSettings theme={theme} setTheme={setTheme} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen transition-colors duration-500 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        <Header 
          weather={data.weather} 
          user={data.user} 
          theme={theme} 
          setTheme={setTheme} 
        />
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>

        <footer className="px-8 py-4 text-[10px] text-center opacity-30 font-mono tracking-widest uppercase">
          ATYS Premium Agriculture OS v4.1.0 // Grok-2 Intelligence Online
        </footer>
      </main>
    </div>
  );
}

export default App;
