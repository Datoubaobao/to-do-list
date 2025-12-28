"use client";

import { useState, useEffect } from "react";
import { Sidebar, ViewType } from "@/components/sidebar";
import { TaskList, Task } from "@/components/task-list";
import { DetailPanel } from "@/components/detail-panel";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>("today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<Array<{ id: string; name: string }>>([]);

  // 模拟数据 - 后续会被 Supabase 数据替换
  const mockTasks: Task[] = [
    {
      id: "1",
      title: "示例任务 1",
      notes: "这是一个示例任务的备注",
      priority: 2,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "示例任务 2（已完成）",
      priority: 1,
      completed: true,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // 初始化时使用模拟数据
  useEffect(() => {
    setTasks(mockTasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed,
              completed_at: completed ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              completed,
              completed_at: completed ? new Date().toISOString() : undefined,
            }
          : null
      );
    }
  };

  const handleTaskCreate = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      priority: 0,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskSave = async (updatedTask: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === updatedTask.id
          ? { ...task, ...updatedTask, updated_at: new Date().toISOString() }
          : task
      )
    );
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask((prev) =>
        prev ? { ...prev, ...updatedTask } : null
      );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        lists={lists}
      />
      <TaskList
        tasks={tasks}
        selectedTaskId={selectedTask?.id}
        onTaskSelect={handleTaskSelect}
        onTaskToggle={handleTaskToggle}
        onTaskCreate={handleTaskCreate}
      />
      <DetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={handleTaskSave}
        lists={lists}
      />
    </div>
  );
}

