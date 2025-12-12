"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface SelectionContextType {
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    selectRange: (ids: string[]) => void;
    clearSelection: () => void;
    isSelected: (id: string) => boolean;
    selectionCount: number;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectRange = useCallback((ids: string[]) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.add(id));
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

    return (
        <SelectionContext.Provider
            value={{
                selectedIds,
                toggleSelection,
                selectRange,
                clearSelection,
                isSelected,
                selectionCount: selectedIds.size
            }}
        >
            {children}
        </SelectionContext.Provider>
    );
}

export function useSelection() {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error("useSelection must be used within a SelectionProvider");
    }
    return context;
}
