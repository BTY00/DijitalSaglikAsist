import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Calendar, Droplets, Home, LogOut, Settings, User, Utensils } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <div className="flex items-center justify-center">
            <Activity className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-800">Dijital Sağlık</h1>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <nav>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center p-3 mb-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
              }
              end
            >
              <Home className="h-5 w-5 mr-3" />
              <span>Ana Sayfa</span>
            </NavLink>
            
            <NavLink 
              to="/daily-activity" 
              className={({ isActive }) => 
                `flex items-center p-3 mb-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <Droplets className="h-5 w-5 mr-3" />
              <span>Günlük Aktivite</span>
            </NavLink>
            
            <NavLink 
              to="/fitness-program" 
              className={({ isActive }) => 
                `flex items-center p-3 mb-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <Activity className="h-5 w-5 mr-3" />
              <span>Spor Programı</span>
            </NavLink>
            
            <NavLink 
              to="/appointments" 
              className={({ isActive }) => 
                `flex items-center p-3 mb-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <Calendar className="h-5 w-5 mr-3" />
              <span>Randevular</span>
            </NavLink>
            
            <NavLink 
              to="/recommendations" 
              className={({ isActive }) => 
                `flex items-center p-3 mb-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <Utensils className="h-5 w-5 mr-3" />
              <span>Öneriler</span>
            </NavLink>
            
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `flex items-center p-3 mb-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
              }
            >
              <Settings className="h-5 w-5 mr-3" />
              <span>Profil</span>
            </NavLink>
            
            <button 
              onClick={handleLogout}
              className="flex items-center p-3 mb-2 rounded-lg text-red-600 hover:bg-red-50 w-full text-left"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Çıkış Yap</span>
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;