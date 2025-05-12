/*
  # Add Daily Nutrition Logs Table

  1. New Tables
    - `daily_nutrition_logs` (if not exists)
      - Tracks actual and target nutrition values
      - Stores AI feedback and recommendations
      - Links to daily_activities and fitness_programs
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'daily_nutrition_logs') THEN
    -- Create daily nutrition logs table
    CREATE TABLE daily_nutrition_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      daily_activity_id INTEGER REFERENCES daily_activities(id) ON DELETE CASCADE,
      fitness_program_id INTEGER REFERENCES fitness_programs(id) ON DELETE SET NULL,
      date DATE NOT NULL,
      
      -- Actual nutrition values
      actual_calories INTEGER NOT NULL,
      actual_protein NUMERIC(6,2) NOT NULL,
      actual_carbs NUMERIC(6,2) NOT NULL,
      actual_fat NUMERIC(6,2) NOT NULL,
      
      -- Target values (copied from fitness program for historical tracking)
      target_calories INTEGER NOT NULL,
      target_protein NUMERIC(6,2) NOT NULL,
      target_carbs NUMERIC(6,2) NOT NULL,
      target_fat NUMERIC(6,2) NOT NULL,
      
      -- Achievement percentages
      calorie_achievement NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
          WHEN target_calories > 0 THEN (actual_calories::NUMERIC / target_calories * 100)
          ELSE 0 
        END
      ) STORED,
      
      protein_achievement NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
          WHEN target_protein > 0 THEN (actual_protein / target_protein * 100)
          ELSE 0 
        END
      ) STORED,
      
      carbs_achievement NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
          WHEN target_carbs > 0 THEN (actual_carbs / target_carbs * 100)
          ELSE 0 
        END
      ) STORED,
      
      fat_achievement NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
          WHEN target_fat > 0 THEN (actual_fat / target_fat * 100)
          ELSE 0 
        END
      ) STORED,
      
      -- AI feedback
      analysis TEXT NOT NULL,
      recommendations TEXT[] NOT NULL,
      achievements TEXT[] NOT NULL,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(user_id, date)
    );

    -- Create indexes
    CREATE INDEX idx_daily_nutrition_logs_user_id ON daily_nutrition_logs(user_id);
    CREATE INDEX idx_daily_nutrition_logs_date ON daily_nutrition_logs(date);
    CREATE INDEX idx_daily_nutrition_logs_daily_activity_id ON daily_nutrition_logs(daily_activity_id);
    CREATE INDEX idx_daily_nutrition_logs_fitness_program_id ON daily_nutrition_logs(fitness_program_id);

    -- Enable RLS
    ALTER TABLE daily_nutrition_logs ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view their own nutrition logs"
      ON daily_nutrition_logs
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own nutrition logs"
      ON daily_nutrition_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own nutrition logs"
      ON daily_nutrition_logs
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;