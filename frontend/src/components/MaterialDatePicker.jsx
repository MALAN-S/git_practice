import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil
} from 'lucide-react';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n) => String(n).padStart(2, '0');

export default function MaterialDatePicker({
  value,
  onChange,
  onPrev,
  onNext,
  align = 'right',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial year, month, day
  const initialParts = useMemo(() => {
    try {
      if (value) {
        const [y, m, d] = value.split('-').map(Number);
        return { year: y, month: m - 1, day: d };
      }
    } catch {}
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [value]);

  const [currentYear, setCurrentYear] = useState(initialParts.year);
  const [currentMonth, setCurrentMonth] = useState(initialParts.month);
  const [tempDate, setTempDate] = useState(value);

  // Sync state when value changes or when opened
  useEffect(() => {
    setTempDate(value);
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
  }, [value, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Header display string (e.g. "Thu, Nov 12")
  const headerDateDisplay = useMemo(() => {
    try {
      if (!tempDate) return '';
      const [y, m, d] = tempDate.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return tempDate;
    }
  }, [tempDate]);

  // Trigger button formatted display (e.g. "12 Nov 2026")
  const triggerDisplay = useMemo(() => {
    try {
      if (!value) return 'Select date';
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return value;
    }
  }, [value]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const monthYearLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Calendar days grid
  const calendarDays = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const days = [];

    // Empty slots before 1st of month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days 1..N
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const handleSelectDay = (day) => {
    if (!day) return;
    const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    setTempDate(dateStr);
    if (onChange) {
      onChange(dateStr);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-3 select-none ${className}`}>
      {/* Prev Day Chevron (<) */}
      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          title="Previous day"
          className="p-1 text-slate-800 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-full transition active:scale-90 focus:outline-none"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Date Trigger with Purple Underline */}
      <div className="relative flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 pb-1 text-sm font-bold text-slate-900 hover:text-indigo-600 transition focus:outline-none group cursor-pointer"
        >
          <CalendarIcon className="w-5 h-5 text-indigo-600 shrink-0 stroke-[2.2] group-hover:scale-105 transition-transform" />
          <span className="tabular-nums tracking-tight font-bold text-[14px] text-slate-900">{triggerDisplay}</span>
        </button>
        {/* Purple Underline Bar */}
        <div className="w-full h-[2.5px] bg-indigo-600 rounded-full" />
      </div>

      {/* Next Day Chevron (>) */}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          title="Next day"
          className="p-1 text-slate-800 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-full transition active:scale-90 focus:outline-none"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Popover Card - Matched to Material 3 Design (Compact Size) */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-2 z-50 w-[250px] bg-[#f5f0fa] border border-[#e4dcf0] rounded-[22px] shadow-[0_12px_36px_rgba(0,0,0,0.15)] p-3.5 select-none animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header Section */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold text-slate-500 tracking-wide">
              Select date
            </span>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                {headerDateDisplay || 'Select date'}
              </span>
              <Pencil className="w-3.5 h-3.5 text-slate-500 stroke-[2.2] cursor-pointer hover:text-indigo-600 transition" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-[#e2d8ed] my-2" />

          {/* Month / Year Selector & Arrows */}
          <div className="flex items-center justify-between px-0.5 mb-2">
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-indigo-700 transition"
            >
              <span>{monthYearLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={prevMonth}
                title="Previous month"
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#e7dfef] transition"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                title="Next month"
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 hover:bg-[#e7dfef] transition"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-600 mb-1">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-0.5 text-center mb-0.5">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="w-7 h-7" />;
              }

              const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
              const isSelected = tempDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  onClick={() => handleSelectDay(day)}
                  className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-300/50 scale-105'
                      : isToday
                      ? 'border border-indigo-600 text-indigo-700 font-bold bg-transparent hover:bg-[#e7dfef]'
                      : 'text-slate-800 hover:bg-[#e7dfef]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

