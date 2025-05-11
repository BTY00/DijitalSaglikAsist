import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AppointmentFormData {
  date: string;
  time: string;
  description: string;
}

interface Appointment extends AppointmentFormData {
  id: number;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AppointmentFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      description: ''
    }
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Randevular yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const { error } = await supabase
        .from('appointments')
        .insert([{
          date: data.date,
          time: data.time,
          description: data.description
        }]);

      if (error) throw error;
      
      setSuccess('Randevu başarıyla oluşturuldu!');
      fetchAppointments();
      reset({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        description: ''
      });
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Randevu oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAppointment = async (id: number) => {
    if (!confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(appointments.filter(appointment => appointment.id !== id));
      setSuccess('Randevu başarıyla silindi!');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Randevu silinirken bir hata oluştu.');
    }
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
    const date = appointment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Randevu Takibi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Yeni Randevu Oluştur</h2>
          
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
              <label htmlFor="time" className="block text-gray-700 font-medium mb-2">
                Saat
              </label>
              <input
                id="time"
                type="time"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.time ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('time', { required: 'Saat gereklidir' })}
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Açıklama
              </label>
              <textarea
                id="description"
                rows={4}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Randevu açıklaması"
                {...register('description', { 
                  required: 'Açıklama gereklidir',
                  minLength: {
                    value: 5,
                    message: 'Açıklama en az 5 karakter olmalıdır'
                  }
                })}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Randevularım</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : Object.keys(groupedAppointments).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedAppointments)
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .map(([date, appointments]) => (
                  <div key={date} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-gray-800">
                        {new Date(date).toLocaleDateString('tr-TR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                    </div>
                    
                    <div className="space-y-3 pl-7">
                      {appointments
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment) => (
                          <div key={appointment.id} className="flex items-start justify-between bg-gray-50 p-3 rounded-lg">
                            <div>
                              <div className="flex items-center mb-1">
                                <Clock className="h-4 w-4 text-gray-600 mr-1" />
                                <span className="text-sm font-medium text-gray-800">{appointment.time}</span>
                              </div>
                              <p className="text-gray-700">{appointment.description}</p>
                            </div>
                            
                            <button
                              onClick={() => deleteAppointment(appointment.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Randevuyu sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz randevu bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;