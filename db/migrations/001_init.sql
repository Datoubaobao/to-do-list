-- 基础表结构（阿里云 RDS PostgreSQL）
-- 如已有表，请先用下方“表结构检查 SQL”核对后再按需执行 ALTER。

-- 启用 uuid 扩展（如不存在）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 清单表
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 任务表（无用户字段版本）
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE,
  scheduled_date DATE,
  priority INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at();

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- 表结构检查 SQL（仅查看，不修改）
-- 查看 tasks 列：
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'tasks'
-- ORDER BY ordinal_position;

-- 查看 lists 列：
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'lists'
-- ORDER BY ordinal_position;


