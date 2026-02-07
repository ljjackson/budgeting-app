import { MONTH_NAMES } from '@/constants';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavigatorProps {
  currentMonth: number;
  currentYear: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({ currentMonth, currentYear, onPrev, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <Button variant="outline" size="icon-sm" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="w-48 text-center font-medium">
        {MONTH_NAMES[currentMonth]} {currentYear}
      </span>
      <Button variant="outline" size="icon-sm" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
