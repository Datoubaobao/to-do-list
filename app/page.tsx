"use client";

import { useState, useEffect, useTransition } from "react";
import { Sidebar, ViewType } from "@/components/sidebar";
import { TaskList } from "@/components/task-list";
import { DetailPanel } from "@/components/detail-panel";
import { MobileHeader } from "@/components/mobile-header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  getTasks,
  createTask,
  updateTask,
  toggleTask,
} from "@/app/actions/tasks";
import { getLists } from "@/app/actions/lists";
import type { Task } from "@/lib/types";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>("today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // 移动端 Drawer 状态
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // 从数据库加载任务和清单
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [tasksData, listsData] = await Promise.all([
          getTasks(currentView),
          getLists(),
        ]);
        setTasks(tasksData);
        setLists(listsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentView]);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    // 移动端打开详情 Drawer
    setDetailOpen(true);
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // 乐观更新
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

    // 同步到数据库
    startTransition(async () => {
      const result = await toggleTask(taskId, completed);
      if (result.error) {
        console.error("Error toggling task:", result.error);
        // 重新加载数据以恢复状态
        const tasksData = await getTasks(currentView);
        setTasks(tasksData);
      } else if (result.data) {
        // 更新本地状态
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? result.data! : task))
        );
        if (selectedTask?.id === taskId) {
          setSelectedTask(result.data);
        }
      }
    });
  };

  const handleTaskCreate = async (title: string) => {
    if (!title.trim()) return;

    // 如果当前视图是 "today"，在乐观更新中也设置 scheduled_date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    // 乐观更新
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title,
      priority: 0,
      completed: false,
      scheduled_date: currentView === "today" ? todayStr : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    // 同步到数据库，传递当前视图信息
    startTransition(async () => {
      const result = await createTask(title, undefined, currentView);
      if (result.error) {
        console.error("Error creating task:", result.error);
        // 移除乐观更新的任务
        setTasks((prev) => prev.filter((task) => task.id !== optimisticTask.id));
        alert(`创建任务失败: ${result.error}`);
      } else if (result.data) {
        // 替换临时任务为真实任务
        setTasks((prev) =>
          prev.map((task) => (task.id === optimisticTask.id ? result.data! : task))
        );
      }
    });
  };

  const handleTaskSave = async (updatedTask: Partial<Task>) => {
    if (!updatedTask.id) return;

    // 乐观更新
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

    // 同步到数据库
    startTransition(async () => {
      const result = await updateTask(updatedTask.id!, updatedTask);
      if (result.error) {
        console.error("Error updating task:", result.error);
        // 重新加载数据以恢复状态
        const tasksData = await getTasks(currentView);
        setTasks(tasksData);
        alert(`更新任务失败: ${result.error}`);
      } else if (result.data) {
        // 更新本地状态
        setTasks((prev) =>
          prev.map((task) => (task.id === updatedTask.id ? result.data! : task))
        );
        if (selectedTask?.id === updatedTask.id) {
          setSelectedTask(result.data);
        }
      }
    });
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setSelectedTask(null); // 切换视图时清除选中任务
    // 移动端切换视图后关闭侧栏 Drawer
    setSidebarOpen(false);
  };

  const handleDetailClose = () => {
    setSelectedTask(null);
    setDetailOpen(false);
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden md:h-screen">
      {/* 移动端 Header */}
      <MobileHeader
        onMenuClick={() => setSidebarOpen(true)}
        currentView={currentView}
        lists={lists}
      />

      {/* 桌面端侧栏（始终显示） */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          lists={lists}
        />
      </div>

      {/* 移动端侧栏 Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen} side="left">
        <SheetContent onClose={() => setSidebarOpen(false)}>
          <Sidebar
            currentView={currentView}
            onViewChange={handleViewChange}
            lists={lists}
          />
        </SheetContent>
      </Sheet>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pt-14 md:pt-0">
        <TaskList
          tasks={tasks}
          selectedTaskId={selectedTask?.id}
          onTaskSelect={handleTaskSelect}
          onTaskToggle={handleTaskToggle}
          onTaskCreate={handleTaskCreate}
          isLoading={isLoading || isPending}
        />

        {/* 桌面端详情面板（始终显示） */}
        <div className="hidden md:block">
          <DetailPanel
            task={selectedTask}
            onClose={handleDetailClose}
            onSave={handleTaskSave}
            lists={lists}
          />
        </div>
      </div>

      {/* 移动端详情 Drawer */}
      <Sheet
        open={detailOpen && !!selectedTask}
        onOpenChange={(open) => {
          if (!open) handleDetailClose();
        }}
        side="bottom"
      >
        <SheetContent
          onClose={handleDetailClose}
          title="任务详情"
          className="p-0"
        >
          <DetailPanel
            task={selectedTask}
            onClose={handleDetailClose}
            onSave={handleTaskSave}
            lists={lists}
            isMobile={true}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

