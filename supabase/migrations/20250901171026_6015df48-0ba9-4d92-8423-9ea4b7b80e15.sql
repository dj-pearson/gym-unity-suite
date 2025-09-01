-- Fix foreign key relationships for personal training sessions
ALTER TABLE personal_training_sessions 
ADD CONSTRAINT personal_training_sessions_trainer_id_fkey 
FOREIGN KEY (trainer_id) REFERENCES profiles(id);

ALTER TABLE personal_training_sessions 
ADD CONSTRAINT personal_training_sessions_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES profiles(id);