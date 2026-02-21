import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ScrollWheelProps {
    options: { label: string; value: number }[];
    value: number;
    onChange: (value: number) => void;
    width?: string;
    itemHeight?: number;
}

export function ScrollWheel({
    options,
    value,
    onChange,
    width = "w-16",
    itemHeight = 36,
}: ScrollWheelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isUserScrollingRef = useRef(false);
    const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestValueRef = useRef(value);

    latestValueRef.current = value;

    const getIndexForValue = useCallback(
        (val: number) => options.findIndex((o) => o.value === val),
        [options]
    );

    const scrollToIndex = useCallback(
        (index: number, smooth: boolean) => {
            const el = containerRef.current;
            if (!el) return;
            el.scrollTo({ top: index * itemHeight, behavior: smooth ? "smooth" : "instant" });
        },
        [itemHeight]
    );

    // Initial scroll position on mount
    useEffect(() => {
        const idx = getIndexForValue(value);
        if (idx >= 0) scrollToIndex(idx, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync when external value or options change
    useEffect(() => {
        if (isUserScrollingRef.current) return;
        const idx = getIndexForValue(value);
        if (idx >= 0) scrollToIndex(idx, false);
    }, [value, options, getIndexForValue, scrollToIndex]);

    const handleScroll = () => {
        isUserScrollingRef.current = true;
        if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
            const el = containerRef.current;
            if (!el) return;
            const snappedIndex = Math.round(el.scrollTop / itemHeight);
            const safeIndex = Math.max(0, Math.min(snappedIndex, options.length - 1));
            el.scrollTo({ top: safeIndex * itemHeight, behavior: "smooth" });
            const newValue = options[safeIndex]?.value;
            if (newValue !== undefined && newValue !== latestValueRef.current) {
                onChange(newValue);
            }
        }, 120);
    };

    return (
        <div
            className={cn("relative overflow-hidden", width)}
            style={{ height: itemHeight * 3 }}
        >
            {/* Top fade */}
            <div
                className="absolute inset-x-0 top-0 z-10 pointer-events-none bg-gradient-to-b from-background to-transparent"
                style={{ height: itemHeight }}
            />
            {/* Bottom fade */}
            <div
                className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-background to-transparent"
                style={{ height: itemHeight }}
            />
            {/* Center selection band */}
            <div
                className="absolute inset-x-0 z-0 pointer-events-none border-y border-border/40 bg-muted/10"
                style={{ top: itemHeight, height: itemHeight }}
            />

            <div
                ref={containerRef}
                className="h-full overflow-y-auto scrollbar-hidden relative z-20"
                onScroll={handleScroll}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                style={{ scrollSnapType: "y mandatory", overscrollBehaviorY: "contain" }}
            >
                <div style={{ height: itemHeight }} />
                {options.map((opt) => (
                    <div
                        key={opt.value}
                        className={cn(
                            "flex items-center justify-center text-base transition-colors cursor-pointer select-none",
                            opt.value === value
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground/70 hover:text-foreground/80"
                        )}
                        style={{ height: itemHeight, scrollSnapAlign: "center" }}
                        onClick={() => {
                            const idx = getIndexForValue(opt.value);
                            scrollToIndex(idx, true);
                            onChange(opt.value);
                        }}
                    >
                        {opt.label}
                    </div>
                ))}
                <div style={{ height: itemHeight }} />
            </div>
        </div>
    );
}

interface TimePickerWheelProps {
    date: Date;
    onChange: (date: Date) => void;
    minuteStep?: number;
    minHour?: number;
    maxHour?: number;
}

export function TimePickerWheel({
    date,
    onChange,
    minuteStep = 5,
    minHour = 0,
    maxHour = 23,
}: TimePickerWheelProps) {
    const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => ({
        label: (i + minHour).toString().padStart(2, "0"),
        value: i + minHour,
    }));

    const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => ({
        label: (i * minuteStep).toString().padStart(2, "0"),
        value: i * minuteStep,
    }));

    const currentHour = Math.max(minHour, Math.min(maxHour, date.getHours()));

    return (
        <div className="flex items-center justify-center gap-2 p-3 bg-background border border-input rounded-xl shadow-sm">
            <ScrollWheel
                options={hours}
                value={currentHour}
                onChange={(newHour) => {
                    const newDate = new Date(date);
                    newDate.setHours(newHour, date.getMinutes(), 0, 0);
                    onChange(newDate);
                }}
                width="w-14"
            />
            <span className="text-xl font-bold text-muted-foreground pb-1">:</span>
            <ScrollWheel
                options={minutes}
                value={Math.round(date.getMinutes() / minuteStep) * minuteStep % 60}
                onChange={(newMinute) => {
                    const newDate = new Date(date);
                    newDate.setHours(currentHour, newMinute, 0, 0);
                    onChange(newDate);
                }}
                width="w-14"
            />
        </div>
    );
}
