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

  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = (y / hourHeight) * 60;
    const slotMinutes = Math.floor(totalMinutes / 15) * 15;
    const hour = startHour + Math.floor(slotMinutes / 60);
    const minute = slotMinutes % 60;

    const start = setTimeOnDate(selectedDate, hour, minute);
    const end = setTimeOnDate(selectedDate, hour, minute + 30); // Default 30 min

    onSlotClick(start, end);
  };

  return (
    <div className="relative flex">
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
              <span className="absolute -top-2.5 right-3 text-xs text-muted-foreground">
                {formatTimeShort(date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Grid area */}
      <div
        className="relative flex-1 cursor-pointer"
        onClick={handleSlotClick}
      >
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="relative border-b border-border"
            style={{ height: hourHeight }}
          >
            {/* Alternating background */}
            {index % 2 === 0 && (
              <div className="absolute inset-0 bg-muted/20" />
            )}
            {/* 15-minute lines */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-border/50"
              style={{ top: hourHeight * 0.25 }}
            />
            <div
              className="absolute left-0 right-0 border-b border-dashed border-border/50"
              style={{ top: hourHeight * 0.5 }}
            />
            <div
              className="absolute left-0 right-0 border-b border-dashed border-border/50"
              style={{ top: hourHeight * 0.75 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
