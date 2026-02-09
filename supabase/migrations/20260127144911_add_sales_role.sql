/*
  # Add Sales Role to System

  1. Changes
    - Update app_users role check constraint to include 'sales' role
    - Update RLS policies to allow sales users to:
      - View all repair orders
      - Create new repair orders
      - Update repair orders
      - View repair items
      - Create repair items
      - Update repair items
    - Sales users CANNOT:
      - Assign workers to repair items
      - View or modify worker assignments

  2. Security
    - Sales role has limited permissions focused on order management
    - Cannot access worker assignment functionality
    - All changes maintain existing RLS policies for other roles
*/

-- Drop existing constraint if it exists and recreate with sales role
DO $$
BEGIN
  -- Drop existing check constraint
  ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
  
  -- Add new constraint with sales role
  ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
    CHECK (role IN ('admin', 'worker', 'paint', 'paint_lead', 'worker_lead', 'sales'));
END $$;

-- Allow sales users to view all repair orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_orders' 
    AND policyname = 'Sales can view all repair orders'
  ) THEN
    CREATE POLICY "Sales can view all repair orders"
      ON repair_orders FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to create repair orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_orders' 
    AND policyname = 'Sales can create repair orders'
  ) THEN
    CREATE POLICY "Sales can create repair orders"
      ON repair_orders FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to update repair orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_orders' 
    AND policyname = 'Sales can update repair orders'
  ) THEN
    CREATE POLICY "Sales can update repair orders"
      ON repair_orders FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to view repair items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_items' 
    AND policyname = 'Sales can view repair items'
  ) THEN
    CREATE POLICY "Sales can view repair items"
      ON repair_items FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to create repair items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_items' 
    AND policyname = 'Sales can create repair items'
  ) THEN
    CREATE POLICY "Sales can create repair items"
      ON repair_items FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to update repair items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_items' 
    AND policyname = 'Sales can update repair items'
  ) THEN
    CREATE POLICY "Sales can update repair items"
      ON repair_items FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to view repair item images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_item_images' 
    AND policyname = 'Sales can view repair item images'
  ) THEN
    CREATE POLICY "Sales can view repair item images"
      ON repair_item_images FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Allow sales users to create repair item images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'repair_item_images' 
    AND policyname = 'Sales can create repair item images'
  ) THEN
    CREATE POLICY "Sales can create repair item images"
      ON repair_item_images FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM app_users
          WHERE app_users.id = auth.uid()
          AND app_users.role = 'sales'
          AND app_users.is_active = true
        )
      );
  END IF;
END $$;

-- Note: Sales users explicitly CANNOT access repair_item_workers table
-- No policies are created for this table for sales role