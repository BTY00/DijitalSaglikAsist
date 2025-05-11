import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, Calendar, Droplets, Scale, Utensils, Award, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ActivityFormData {
  date: string;
  sleepHours: number;
  waterIntake: number;
  actualCalories: number;
  actualProtein: number;
  actualCarbs: number;
  actualFat: number;
}

interface FitnessProgram {
  id: number;
  goal: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface NutritionLog {
  id: number;
  date: string;
  actual_calories: number;
  actual_protein: number;
  actual_carbs: number;
  actual_fat: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  calorie_achievement: number;
  protein_achievement: number;
  carbs_achievement: number;
  fat_achievement: number;
  analysis: string;
  recommendations: string[];
  achievements: string[];
}

const DailyActivity: React.FC = () => {
  const [activities, setActivities] = useState<NutritionLog[]>([]);
  const [currentProgram, setCurrentProgram] = useState<FitnessProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ActivityFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      sleepHours: 8,
      waterIntake: 2,
      actualCalories: 0,
      actualProtein: 0,
      actualCarbs: 0,
      actualFat: 0
    }
  });

  const watchedDate = watch('date');

  useEffect(() => {
    fetchActivities();
    fetchCurrentProgram();
  }, []);

  useEffect(() => {
    const fetchDayData = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_nutrition_logs')
          .select('*')
          .eq('date', watchedDate)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // Not found error
            throw error;
          }
          return;
        }

        if (data) {
          setValue('actualCalories', data.actual_calories);
          setValue('actualProtein', data.actual_protein);
          setValue('actualCarbs', data.actual_carbs);
          setValue('actualFat', data.actual_fat);
          setValue('waterIntake', data.water_intake);
          setValue('sleepHours', data.sleep_hours);
        }
      } catch (err) {
        console.error('Error fetching day data:', err);
      }
    };

    fetchDayData();
  }, [watchedDate, setValue]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_nutrition_logs')
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

  const fetchCurrentProgram = async () => {
    try {
      const { data, error } = await supabase
        .from('fitness_programs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          throw error;
        }
        return;
      }

      setCurrentProgram(data);
    } catch (err) {
      console.error('Error fetching current program:', err);
      setError('Spor programı yüklenirken bir hata oluştu.');
    }
  };

  const analyzeNutrition = (data: ActivityFormData, targets: FitnessProgram['nutrition']) => {
    const analysis: string[] = [];
    const recommendations: string[] = [];
    const achievements: string[] = [];

    // Calculate percentages
    const caloriePercentage = (data.actualCalories / targets.calories) * 100;
    const proteinPercentage = (data.actualProtein / targets.protein) * 100;
    const carbsPercentage = (data.actualCarbs / targets.carbs) * 100;
    const fatPercentage = (data.actualFat / targets.fat) * 100;

    // Analyze calories
    if (Math.abs(caloriePercentage - 100) <= 10) {
      achievements.push('Günlük kalori hedefinize ulaştınız! 🎯');
    } else if (caloriePercentage < 90) {
      recommendations.push('Kalori alımınızı artırmanız önerilir.');
    } else if (caloriePercentage > 110) {
      recommendations.push('Kalori alımınızı azaltmanız önerilir.');
    }

    // Analyze protein
    if (proteinPercentage >= 90) {
      achievements.push('Protein hedefini başarıyla tamamladınız! 💪');
    } else {
      recommendations.push('Daha fazla protein tüketmelisiniz. Yumurta, tavuk, balık gibi protein kaynaklarını tercih edin.');
    }

    // Analyze carbs
    if (Math.abs(carbsPercentage - 100) <= 15) {
      achievements.push('Karbonhidrat dengenizi iyi koruyorsunuz! 🌟');
    } else if (carbsPercentage < 85) {
      recommendations.push('Kompleks karbonhidrat alımınızı artırın. Tam tahılları tercih edin.');
    } else if (carbsPercentage > 115) {
      recommendations.push('Karbonhidrat alımınızı azaltın ve daha çok protein tüketmeye odaklanın.');
    }

    // Analyze fat
    if (Math.abs(fatPercentage - 100) <= 15) {
      achievements.push('Yağ tüketiminiz hedef aralıkta! 👍');
    } else if (fatPercentage > 115) {
      recommendations.push('Yağ alımınızı azaltın. Daha az işlenmiş gıda tüketin.');
    }

    // Analyze water intake
    if (data.waterIntake >= 2.5) {
      achievements.push('Günlük su tüketim hedefinizi aştınız! 💧');
    } else if (data.waterIntake < 2) {
      recommendations.push('Su tüketiminizi artırın. Günde en az 2.5 litre su içmeyi hedefleyin.');
    }

    // Analyze sleep
    if (data.sleepHours >= 7 && data.sleepHours <= 9) {
      achievements.push('İdeal uyku süresine ulaştınız! 😴');
    } else if (data.sleepHours < 7) {
      recommendations.push('Daha fazla uyumaya çalışın. İdeal uyku süresi 7-9 saat arasıdır.');
    }

    // Generate overall analysis
    let overallAnalysis = 'Günlük beslenme ve aktivite analizi:\n\n';
    
    if (achievements.length > 0) {
      overallAnalysis += 'Başarılarınız:\n- ' + achievements.join('\n- ') + '\n\n';
    }
    
    if (recommendations.length > 0) {
      overallAnalysis += 'Öneriler:\n- ' + recommendations.join('\n- ');
    }

    return {
      analysis: overallAnalysis,
      recommendations,
      achievements
    };
  };

  const onSubmit = async (data: ActivityFormData) => {
    if (!currentProgram) {
      setError('Lütfen önce bir spor programı oluşturun.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { analysis, recommendations, achievements } = analyzeNutrition(data, currentProgram.nutrition);
      
      // First, create or update daily activity
      const { data: activityData, error: activityError } = await supabase
        .from('daily_activities')
        .upsert([{
          date: data.date,
          sleep_hours: data.sleepHours,
          water_intake: data.waterIntake,
          calorie_intake: data.actualCalories,
          fitness_program_id: currentProgram.id
        }])
        .select()
        .single();

      if (activityError) throw activityError;

      // Then, create or update nutrition log
      const { error: nutritionError } = await supabase
        .from('daily_nutrition_logs')
        .upsert([{
          date: data.date,
          daily_activity_id: activityData.id,
          fitness_program_id: currentProgram.id,
          actual_calories: data.actualCalories,
          actual_protein: data.actualProtein,
          actual_carbs: data.actualCarbs,
          actual_fat: data.actualFat,
          target_calories: currentProgram.nutrition.calories,
          target_protein: currentProgram.nutrition.protein,
          target_carbs: currentProgram.nutrition.carbs,
          target_fat: currentProgram.nutrition.fat,
          analysis,
          recommendations,
          achievements
        }]);

      if (nutritionError) throw nutritionError;
      
      setSuccess('Günlük aktivite başarıyla kaydedildi!');
      fetchActivities();
      
      reset({
        date: new Date().toISOString().split('T')[0],
        sleepHours: 8,
        waterIntake: 2,
        actualCalories: 0,
        actualProtein: 0,
        actualCarbs: 0,
        actualFat: 0
      });
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Aktivite kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAchievementBadge = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Hedefte
        <Award className="w-4 h-4 ml-1" />
      </span>;
    } else if (percentage < 90) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Düşük
        <AlertCircle className="w-4 h-4 ml-1" />
      </span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Yüksek
        <AlertCircle className="w-4 h-4 ml-1" />
      </span>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Günlük Aktivite ve Beslenme Takibi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Yeni Kayıt</h2>
          
          {!currentProgram && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Henüz bir spor programınız yok. Lütfen önce spor programı oluşturun.
                  </p>
                </div>
              </div>
            </div>
          )}
          
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

            {currentProgram && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-blue-800 mb-2">Günlük Hedefler</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Kalori</p>
                    <p className="font-bold">{currentProgram.nutrition.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Protein</p>
                    <p className="font-bold">{currentProgram.nutrition.protein}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Karbonhidrat</p>
                    <p className="font-bold">{currentProgram.nutrition.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Yağ</p>
                    <p className="font-bold">{currentProgram.nutrition.fat}g</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="actualCalories" className="block text-gray-700 font-medium mb-2">
                  Alınan Kalori (kcal)
                </label>
                <input
                  id="actualCalories"
                  type="number"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.actualCalories ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('actualCalories', { 
                    required: 'Kalori miktarı gereklidir',
                    min: {
                      value: 0,
                      message: 'Kalori 0 veya daha büyük olmalıdır'
                    }
                  })}
                />
                {errors.actualCalories && (
                  <p className="mt-1 text-sm text-red-600">{errors.actualCalories.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="actualProtein" className="block text-gray-700 font-medium mb-2">
                  Protein (g)
                </label>
                <input
                  id="actualProtein"
                  type="number"
                  min="0"
                  step="0.1"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.actualProtein ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('actualProtein', { 
                    required: 'Protein miktarı gereklidir',
                    min: {
                      value: 0,
                      message: 'Protein 0 veya daha büyük olmalıdır'
                    }
                  })}
                />
                {errors.actualProtein && (
                  <p className="mt-1 text-sm text-red-600">{errors.actualProtein.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="actualCarbs" className="block text-gray-700 font-medium mb-2">
                  Karbonhidrat (g)
                </label>
                <input
                  id="actualCarbs"
                  type="number"
                  min="0"
                  step="0.1"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.actualCarbs ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('actualCarbs', { 
                    required: 'Karbonhidrat miktarı gereklidir',
                    min: {
                      value: 0,
                      message: 'Karbonhidrat 0 veya daha büyük olmalıdır'
                    }
                  })}
                />
                {errors.actualCarbs && (
                  <p className="mt-1 text-sm text-red-600">{errors.actualCarbs.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="actualFat" className="block text-gray-700 font-medium mb-2">
                  Yağ (g)
                </label>
                <input
                  id="actualFat"
                  type="number"
                  min="0"
                  step="0.1"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.actualFat ? 'border-red-500' : 'border-gray-300'
                  }`}
                  {...register('actualFat', { 
                    required: 'Yağ miktarı gereklidir',
                    min: {
                      value: 0,
                      message: 'Yağ 0 veya daha büyük olmalıdır'
                    }
                  })}
                />
                {errors.actualFat && (
                  <p className="mt-1 text-sm text-red-600">{errors.actualFat.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
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
              
              <div>
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
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              disabled={submitting || !currentProgram}
            >
              {submitting ? 'Kaydediliyor...' : 'Kaydet ve Analiz Et'}
            </button>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Geçmiş Kayıtlar</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-800">
                        {new Date(activity.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Kalori</span>
                        {renderAchievementBadge(activity.calorie_achievement)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{activity.actual_calories} kcal</span>
                        <span className="text-sm text-gray-500">/ {activity.target_calories} kcal</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Protein</span>
                        {renderAchievementBadge(activity.protein_achievement)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{activity.actual_protein}g</span>
                        <span className="text-sm text-gray-500">/ {activity.target_protein}g</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Karbonhidrat</span>
                        {renderAchievementBadge(activity.carbs_achievement)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{activity.actual_carbs}g</span>
                        <span className="text-sm text-gray-500">/ {activity.target_carbs}g</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Yağ</span>
                        {renderAchievementBadge(activity.fat_achievement)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{activity.actual_fat}g</span>
                        <span className="text-sm text-gray-500">/ {activity.target_fat}g</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Günlük Analiz</h4>
                      <p className="text-blue-700 whitespace-pre-line">{activity.analysis}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz kayıt bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyActivity;