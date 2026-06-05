"use client";

import { ReactNode } from "react";

interface DynamicFieldArrayProps<T> {
  items: T[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: T) => void;
  renderItem: (item: T, index: number, onUpdate: (item: T) => void) => ReactNode;
  addButtonLabel?: string;
  emptyMessage?: string;
}

export default function DynamicFieldArray<T>({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  renderItem,
  addButtonLabel = "+ Add Item",
  emptyMessage = "No items added yet",
}: DynamicFieldArrayProps<T>) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
      ) : (
        items.map((item, index) => (
          <div key={index} className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
            {renderItem(item, index, (updatedItem) => onUpdateItem(index, updatedItem))}
            <button
              type="button"
              onClick={() => onRemoveItem(index)}
              className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 text-red-600 rounded-full hover:bg-red-100 transition-colors"
              title="Remove item"
            >
              ✕
            </button>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={onAddItem}
        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
      >
        {addButtonLabel}
      </button>
    </div>
  );
}
