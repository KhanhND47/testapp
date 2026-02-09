/*
  # Tạo schema cho module Marketing

  ## Mô tả
  Module Marketing cho phép lập kế hoạch và theo dõi tiến độ sản xuất video truyền thông
  cho gara sửa chữa ô tô với 3 tuyến nội dung: Sơn xe, Sửa chữa, Bảo dưỡng.

  ## Bảng mới

  ### marketing_staff
  Quản lý danh sách nhân viên marketing
  - `id` (uuid, primary key)
  - `name` (text) - Tên nhân viên
  - `role` (text) - Vai trò
  - `is_active` (boolean) - Trạng thái hoạt động
  - `created_at` (timestamptz)

  ### marketing_goals
  Quản lý mục tiêu số lượng video theo kỳ
  - `id` (uuid, primary key)
  - `period_name` (text) - Tên kỳ (vd: Q1 2024)
  - `period_start` (date) - Ngày bắt đầu kỳ
  - `period_end` (date) - Ngày kết thúc kỳ
  - `paint_target` (integer) - Mục tiêu tuyến Sơn xe
  - `repair_target` (integer) - Mục tiêu tuyến Sửa chữa
  - `maintenance_target` (integer) - Mục tiêu tuyến Bảo dưỡng
  - `created_at` (timestamptz)

  ### marketing_videos
  Quản lý kế hoạch và trạng thái video
  - `id` (uuid, primary key)
  - `title` (text) - Tên video
  - `content_line` (text) - Tuyến nội dung: PAINT/REPAIR/MAINTENANCE
  - `content_tag` (text) - Loại nội dung: AD/BRAND
  - `plan_start_date` (date) - Ngày bắt đầu dự kiến
  - `plan_end_date` (date) - Ngày kết thúc dự kiến
  - `description` (text) - Mô tả
  - `status` (text) - Trạng thái: DRAFT/IN_PROGRESS/DONE
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### marketing_stages
  Quản lý các công đoạn thực hiện video
  - `id` (uuid, primary key)
  - `video_id` (uuid, foreign key) - ID video
  - `stage_type` (text) - Loại công đoạn: SCRIPT/SHOOT/EDIT/PUBLISH
  - `stage_order` (integer) - Thứ tự công đoạn
  - `status` (text) - Trạng thái: NOT_STARTED/IN_PROGRESS/COMPLETED
  - `assignee_id` (uuid, foreign key) - Người thực hiện
  - `started_at` (timestamptz) - Thời gian bắt đầu
  - `completed_at` (timestamptz) - Thời gian hoàn thành
  - `script_text` (text) - Kịch bản (cho SCRIPT stage)
  - `video_url` (text) - Link video (cho PUBLISH stage)
  - `created_at` (timestamptz)

  ## Security
  Bật RLS cho tất cả các bảng và tạo policies cho authenticated users
*/

-- Tạo bảng marketing_staff
CREATE TABLE IF NOT EXISTS marketing_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT 'Marketing Staff',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marketing staff"
  ON marketing_staff FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketing staff"
  ON marketing_staff FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tạo bảng marketing_goals
CREATE TABLE IF NOT EXISTS marketing_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  paint_target integer DEFAULT 0,
  repair_target integer DEFAULT 0,
  maintenance_target integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marketing goals"
  ON marketing_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketing goals"
  ON marketing_goals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tạo bảng marketing_videos
CREATE TABLE IF NOT EXISTS marketing_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_line text NOT NULL CHECK (content_line IN ('PAINT', 'REPAIR', 'MAINTENANCE')),
  content_tag text NOT NULL CHECK (content_tag IN ('AD', 'BRAND')),
  plan_start_date date NOT NULL,
  plan_end_date date NOT NULL CHECK (plan_end_date >= plan_start_date),
  description text,
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'DONE')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marketing videos"
  ON marketing_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketing videos"
  ON marketing_videos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tạo bảng marketing_stages
CREATE TABLE IF NOT EXISTS marketing_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES marketing_videos(id) ON DELETE CASCADE,
  stage_type text NOT NULL CHECK (stage_type IN ('SCRIPT', 'SHOOT', 'EDIT', 'PUBLISH')),
  stage_order integer NOT NULL CHECK (stage_order >= 1 AND stage_order <= 4),
  status text DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  assignee_id uuid REFERENCES marketing_staff(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  script_text text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, stage_type)
);

ALTER TABLE marketing_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view marketing stages"
  ON marketing_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketing stages"
  ON marketing_stages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Thêm index để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_marketing_videos_content_line ON marketing_videos(content_line);
CREATE INDEX IF NOT EXISTS idx_marketing_videos_status ON marketing_videos(status);
CREATE INDEX IF NOT EXISTS idx_marketing_stages_video_id ON marketing_stages(video_id);
CREATE INDEX IF NOT EXISTS idx_marketing_stages_stage_order ON marketing_stages(stage_order);

-- Thêm dữ liệu mẫu nhân viên marketing
INSERT INTO marketing_staff (name, role, is_active) VALUES
  ('Nguyễn Văn A', 'Content Creator', true),
  ('Trần Thị B', 'Video Editor', true),
  ('Lê Văn C', 'Cameraman', true),
  ('Phạm Thị D', 'Marketing Manager', true),
  ('Hoàng Văn E', 'Content Creator', true)
ON CONFLICT DO NOTHING;
