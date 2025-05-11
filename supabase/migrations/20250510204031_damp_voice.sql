-- Create database
-- Run this command in psql: CREATE DATABASE health_assistant;

-- Connect to the database
-- \c health_assistant

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily activities table
CREATE TABLE daily_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours NUMERIC(4,1) NOT NULL,
  water_intake NUMERIC(4,1) NOT NULL,
  calorie_intake INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Fitness programs table
CREATE TABLE fitness_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal VARCHAR(50) NOT NULL,
  exercises JSONB NOT NULL,
  nutrition JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table
CREATE TABLE recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX idx_daily_activities_date ON daily_activities(date);
CREATE INDEX idx_fitness_programs_user_id ON fitness_programs(user_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);

-- Sample data (optional)
-- Insert a test user (password: password123)
INSERT INTO users (first_name, last_name, email, password) 
VALUES ('Test', 'User', 'test@example.com', '$2b$10$3JqfeJsjiJ1eBCBqHvhS8u.4v6Jgnj0LSKfJ9/VqZNIFEUZxvQYfG');

-- Insert sample daily activities
INSERT INTO daily_activities (user_id, date, sleep_hours, water_intake, calorie_intake)
VALUES 
  (1, CURRENT_DATE - INTERVAL '2 days', 7.5, 2.0, 2100),
  (1, CURRENT_DATE - INTERVAL '1 day', 8.0, 2.5, 1950),
  (1, CURRENT_DATE, 6.5, 1.8, 2200);

-- Insert sample appointments
INSERT INTO appointments (user_id, date, time, description)
VALUES 
  (1, CURRENT_DATE + INTERVAL '3 days', '10:00', 'Doktor kontrolü'),
  (1, CURRENT_DATE + INTERVAL '7 days', '15:30', 'Diş hekimi randevusu'),
  (1, CURRENT_DATE + INTERVAL '14 days', '09:15', 'Fitness değerlendirmesi');

-- Insert sample recommendations
INSERT INTO recommendations (user_id, category, title, content, image_url)
VALUES 
  (1, 'nutrition', 'Sağlıklı Beslenme İpuçları', 'Günde en az 5 porsiyon meyve ve sebze tüketmeye çalışın. Çeşitli renklerde sebze ve meyveler farklı vitamin ve mineraller içerir.', 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
  (1, 'exercise', 'Günlük Hareket Önerisi', 'Günde en az 30 dakika orta yoğunlukta fiziksel aktivite yapın. Bu, yürüyüş, bisiklet veya yüzme gibi aktiviteler olabilir.', 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'),
  (1, 'wellness', 'Su Tüketimini Artırın', 'Yetişkinler için önerilen günlük su miktarı en az 2 litredir. Su tüketiminizi artırmak için yanınızda her zaman bir su şişesi bulundurun.', 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');