"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "./task-list";
import { format } from "date-fns";

interface DetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  lists?: Array<{ id: string; name: string }>;
}

export function DetailPanel({
  task,
  onClose,
  onSave,
  lists = [],
}: DetailPanelProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState(0);
  const [listId, setListId] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || "");
      setDueDate(task.due_date || "");
      setScheduledDate(task.scheduled_date || "");
      setPriority(task.priority);
      setListId(task.list_id || "");
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    await onSave({
      id: task.id,
      title,
      notes,
      due_date: dueDate || undefined,
      scheduled_date: scheduledDate || undefined,
      priority,
      list_id: listId || undefined,
    });
  };

  if (!task) {
    return (
      <div className="w-80 border-l bg-card h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>选择一个任务查看详情</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-card h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">任务详情</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="任务标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="任务备注..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="list">所属清单</Label>
              <Select
                id="list"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                <option value="">收集箱</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              >
                <option value="0">P0 - 无</option>
                <option value="1">P1 - 低</option>
                <option value="2">P2 - 中</option>
                <option value="3">P3 - 高</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">截止日期</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">计划日期</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>状态信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">完成状态:</span>
              <span>{task.completed ? "已完成" : "未完成"}</span>
            </div>
            {task.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">完成时间:</span>
                <span>
                  {format(new Date(task.completed_at), "yyyy-MM-dd HH:mm")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间:</span>
              <span>
                {format(new Date(task.created_at), "yyyy-MM-dd HH:mm")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">更新时间:</span>
              <span>
                {format(new Date(task.updated_at), "yyyy-MM-dd HH:mm")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t">
        <Button onClick={handleSave} className="w-full">
          保存更改
        </Button>
      </div>
    </div>
  );
}

