import { MONTH_NAMES } from '@/constants';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthNavigatorProps {
  currentMonth: number;
  currentYear: number;
  onPrev: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  className?: string;
}

export default function MonthNavigator({ currentMonth, currentYear, onPrev, onNext, canGoNext = true, className }: MonthNavigatorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 mb-4", className)}>
      <Button variant="outline" size="icon-sm" onClick={onPrev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="w-48 text-center font-medium tabular-nums">
        {MONTH_NAMES[currentMonth]} {currentYear}
      </span>
      <Button variant="outline" size="icon-sm" onClick={onNext} disabled={!canGoNext} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
