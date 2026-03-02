
import React from 'react';
import { LayoutDashboard, List, Settings, Cpu, GitBranch, Box, Repeat } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jobs', label: 'Tasks', icon: List },
    { id: 'workflows', label: 'Workflows', icon: Repeat },
    { id: 'integrations', label: 'Integrations', icon: Cpu },
    { id: 'sandbox', label: 'Sandbox', icon: Box },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6 flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <GitBranch className="text-white w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Nexus</h1>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Darren" alt="User" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-gray-900">Darren Baldwin</div>
            <div className="text-gray-500">Free Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
