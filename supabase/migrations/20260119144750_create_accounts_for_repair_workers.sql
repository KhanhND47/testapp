/*
  # Create accounts for all repair workers

  1. Overview
    - Automatically creates app_users accounts for all repair_workers who don't have accounts yet
    - Uses worker's name to generate username (lowercase, no accents)
    - Sets default password to "123456"
    - Role is set to "worker"
    - Links to corresponding repair_worker via worker_id

  2. Workers without accounts (currently)
    - Kiều -> username: kieu
    - Long -> username: long
    - Quang -> username: quang
    - Vịnh -> username: vinh

  3. Important Notes
    - Only creates accounts for active repair_workers
    - Skips workers who already have accounts
    - Username conflicts are handled by adding number suffix if needed
*/

DO $$
DECLARE
  worker_record RECORD;
  new_username TEXT;
  username_exists BOOLEAN;
  suffix_counter INT;
BEGIN
  -- Loop through all active repair_workers without accounts
  FOR worker_record IN
    SELECT rw.id, rw.name
    FROM repair_workers rw
    LEFT JOIN app_users au ON au.worker_id = rw.id
    WHERE rw.is_active = true AND au.id IS NULL
  LOOP
    -- Generate username from name (lowercase, no special chars)
    new_username := lower(
      translate(
        worker_record.name,
        'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ ',
        'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooooouuuuuuuuuuuyyyyyđAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
      )
    );
    
    -- Remove spaces and special characters
    new_username := regexp_replace(new_username, '[^a-z0-9]', '', 'g');
    
    -- Check if username exists, add suffix if needed
    suffix_counter := 1;
    username_exists := EXISTS (SELECT 1 FROM app_users WHERE username = new_username);
    
    WHILE username_exists LOOP
      new_username := new_username || suffix_counter::TEXT;
      username_exists := EXISTS (SELECT 1 FROM app_users WHERE username = new_username);
      suffix_counter := suffix_counter + 1;
    END LOOP;
    
    -- Insert new app_user
    INSERT INTO app_users (username, password, display_name, role, worker_id, is_active)
    VALUES (
      new_username,
      '123456',  -- Default password (should be changed on first login)
      worker_record.name,
      'worker',
      worker_record.id,
      true
    );
    
    RAISE NOTICE 'Created account for: % (username: %)', worker_record.name, new_username;
  END LOOP;
END $$;
