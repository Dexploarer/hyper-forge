import React from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent, EmptyState } from "./";

export interface GeneratedItemListProps<T> {
  items: T[];
  selectedItem: T | null;
  onItemSelect: (item: T) => void;
  title: React.ReactNode;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  className?: string;
  cardClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  getItemKey: (item: T) => string | number;
}

export function GeneratedItemList<T>({
  items,
  selectedItem,
  onItemSelect,
  title,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  renderItem,
  className,
  cardClassName,
  headerClassName,
  contentClassName,
  getItemKey,
}: GeneratedItemListProps<T>) {
  return (
    <Card className={cardClassName}>
      <CardHeader className={headerClassName}>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>
        {items.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            iconSize={48}
          />
        ) : (
          items.map((item) => {
            const key = getItemKey(item);
            const isSelected = selectedItem
              ? getItemKey(selectedItem) === key
              : false;

            return (
              <div
                key={key}
                onClick={() => onItemSelect(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onItemSelect(item);
                  }
                }}
              >
                {renderItem(item, isSelected)}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
