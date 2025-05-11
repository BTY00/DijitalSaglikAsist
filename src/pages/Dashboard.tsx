import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Calendar, Droplets, Utensils } from 'lucide-react';
import axios from 'axios';

interface DashboardData {
  activityCount: number;
  appointmentCount: number;
  latestActivity: {
    date: string;
    sleepHours: number;
    waterIntake: number;
    calorieIntake: number;
  } | null;
  upcomingAppointments: {
    id: number;
    date: string;
    time: string;
    description: string;
  }[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    activityCount: 0,
    appointmentCount: 0,
    latestActivity: null,
    upcomingAppointments: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Merhaba, {user?.firstName}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Aktivite Kayıtları</h2>
              <p className="text-3xl font-bold text-gray-800">{data.activityCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Randevular</h2>
              <p className="text-3xl font-bold text-gray-800">{data.appointmentCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Sağlık Durumu</h2>
              <p className="text-lg font-medium text-green-600">İyi</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Son Aktivite</h2>
          
          {data.latestActivity ? (
            <div>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Tarih:</span> {new Date(data.latestActivity.date).toLocaleDateString('tr-TR')}
              </p>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Droplets className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Su Tüketimi</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{data.latestActivity.waterIntake} L</p>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Activity className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Uyku</span>
                  </div>
                  <p className="text-xl font-bold text-indigo-600">{data.latestActivity.sleepHours} saat</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Utensils className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Kalori</span>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{data.latestActivity.calorieIntake} kcal</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Henüz aktivite kaydı bulunmuyor.</p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Yaklaşan Randevular</h2>
          
          {data.upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {data.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="font-medium text-gray-800">{appointment.description}</p>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {new Date(appointment.date).toLocaleDateString('tr-TR')} - {appointment.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Yaklaşan randevu bulunmuyor.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;