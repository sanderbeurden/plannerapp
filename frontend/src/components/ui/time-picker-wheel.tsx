import { useEffect, useRef, useState, useCallback } from "react";
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
    itemHeight = 36
}: ScrollWheelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<number | null>(null);

    const scrollToValue = useCallback((val: number, smooth = false) => {
        if (!containerRef.current) return;
        const index = options.findIndex((opt) => opt.value === val);
        if (index >= 0) {
            containerRef.current.scrollTo({
                top: index * itemHeight,
                behavior: smooth ? "smooth" : "auto",
            });
        }
    }, [options, itemHeight]);

    // Sync external value changes (only if not currently scrolling)
    useEffect(() => {
        if (!isScrolling) {
            scrollToValue(value);
        }
    }, [value, isScrolling, scrollToValue]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            window.clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = window.setTimeout(() => {
            setIsScrolling(false);
            const index = Math.round(containerRef.current!.scrollTop / itemHeight);
            const safeIndex = Math.max(0, Math.min(index, options.length - 1));

            const newValue = options[safeIndex].value;
            if (newValue !== value) {
                onChange(newValue);
            }

            // Snap to exact position if slightly off
            containerRef.current?.scrollTo({
                top: safeIndex * itemHeight,
                behavior: "smooth"
            });

        }, 150);
    };

    return (
        <div
            className={cn("relative overflow-hidden", width)}
            style={{ height: itemHeight * 3 }}
        >
            {/* Top and bottom gradients for fade effect */}
            <div
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none"
                style={{ height: itemHeight }}
            />
            <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none"
                style={{ height: itemHeight }}
            />

            {/* Selection highlight (center) */}
            <div
                className="absolute inset-x-0 border-y border-border/40 bg-muted/10 z-0 pointer-events-none"
                style={{ top: itemHeight, height: itemHeight }}
            />

            <div
                ref={containerRef}
                className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hidden z-20 relative"
                onScroll={handleScroll}
                style={{ scrollBehavior: "smooth" }}
            >
                <div style={{ height: itemHeight }} /> {/* Top padding so first item can be centered */}
                {options.map((opt) => (
                    <div
                        key={opt.value}
                        className={cn(
                            "flex items-center justify-center snap-center text-base transition-colors cursor-pointer select-none",
                            opt.value === value ? "text-foreground font-semibold" : "text-muted-foreground/70 hover:text-foreground/80"
                        )}
                        style={{ height: itemHeight }}
                        onClick={() => {
                            onChange(opt.value);
                            scrollToValue(opt.value, true);
                        }}
                    >
                        {opt.label}
                    </div>
                ))}
                <div style={{ height: itemHeight }} /> {/* Bottom padding */}
            </div>
        </div>
    );
}

interface TimePickerWheelProps {
    date: Date;
    onChange: (date: Date) => void;
    minuteStep?: number;
}

export function TimePickerWheel({ date, onChange, minuteStep = 15 }: TimePickerWheelProps) {
    const hours = Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, "0"),
        value: i,
    }));

    const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => ({
        label: (i * minuteStep).toString().padStart(2, "0"),
        value: i * minuteStep,
    }));

    const handleHourChange = (newHour: number) => {
        const newDate = new Date(date);
        newDate.setHours(newHour);
        onChange(newDate);
    };

    const handleMinuteChange = (newMinute: number) => {
        const newDate = new Date(date);
        newDate.setMinutes(newMinute);
        onChange(newDate);
    };

    return (
        <div className="flex items-center justify-center gap-2 p-3 bg-background border border-input rounded-xl shadow-sm">
            <ScrollWheel
                options={hours}
                value={date.getHours()}
                onChange={handleHourChange}
                width="w-14"
            />
            <span className="text-xl font-bold text-muted-foreground pb-1">:</span>
            <ScrollWheel
                options={minutes}
                value={date.getMinutes()}
                onChange={handleMinuteChange}
                width="w-14"
            />
        </div>
    );
}
