"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  due_date?: string;
  scheduled_date?: string;
  priority: number;
  completed: boolean;
  completed_at?: string;
  list_id?: string;
  created_at: string;
  updated_at: string;
}

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect: (task: Task) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskCreate: (title: string) => void;
  isLoading?: boolean;
}

export function TaskList({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTaskToggle,
  onTaskCreate,
  isLoading,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onTaskCreate(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <div className="p-4 border-b">
        <form onSubmit={handleCreateTask} className="flex items-center gap-2">
          <button
            type="submit"
            className="p-2 hover:bg-accent rounded"
            title="添加任务"
          >
            <Plus className="h-5 w-5" />
          </button>
          <Input
            type="text"
            placeholder="添加新任务..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1"
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">暂无任务</p>
              <p className="text-sm">在上方输入框添加新任务</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskSelect(task)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                  selectedTaskId === task.id && "bg-accent border-primary",
                  task.completed && "opacity-60"
                )}
              >
                <Checkbox
                  checked={task.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    onTaskToggle(task.id, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-medium",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </div>
                  {task.notes && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.notes}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {task.due_date && (
                      <span>
                        {new Date(task.due_date).toLocaleDateString("zh-CN")}
                      </span>
                    )}
                    {task.priority > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                        P{task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

