import { formatTimeShort, setTimeOnDate } from "./hooks/useDateUtils";

type TimeGridProps = {
  startHour: number;
  endHour: number;
  hourHeight: number;
  selectedDate: Date;
  onSlotClick: (start: Date, end: Date) => void;
};

export function TimeGrid({
  startHour,
  endHour,
  hourHeight,
  selectedDate,
  onSlotClick,
}: TimeGridProps) {
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );

  const slotHeight = hourHeight / 4; // 15-minute slots

  const handleSlotClick = (hour: number, quarterIndex: number) => {
    const minute = quarterIndex * 15;
    const start = setTimeOnDate(selectedDate, hour, minute);
    const end = setTimeOnDate(selectedDate, hour, minute + 30); // Default 30 min
    onSlotClick(start, end);
  };

  return (
    <div className="relative flex pt-3">
      {/* Time labels column */}
      <div className="relative w-16 flex-shrink-0 border-r border-border">
        {hours.map((hour) => {
          const date = new Date();
          date.setHours(hour, 0, 0, 0);
          return (
            <div
              key={hour}
              className="relative"
              style={{ height: hourHeight }}
            >
              <span className="absolute -top-2 right-3 text-xs text-muted-foreground">
                {formatTimeShort(date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid area */}
      <div className="relative flex-1" data-time-grid-hours>
        {hours.map((hour, hourIndex) => (
          <div
            key={hour}
            data-hour={hour}
            className="relative border-b border-border"
            style={{ height: hourHeight }}
          >
            {/* Alternating background */}
            {hourIndex % 2 === 0 && (
              <div className="absolute inset-0 bg-muted/20 pointer-events-none" />
            )}

            {/* 15-minute clickable slots */}
            {[0, 1, 2, 3].map((quarterIndex) => (
              <button
                key={quarterIndex}
                type="button"
                onClick={() => handleSlotClick(hour, quarterIndex)}
                className="absolute left-0 right-0 cursor-pointer hover:bg-primary/10 active:bg-primary/8 transition-colors group"
                style={{
                  top: quarterIndex * slotHeight,
                  height: slotHeight,
                }}
              >
                {/* Show time hint on hover (desktop only via hoverOnlyWhenSupported) */}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {hour.toString().padStart(2, "0")}:{(quarterIndex * 15).toString().padStart(2, "0")}
                </span>
              </button>
            ))}

            {/* 15-minute lines (visual only) */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-border/50 pointer-events-none"
              style={{ top: hourHeight * 0.25 }}
            />
            <div
              className="absolute left-0 right-0 border-b border-dashed border-border/50 pointer-events-none"
              style={{ top: hourHeight * 0.5 }}
            />
            <div
              className="absolute left-0 right-0 border-b border-dashed border-border/50 pointer-events-none"
              style={{ top: hourHeight * 0.75 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
