/*
  # Add priority-in-day and workload engagement tracking for assigned workers

  1. Changes
    - Add `priority_marked_at` to mark an assignment as "Uu Tien Trong Ngay"
    - Add `workload_engaged_at` to mark when assignment starts consuming daily capacity
    - Add `workload_engaged_by` to record trigger source: start | priority

  2. Purpose
    - Daily worker capacity (8h) should only be reduced when:
      - worker starts the task, or
      - lead/admin marks task as priority-in-day
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'repair_item_assigned_workers'
      AND column_name = 'priority_marked_at'
  ) THEN
    ALTER TABLE repair_item_assigned_workers
    ADD COLUMN priority_marked_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'repair_item_assigned_workers'
      AND column_name = 'workload_engaged_at'
  ) THEN
    ALTER TABLE repair_item_assigned_workers
    ADD COLUMN workload_engaged_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'repair_item_assigned_workers'
      AND column_name = 'workload_engaged_by'
  ) THEN
    ALTER TABLE repair_item_assigned_workers
    ADD COLUMN workload_engaged_by text
    CHECK (
      workload_engaged_by IS NULL OR
      workload_engaged_by IN ('start', 'priority')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_repair_item_assigned_workers_workload_engaged_at
  ON repair_item_assigned_workers(workload_engaged_at);

CREATE INDEX IF NOT EXISTS idx_repair_item_assigned_workers_priority_marked_at
  ON repair_item_assigned_workers(priority_marked_at);

