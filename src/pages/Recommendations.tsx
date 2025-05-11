import React, { useEffect, useState } from 'react';
import { Activity, Heart, Lightbulb, RefreshCw, Utensils } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Recommendation {
  id: number;
  category: 'nutrition' | 'exercise' | 'wellness' | 'general';
  title: string;
  content: string;
  imageUrl?: string;
}

const categoryIcons = {
  nutrition: <Utensils className="h-5 w-5" />,
  exercise: <Activity className="h-5 w-5" />,
  wellness: <Heart className="h-5 w-5" />,
  general: <Lightbulb className="h-5 w-5" />
};

const categoryColors = {
  nutrition: 'bg-green-100 text-green-800',
  exercise: 'bg-blue-100 text-blue-800',
  wellness: 'bg-purple-100 text-purple-800',
  general: 'bg-yellow-100 text-yellow-800'
};

const generateRecommendations = async () => {
  try {
    // Get user's latest activity data
    const { data: activityData } = await supabase
      .from('daily_activities')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const recommendations: Omit<Recommendation, 'id'>[] = [];

    // Add general recommendations
    recommendations.push({
      category: 'general',
      title: 'Düzenli Uyku Alışkanlığı',
      content: 'Her gün aynı saatte yatıp kalkmak, uyku kalitenizi artırır ve metabolizmanızı düzenler.',
      imageUrl: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg'
    });

    recommendations.push({
      category: 'nutrition',
      title: 'Sağlıklı Beslenme İpuçları',
      content: 'Günde en az 5 porsiyon meyve ve sebze tüketmeye çalışın. Çeşitli renklerde sebze ve meyveler farklı vitamin ve mineraller içerir.',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg'
    });

    // Add activity-specific recommendations if available
    if (activityData) {
      if (activityData.water_intake < 2) {
        recommendations.push({
          category: 'wellness',
          title: 'Su Tüketimini Artırın',
          content: 'Günlük su tüketiminiz yetersiz görünüyor. Yetişkinler için önerilen günlük su miktarı en az 2 litredir. Su tüketiminizi artırmak için yanınızda her zaman bir su şişesi bulundurun.',
          imageUrl: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg'
        });
      }

      if (activityData.sleep_hours < 7) {
        recommendations.push({
          category: 'wellness',
          title: 'Uyku Sürenizi Artırın',
          content: 'Uyku süreniz önerilen miktarın altında görünüyor. Yetişkinler için ideal uyku süresi 7-9 saattir. Yeterli uyku, bağışıklık sisteminizi güçlendirir ve genel sağlığınızı iyileştirir.',
          imageUrl: 'https://images.pexels.com/photos/3771115/pexels-photo-3771115.jpeg'
        });
      }

      if (activityData.calorie_intake > 2500) {
        recommendations.push({
          category: 'nutrition',
          title: 'Kalori Alımınızı Dengeleyin',
          content: 'Kalori alımınız yüksek görünüyor. Beslenmenizde tam tahıllar, sebzeler ve protein kaynaklarına öncelik vererek daha dengeli bir diyet oluşturmayı düşünebilirsiniz.',
          imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
        });
      }
    }

    // Get user's fitness program
    const { data: fitnessData } = await supabase
      .from('fitness_programs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fitnessData) {
      if (fitnessData.goal === 'lose') {
        recommendations.push({
          category: 'exercise',
          title: 'Kardiyovasküler Egzersizler',
          content: 'Kilo verme hedefiniz için haftada en az 150 dakika orta yoğunlukta kardiyovasküler egzersiz yapmanız önerilir. Yürüyüş, koşu veya bisiklet sürmek ideal seçeneklerdir.',
          imageUrl: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg'
        });
      } else if (fitnessData.goal === 'gain') {
        recommendations.push({
          category: 'exercise',
          title: 'Güç Antrenmanı',
          content: 'Kas kütlesi kazanmak için haftada 3-4 gün ağırlık çalışması yapın. Her kas grubunu haftada en az iki kez çalıştırın ve yeterli protein alımına dikkat edin.',
          imageUrl: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg'
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Öneriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Generate new recommendations
      const newRecommendations = await generateRecommendations();

      // Delete existing recommendations
      const { error: deleteError } = await supabase
        .from('recommendations')
        .delete()
        .not('id', 'is', null);

      if (deleteError) throw deleteError;

      // Insert new recommendations
      const { error: insertError } = await supabase
        .from('recommendations')
        .insert(newRecommendations);

      if (insertError) throw insertError;

      // Fetch updated recommendations
      await fetchRecommendations();
    } catch (err) {
      console.error('Error refreshing recommendations:', err);
      setError('Öneriler yenilenirken bir hata oluştu.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sağlık Önerileri</h1>
        
        <button
          onClick={refreshRecommendations}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Yenileniyor...' : 'Önerileri Yenile'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {recommendation.imageUrl && (
                <img 
                  src={recommendation.imageUrl} 
                  alt={recommendation.title} 
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-5">
                <div className="flex items-center mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryColors[recommendation.category]}`}>
                    {categoryIcons[recommendation.category]}
                    <span className="ml-1">
                      {recommendation.category === 'nutrition' ? 'Beslenme' : 
                       recommendation.category === 'exercise' ? 'Egzersiz' : 
                       recommendation.category === 'wellness' ? 'Sağlık' : 'Genel'}
                    </span>
                  </span>
                </div>
                
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{recommendation.title}</h2>
                <p className="text-gray-600">{recommendation.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Henüz öneri bulunmuyor</h2>
          <p className="text-gray-600 mb-4">Kişiselleştirilmiş sağlık önerilerinizi görmek için "Önerileri Yenile" butonuna tıklayın.</p>
          <button
            onClick={refreshRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Önerileri Yenile
          </button>
        </div>
      )}
    </div>
  );
};

export default Recommendations;