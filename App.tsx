import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatTutor } from './components/ChatTutor';
import { LiveClassroom } from './components/LiveClassroom';
import { MediaStudio } from './components/MediaStudio';
import { Analyzer } from './components/Analyzer';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';

export enum View {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  STUDIO = 'STUDIO',
  ANALYZER = 'ANALYZER',
}

interface User {
  name: string;
  email: string;
  avatar: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView(View.DASHBOARD);
  };

  const renderView = () => {
    switch (currentView) {
      case View.CHAT:
        return <ChatTutor />;
      case View.LIVE:
        return <LiveClassroom />;
      case View.STUDIO:
        return <MediaStudio />;
      case View.ANALYZER:
        return <Analyzer />;
      case View.DASHBOARD:
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-slate-200 font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto relative bg-slate-900">
        {renderView()}
      </main>
    </div>
  );
};

export default App;