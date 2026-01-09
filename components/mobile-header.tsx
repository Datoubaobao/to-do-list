"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/components/sidebar";

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentView: ViewType;
  lists?: Array<{ id: string; name: string }>;
}

export function MobileHeader({
  onMenuClick,
  currentView,
  lists = [],
}: MobileHeaderProps) {
  const getViewTitle = (view: ViewType): string => {
    if (view === "today") return "今天";
    if (view === "week") return "最近7天";
    if (view === "inbox") return "收集箱";
    const list = lists.find((l) => l.id === view);
    return list?.name || "待办管理";
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b h-14 flex items-center px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="打开菜单"
        className="h-10 w-10 mr-3"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold flex-1 truncate">
        {getViewTitle(currentView)}
      </h1>
    </header>
  );
}
