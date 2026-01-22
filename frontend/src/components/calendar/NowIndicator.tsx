import { useEffect, useState } from "react";
import { isToday } from "./hooks/useDateUtils";

type NowIndicatorProps = {
  selectedDate: Date;
  startHour: number;
  endHour: number;
  hourHeight: number;
};

export function NowIndicator({
  selectedDate,
  startHour,
  endHour,
  hourHeight,
}: NowIndicatorProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!isToday(selectedDate)) {
    return null;
  }

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Don't show if outside working hours
  if (currentHour < startHour || currentHour >= endHour) {
    return null;
  }

  const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;
  const top = (minutesSinceStart / 60) * hourHeight;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top }}
    >
      <div className="h-3 w-3 -translate-x-1.5 rounded-full bg-primary animate-pulse-slow" />
      <div className="h-0.5 flex-1 bg-primary animate-pulse-slow" />
    </div>
  );
}
