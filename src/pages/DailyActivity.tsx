import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, Calendar, Droplets, Utensils } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ActivityFormData {
  date: string;
  sleepHours: number;
  waterIntake: number;
  calorieIntake: number;
}

interface ActivityData extends ActivityFormData {
  id: number;
}

const DailyActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ActivityFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      sleepHours: 8,
      waterIntake: 2,
      calorieIntake: 2000
    }
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Aktivite verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ActivityFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('daily_activities')
        .upsert([
          {
            date: data.date,
            sleep_hours: data.sleepHours,
            water_intake: data.waterIntake,
            calorie_intake: data.calorieIntake
          }
        ]);

      if (error) throw error;
      
      setSuccess('Aktivite başarıyla kaydedildi!');
      fetchActivities();
      reset({
        date: new Date().toISOString().split('T')[0],
        sleepHours: 8,
        waterIntake: 2,
        calorieIntake: 2000
      });
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Aktivite kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Günlük Aktivite Girişi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Yeni Aktivite Ekle</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
                Tarih
              </label>
              <input
                id="date"
                type="date"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('date', { required: 'Tarih gereklidir' })}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="sleepHours" className="block text-gray-700 font-medium mb-2">
                Uyku Süresi (saat)
              </label>
              <input
                id="sleepHours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sleepHours ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('sleepHours', { 
                  required: 'Uyku süresi gereklidir',
                  min: {
                    value: 0,
                    message: 'Uyku süresi 0 veya daha büyük olmalıdır'
                  },
                  max: {
                    value: 24,
                    message: 'Uyku süresi 24 saatten fazla olamaz'
                  }
                })}
              />
              {errors.sleepHours && (
                <p className="mt-1 text-sm text-red-600">{errors.sleepHours.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="waterIntake" className="block text-gray-700 font-medium mb-2">
                Su Tüketimi (litre)
              </label>
              <input
                id="waterIntake"
                type="number"
                step="0.1"
                min="0"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.waterIntake ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('waterIntake', { 
                  required: 'Su tüketimi gereklidir',
                  min: {
                    value: 0,
                    message: 'Su tüketimi 0 veya daha büyük olmalıdır'
                  }
                })}
              />
              {errors.waterIntake && (
                <p className="mt-1 text-sm text-red-600">{errors.waterIntake.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="calorieIntake" className="block text-gray-700 font-medium mb-2">
                Kalori Alımı (kcal)
              </label>
              <input
                id="calorieIntake"
                type="number"
                min="0"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.calorieIntake ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('calorieIntake', { 
                  required: 'Kalori alımı gereklidir',
                  min: {
                    value: 0,
                    message: 'Kalori alımı 0 veya daha büyük olmalıdır'
                  }
                })}
              />
              {errors.calorieIntake && (
                <p className="mt-1 text-sm text-red-600">{errors.calorieIntake.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : 'Aktiviteyi Kaydet'}
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Geçmiş Aktiviteler</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="font-medium text-gray-800">
                      {new Date(activity.date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg flex flex-col items-center">
                      <Droplets className="h-5 w-5 text-blue-600 mb-1" />
                      <span className="text-sm text-gray-600">Su</span>
                      <span className="font-bold text-blue-600">{activity.waterIntake} L</span>
                    </div>
                    
                    <div className="bg-indigo-50 p-3 rounded-lg flex flex-col items-center">
                      <Activity className="h-5 w-5 text-indigo-600 mb-1" />
                      <span className="text-sm text-gray-600">Uyku</span>
                      <span className="font-bold text-indigo-600">{activity.sleepHours} saat</span>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded-lg flex flex-col items-center">
                      <Utensils className="h-5 w-5 text-orange-600 mb-1" />
                      <span className="text-sm text-gray-600">Kalori</span>
                      <span className="font-bold text-orange-600">{activity.calorieIntake} kcal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz aktivite kaydı bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyActivity;