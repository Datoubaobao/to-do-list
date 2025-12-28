"use client";

import { CheckSquare, Inbox, Calendar, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType = "today" | "week" | "inbox" | string;

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  lists?: Array<{ id: string; name: string; color?: string }>;
  onListSelect?: (listId: string) => void;
  onCreateList?: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  lists = [],
  onListSelect,
  onCreateList,
}: SidebarProps) {
  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">待办管理</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          <button
            onClick={() => onViewChange("today")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors",
              currentView === "today" && "bg-accent"
            )}
          >
            <CheckSquare className="h-5 w-5" />
            <span>今天</span>
          </button>

          <button
            onClick={() => onViewChange("week")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors",
              currentView === "week" && "bg-accent"
            )}
          >
            <Calendar className="h-5 w-5" />
            <span>最近7天</span>
          </button>

          <button
            onClick={() => onViewChange("inbox")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors",
              currentView === "inbox" && "bg-accent"
            )}
          >
            <Inbox className="h-5 w-5" />
            <span>收集箱</span>
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              清单
            </h2>
            {onCreateList && (
              <button
                onClick={onCreateList}
                className="p-1 hover:bg-accent rounded"
                title="新建清单"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => {
                  onViewChange(list.id);
                  onListSelect?.(list.id);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-accent transition-colors",
                  currentView === list.id && "bg-accent"
                )}
              >
                <List className="h-5 w-5" />
                <span className="flex-1 truncate">{list.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

