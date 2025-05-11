import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/health_assistant',
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme başarısız: Token bulunamadı' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Yetkilendirme başarısız: Geçersiz token' });
    }
    
    req.user = decoded.user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email',
      [firstName, lastName, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Geçersiz e-posta veya şifre' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçersiz e-posta veya şifre' });
    }
    
    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// User Routes
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;
    
    // Check if email is already in use by another user
    if (email !== req.user.email) {
      const emailExists = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
      }
    }
    
    // Update user
    await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4',
      [firstName, lastName, email, userId]
    );
    
    res.json({ message: 'Profil başarıyla güncellendi' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.put('/api/users/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Get current user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Activity Routes
app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activities = await pool.query(
      'SELECT * FROM daily_activities WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    
    res.json(activities.rows);
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { date, sleepHours, waterIntake, calorieIntake } = req.body;
    const userId = req.user.id;
    
    // Check if activity already exists for this date
    const existingActivity = await pool.query(
      'SELECT * FROM daily_activities WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    
    if (existingActivity.rows.length > 0) {
      // Update existing activity
      await pool.query(
        'UPDATE daily_activities SET sleep_hours = $1, water_intake = $2, calorie_intake = $3 WHERE user_id = $4 AND date = $5',
        [sleepHours, waterIntake, calorieIntake, userId, date]
      );
    } else {
      // Create new activity
      await pool.query(
        'INSERT INTO daily_activities (user_id, date, sleep_hours, water_intake, calorie_intake) VALUES ($1, $2, $3, $4, $5)',
        [userId, date, sleepHours, waterIntake, calorieIntake]
      );
    }
    
    res.status(201).json({ message: 'Aktivite başarıyla kaydedildi' });
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Fitness Program Routes
app.get('/api/fitness-programs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const programs = await pool.query(
      'SELECT * FROM fitness_programs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(programs.rows);
  } catch (err) {
    console.error('Get fitness programs error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/fitness-programs/generate', authenticateToken, async (req, res) => {
  try {
    const { height, weight, age, goal } = req.body;
    
    // Calculate BMI
    const bmi = weight / ((height / 100) * (height / 100));
    
    // Generate a simple fitness program based on user data
    // This is a simplified example - in a real app, this would be more sophisticated
    let exercises = [];
    let nutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      recommendations: []
    };
    
    // Set nutrition based on goal and BMI
    if (goal === 'lose') {
      // Weight loss program
      nutrition.calories = Math.round((10 * weight + 6.25 * height - 5 * age) * 1.2 - 500);
      nutrition.protein = Math.round(weight * 2);
      nutrition.carbs = Math.round(nutrition.calories * 0.4 / 4);
      nutrition.fat = Math.round(nutrition.calories * 0.3 / 9);
      
      nutrition.recommendations = [
        'Günde en az 2 litre su için',
        'Şekerli içeceklerden kaçının',
        'Öğün aralarında protein ağırlıklı atıştırmalıklar tercih edin',
        'Akşam 8\'den sonra yemek yemeyin',
        'Haftada en az 3-4 gün kardiyovasküler egzersiz yapın'
      ];
      
      exercises = [
        {
          name: 'Yürüyüş/Koşu',
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
          reps: 10,
          description: 'Göğüs, omuz ve kol kaslarını çalıştıran egzersiz'
        },
        {
          name: 'Plank',
          sets: 3,
          reps: 30,
          description: '30 saniye boyunca plank pozisyonunda kalın'
        },
        {
          name: 'Jumping Jacks',
          sets: 3,
          reps: 20,
          description: 'Tüm vücudu çalıştıran kardiyovasküler egzersiz'
        }
      ];
    } else if (goal === 'gain') {
      // Weight gain program
      nutrition.calories = Math.round((10 * weight + 6.25 * height - 5 * age) * 1.5 + 300);
      nutrition.protein = Math.round(weight * 2.2);
      nutrition.carbs = Math.round(nutrition.calories * 0.5 / 4);
      nutrition.fat = Math.round(nutrition.calories * 0.25 / 9);
      
      nutrition.recommendations = [
        'Günde 5-6 öğün yemeye çalışın',
        'Her öğünde protein tüketin',
        'Yatmadan önce protein shake içebilirsiniz',
        'Kompleks karbonhidratlar tüketin (tam tahıllar, patates, pirinç)',
        'Antrenman sonrası karbonhidrat ve protein içeren bir öğün tüketin'
      ];
      
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
          description: 'Sırt, bacak ve kalça kaslarını çalıştıran egzersiz'
        },
        {
          name: 'Squat',
          sets: 4,
          reps: 8,
          description: 'Bacak kaslarını geliştiren temel egzersiz'
        },
        {
          name: 'Shoulder Press',
          sets: 3,
          reps: 10,
          description: 'Omuz kaslarını geliştiren egzersiz'
        },
        {
          name: 'Pull-ups',
          sets: 3,
          reps: 8,
          description: 'Sırt ve kol kaslarını geliştiren egzersiz'
        }
      ];
    } else {
      // Maintain fitness
      nutrition.calories = Math.round((10 * weight + 6.25 * height - 5 * age) * 1.4);
      nutrition.protein = Math.round(weight * 1.6);
      nutrition.carbs = Math.round(nutrition.calories * 0.45 / 4);
      nutrition.fat = Math.round(nutrition.calories * 0.3 / 9);
      
      nutrition.recommendations = [
        'Dengeli ve çeşitli beslenin',
        'Günde en az 2 litre su için',
        'İşlenmiş gıdalardan kaçının',
        'Haftada en az 3 gün egzersiz yapın',
        'Yeterli uyku almaya özen gösterin (7-8 saat)'
      ];
      
      exercises = [
        {
          name: 'Karışık Kardiyovasküler Egzersiz',
          sets: 1,
          reps: 20,
          description: '20 dakika tempolu yürüyüş, koşu veya bisiklet'
        },
        {
          name: 'Push-up',
          sets: 3,
          reps: 12,
          description: 'Göğüs, omuz ve kol kaslarını çalıştıran egzersiz'
        },
        {
          name: 'Bodyweight Squat',
          sets: 3,
          reps: 15,
          description: 'Bacak kaslarını çalıştıran temel egzersiz'
        },
        {
          name: 'Plank',
          sets: 3,
          reps: 45,
          description: '45 saniye boyunca plank pozisyonunda kalın'
        },
        {
          name: 'Dumbbell Row',
          sets: 3,
          reps: 12,
          description: 'Sırt kaslarını çalıştıran egzersiz'
        }
      ];
    }
    
    const program = {
      id: Date.now(), // Temporary ID for frontend
      goal,
      exercises,
      nutrition,
      createdAt: new Date().toISOString()
    };
    
    res.json(program);
  } catch (err) {
    console.error('Generate fitness program error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/fitness-programs', authenticateToken, async (req, res) => {
  try {
    const { goal, exercises, nutrition } = req.body;
    const userId = req.user.id;
    
    // Save program to database
    const result = await pool.query(
      'INSERT INTO fitness_programs (user_id, goal, exercises, nutrition) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, goal, JSON.stringify(exercises), JSON.stringify(nutrition)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Save fitness program error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Appointment Routes
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const appointments = await pool.query(
      'SELECT * FROM appointments WHERE user_id = $1 ORDER BY date ASC, time ASC',
      [userId]
    );
    
    res.json(appointments.rows);
  } catch (err) {
    console.error('Get appointments error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { date, time, description } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      'INSERT INTO appointments (user_id, date, time, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, date, time, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.delete('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    
    // Check if appointment belongs to user
    const appointment = await pool.query(
      'SELECT * FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, userId]
    );
    
    if (appointment.rows.length === 0) {
      return res.status(404).json({ message: 'Randevu bulunamadı' });
    }
    
    await pool.query(
      'DELETE FROM appointments WHERE id = $1',
      [appointmentId]
    );
    
    res.json({ message: 'Randevu başarıyla silindi' });
  } catch (err) {
    console.error('Delete appointment error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Recommendation Routes
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const recommendations = await pool.query(
      'SELECT * FROM recommendations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(recommendations.rows);
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.post('/api/recommendations/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's latest activity data
    const activityResult = await pool.query(
      'SELECT * FROM daily_activities WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
      [userId]
    );
    
    // Generate recommendations based on user data
    // This is a simplified example - in a real app, this would use more sophisticated AI/rules
    const recommendations = [];
    
    // Add some general recommendations
    recommendations.push({
      id: 1,
      category: 'general',
      title: 'Düzenli Uyku Alışkanlığı',
      content: 'Her gün aynı saatte yatıp kalkmak, uyku kalitenizi artırır ve metabolizmanızı düzenler.',
      imageUrl: 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    });
    
    recommendations.push({
      id: 2,
      category: 'nutrition',
      title: 'Sağlıklı Beslenme İpuçları',
      content: 'Günde en az 5 porsiyon meyve ve sebze tüketmeye çalışın. Çeşitli renklerde sebze ve meyveler farklı vitamin ve mineraller içerir.',
      imageUrl: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    });
    
    recommendations.push({
      id: 3,
      category: 'exercise',
      title: 'Günlük Hareket Önerisi',
      content: 'Günde en az 30 dakika orta yoğunlukta fiziksel aktivite yapın. Bu, yürüyüş, bisiklet veya yüzme gibi aktiviteler olabilir.',
      imageUrl: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    });
    
    // Add activity-specific recommendations if available
    if (activityResult.rows.length > 0) {
      const activity = activityResult.rows[0];
      
      // Water intake recommendation
      if (activity.water_intake < 2) {
        recommendations.push({
          id: 4,
          category: 'wellness',
          title: 'Su Tüketimini Artırın',
          content: 'Günlük su tüketiminiz yetersiz görünüyor. Yetişkinler için önerilen günlük su miktarı en az 2 litredir. Su tüketiminizi artırmak için yanınızda her zaman bir su şişesi bulundurun.',
          imageUrl: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        });
      }
      
      // Sleep recommendation
      if (activity.sleep_hours < 7) {
        recommendations.push({
          id: 5,
          category: 'wellness',
          title: 'Uyku Sürenizi Artırın',
          content: 'Uyku süreniz önerilen miktarın altında görünüyor. Yetişkinler için ideal uyku süresi 7-9 saattir. Yeterli uyku, bağışıklık sisteminizi güçlendirir ve genel sağlığınızı iyileştirir.',
          imageUrl: 'https://images.pexels.com/photos/3771115/pexels-photo-3771115.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        });
      } else if (activity.sleep_hours > 9) {
        recommendations.push({
          id: 6,
          category: 'wellness',
          title: 'Uyku Kalitenizi Kontrol Edin',
          content: 'Uzun uyku süreleri bazen uyku kalitesinin düşük olduğunu gösterebilir. Uyku kalitenizi artırmak için yatak odanızın karanlık, sessiz ve serin olduğundan emin olun.',
          imageUrl: 'https://images.pexels.com/photos/1028741/pexels-photo-1028741.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        });
      }
      
      // Calorie intake recommendation
      if (activity.calorie_intake > 2500) {
        recommendations.push({
          id: 7,
          category: 'nutrition',
          title: 'Kalori Alımınızı Dengeleyin',
          content: 'Kalori alımınız yüksek görünüyor. Beslenmenizde tam tahıllar, sebzeler ve protein kaynaklarına öncelik vererek daha dengeli bir diyet oluşturmayı düşünebilirsiniz.',
          imageUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        });
      }
    }
    
    // Save recommendations to database
    await pool.query(
      'DELETE FROM recommendations WHERE user_id = $1',
      [userId]
    );
    
    for (const recommendation of recommendations) {
      await pool.query(
        'INSERT INTO recommendations (user_id, category, title, content, image_url) VALUES ($1, $2, $3, $4, $5)',
        [userId, recommendation.category, recommendation.title, recommendation.content, recommendation.imageUrl]
      );
    }
    
    // Get the newly saved recommendations
    const savedRecommendations = await pool.query(
      'SELECT * FROM recommendations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(savedRecommendations.rows);
  } catch (err) {
    console.error('Refresh recommendations error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Dashboard Route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get activity count
    const activityCountResult = await pool.query(
      'SELECT COUNT(*) FROM daily_activities WHERE user_id = $1',
      [userId]
    );
    const activityCount = parseInt(activityCountResult.rows[0].count);
    
    // Get appointment count
    const appointmentCountResult = await pool.query(
      'SELECT COUNT(*) FROM appointments WHERE user_id = $1',
      [userId]
    );
    const appointmentCount = parseInt(appointmentCountResult.rows[0].count);
    
    // Get latest activity
    const latestActivityResult = await pool.query(
      'SELECT * FROM daily_activities WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
      [userId]
    );
    const latestActivity = latestActivityResult.rows.length > 0 ? {
      date: latestActivityResult.rows[0].date,
      sleepHours: latestActivityResult.rows[0].sleep_hours,
      waterIntake: latestActivityResult.rows[0].water_intake,
      calorieIntake: latestActivityResult.rows[0].calorie_intake
    } : null;
    
    // Get upcoming appointments
    const upcomingAppointmentsResult = await pool.query(
      'SELECT * FROM appointments WHERE user_id = $1 AND date >= CURRENT_DATE ORDER BY date ASC, time ASC LIMIT 3',
      [userId]
    );
    const upcomingAppointments = upcomingAppointmentsResult.rows.map(row => ({
      id: row.id,
      date: row.date,
      time: row.time,
      description: row.description
    }));
    
    res.json({
      activityCount,
      appointmentCount,
      latestActivity,
      upcomingAppointments
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});