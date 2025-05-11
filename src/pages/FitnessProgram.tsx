import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Activity, ArrowRight, Check, Dumbbell } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface FitnessProgramFormData {
  height: number;
  weight: number;
  age: number;
  goal: 'lose' | 'gain' | 'maintain';
}

interface FitnessProgram {
  id: number;
  goal: string;
  exercises: {
    name: string;
    sets: number;
    reps: number;
    description: string;
  }[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    recommendations: string[];
  };
  createdAt: string;
}

const FitnessProgram: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<FitnessProgram | null>(null);
  const [savedPrograms, setSavedPrograms] = useState<FitnessProgram[]>([]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FitnessProgramFormData>({
    defaultValues: {
      height: 170,
      weight: 70,
      age: 30,
      goal: 'maintain'
    }
  });

  useEffect(() => {
    fetchSavedPrograms();
  }, []);

  const fetchSavedPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fitness_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPrograms(data || []);
    } catch (err) {
      console.error('Error fetching fitness programs:', err);
      setError('Programlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const generateProgram = (data: FitnessProgramFormData) => {
    const { height, weight, age, goal } = data;
    const bmi = weight / ((height / 100) * (height / 100));
    const bmr = 10 * weight + 6.25 * height - 5 * age;
    
    let exercises = [];
    let nutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      recommendations: []
    };

    if (goal === 'lose') {
      nutrition.calories = Math.round(bmr * 1.2 - 500);
      nutrition.protein = Math.round(weight * 2);
      nutrition.carbs = Math.round(nutrition.calories * 0.4 / 4);
      nutrition.fat = Math.round(nutrition.calories * 0.3 / 9);
      
      exercises = [
        {
          name: 'Kardiyovasküler Egzersiz',
          sets: 1,
          reps: 30,
          description: '30 dakika tempolu yürüyüş veya koşu'
        },
        {
          name: 'Squat',
          sets: 3,
          reps: 15,
          description: 'Bacak kaslarını çalıştıran temel egzersiz'
        },
        {
          name: 'Push-up',
          sets: 3,
          reps: 12,
          description: 'Göğüs ve kol kaslarını çalıştıran egzersiz'
        },
        {
          name: 'Plank',
          sets: 3,
          reps: 45,
          description: '45 saniye plank pozisyonunda kalın'
        }
      ];
      
      nutrition.recommendations = [
        'Günde 5-6 öğün küçük porsiyonlar halinde beslenin',
        'Her öğünde protein tüketmeye özen gösterin',
        'Sebze ve meyve tüketimini artırın',
        'Şekerli ve işlenmiş gıdalardan kaçının',
        'Günde en az 2.5-3 litre su için'
      ];
    } else if (goal === 'gain') {
      nutrition.calories = Math.round(bmr * 1.5 + 300);
      nutrition.protein = Math.round(weight * 2.2);
      nutrition.carbs = Math.round(nutrition.calories * 0.5 / 4);
      nutrition.fat = Math.round(nutrition.calories * 0.25 / 9);
      
      exercises = [
        {
          name: 'Bench Press',
          sets: 4,
          reps: 8,
          description: 'Göğüs kaslarını geliştiren temel egzersiz'
        },
        {
          name: 'Deadlift',
          sets: 4,
          reps: 6,
          description: 'Sırt ve bacak kaslarını çalıştıran egzersiz'
        },
        {
          name: 'Military Press',
          sets: 3,
          reps: 10,
          description: 'Omuz kaslarını geliştiren egzersiz'
        },
        {
          name: 'Pull-ups',
          sets: 3,
          reps: 8,
          description: 'Sırt kaslarını geliştiren egzersiz'
        }
      ];
      
      nutrition.recommendations = [
        'Günde 6-7 öğün beslenin',
        'Her öğünde kompleks karbonhidrat ve protein tüketin',
        'Antrenman sonrası protein shake için',
        'Yağlı tohumlar ve kuruyemişleri ara öğünlerde tüketin',
        'Günde en az 3 litre su için'
      ];
    } else {
      nutrition.calories = Math.round(bmr * 1.4);
      nutrition.protein = Math.round(weight * 1.6);
      nutrition.carbs = Math.round(nutrition.calories * 0.45 / 4);
      nutrition.fat = Math.round(nutrition.calories * 0.3 / 9);
      
      exercises = [
        {
          name: 'Full Body Circuit',
          sets: 3,
          reps: 12,
          description: 'Tüm vücut için circuit antrenmanı'
        },
        {
          name: 'Bodyweight Exercises',
          sets: 3,
          reps: 15,
          description: 'Vücut ağırlığıyla yapılan egzersizler'
        },
        {
          name: 'Yoga/Stretching',
          sets: 1,
          reps: 20,
          description: '20 dakika esneme ve denge hareketleri'
        },
        {
          name: 'Core Workout',
          sets: 3,
          reps: 30,
          description: 'Karın ve core bölgesi için egzersizler'
        }
      ];
      
      nutrition.recommendations = [
        'Dengeli ve çeşitli beslenin',
        'Öğün atlamamaya özen gösterin',
        'Taze sebze ve meyveleri ihmal etmeyin',
        'Protein kaynaklarını çeşitlendirin',
        'Günde 2-2.5 litre su için'
      ];
    }

    return {
      goal,
      exercises,
      nutrition,
      createdAt: new Date().toISOString()
    };
  };

  const onSubmit = async (data: FitnessProgramFormData) => {
    try {
      setGenerating(true);
      setError(null);
      
      const generatedProgram = generateProgram(data);
      setProgram(generatedProgram as FitnessProgram);
      setStep(2);
    } catch (err) {
      console.error('Error generating program:', err);
      setError('Program oluşturulurken bir hata oluştu.');
    } finally {
      setGenerating(false);
    }
  };

  const saveProgram = async () => {
    if (!program) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fitness_programs')
        .insert([{
          goal: program.goal,
          exercises: program.exercises,
          nutrition: program.nutrition
        }]);

      if (error) throw error;
      
      await fetchSavedPrograms();
      setStep(3);
    } catch (err) {
      console.error('Error saving program:', err);
      setError('Program kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Kişisel Bilgileriniz</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="height" className="block text-gray-700 font-medium mb-2">
              Boy (cm)
            </label>
            <input
              id="height"
              type="number"
              min="100"
              max="250"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.height ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('height', { 
                required: 'Boy gereklidir',
                min: {
                  value: 100,
                  message: 'Boy en az 100 cm olmalıdır'
                },
                max: {
                  value: 250,
                  message: 'Boy en fazla 250 cm olmalıdır'
                }
              })}
            />
            {errors.height && (
              <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="weight" className="block text-gray-700 font-medium mb-2">
              Kilo (kg)
            </label>
            <input
              id="weight"
              type="number"
              min="30"
              max="250"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('weight', { 
                required: 'Kilo gereklidir',
                min: {
                  value: 30,
                  message: 'Kilo en az 30 kg olmalıdır'
                },
                max: {
                  value: 250,
                  message: 'Kilo en fazla 250 kg olmalıdır'
                }
              })}
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="age" className="block text-gray-700 font-medium mb-2">
            Yaş
          </label>
          <input
            id="age"
            type="number"
            min="16"
            max="100"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('age', { 
              required: 'Yaş gereklidir',
              min: {
                value: 16,
                message: 'Yaş en az 16 olmalıdır'
              },
              max: {
                value: 100,
                message: 'Yaş en fazla 100 olmalıdır'
              }
            })}
          />
          {errors.age && (
            <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Hedefiniz
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="relative border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="lose"
                className="absolute opacity-0"
                {...register('goal', { required: 'Hedef seçimi gereklidir' })}
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
                <span className="font-medium text-gray-800">Kilo Vermek</span>
              </div>
            </label>
            
            <label className="relative border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="gain"
                className="absolute opacity-0"
                {...register('goal')}
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <Dumbbell className="h-6 w-6 text-green-600" />
                </div>
                <span className="font-medium text-gray-800">Kilo Almak</span>
              </div>
            </label>
            
            <label className="relative border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="maintain"
                className="absolute opacity-0"
                {...register('goal')}
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Check className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-medium text-gray-800">Fit Kalmak</span>
              </div>
            </label>
          </div>
          
          {errors.goal && (
            <p className="mt-1 text-sm text-red-600">{errors.goal.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          disabled={generating}
        >
          {generating ? 'Program Oluşturuluyor...' : 'Program Oluştur'}
        </button>
      </form>
    </div>
  );

  const renderStepTwo = () => {
    if (!program) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Önerilen Program</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Egzersiz Programı</h3>
          
          <div className="space-y-4">
            {program.exercises.map((exercise, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-1">{exercise.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{exercise.description}</p>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {exercise.sets} set
                  </span>
                  <ArrowRight className="h-3 w-3 mx-2" />
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {exercise.reps} tekrar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Beslenme Önerileri</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Kalori</p>
                <p className="font-bold text-gray-800">{program.nutrition.calories} kcal</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Protein</p>
                <p className="font-bold text-gray-800">{program.nutrition.protein}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Karbonhidrat</p>
                <p className="font-bold text-gray-800">{program.nutrition.carbs}g</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Yağ</p>
                <p className="font-bold text-gray-800">{program.nutrition.fat}g</p>
              </div>
            </div>
          </div>
          
          <ul className="list-disc list-inside space-y-2">
            {program.nutrition.recommendations.map((recommendation, index) => (
              <li key={index} className="text-gray-700">{recommendation}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Geri Dön
          </button>
          
          <button
            onClick={saveProgram}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Programı Kaydet'}
          </button>
        </div>
      </div>
    );
  };

  const renderStepThree = () => (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Program Başarıyla Kaydedildi!</h2>
      <p className="text-gray-600 mb-6">Programınız kaydedildi ve aşağıdaki listede görüntüleyebilirsiniz.</p>
      
      <div className="flex justify-center">
        <button
          onClick={() => {
            setStep(1);
            setProgram(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Yeni Program Oluştur
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Spor Programı Oluşturma</h1>
      
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-600">Bilgi Girişi</span>
          <span className="text-gray-600">Program Önerisi</span>
          <span className="text-gray-600">Tamamlandı</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {step === 1 && renderStepOne()}
          {step === 2 && renderStepTwo()}
          {step === 3 && renderStepThree()}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Kaydedilen Programlar</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : savedPrograms.length > 0 ? (
            <div className="space-y-4">
              {savedPrograms.map((program) => (
                <div key={program.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {program.goal === 'lose' ? 'Kilo Vermek' : 
                         program.goal === 'gain' ? 'Kilo Almak' : 'Fit Kalmak'}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(program.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => setProgram(program)}
                    >
                      Detayları Gör
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Kalori</p>
                      <p className="font-bold text-gray-800">{program.nutrition.calories}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Protein</p>
                      <p className="font-bold text-gray-800">{program.nutrition.protein}g</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Karb</p>
                      <p className="font-bold text-gray-800">{program.nutrition.carbs}g</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-600">Yağ</p>
                      <p className="font-bold text-gray-800">{program.nutrition.fat}g</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz kaydedilmiş program bulunmuyor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FitnessProgram;