import React, { useState, useRef, useEffect } from 'react';
import {
  Filter,
  ChevronDown,
  Search,
  Check,
  X,
  LayoutGrid,
  Pencil,
  FileText,
  Printer,
  Droplet,
  Zap,
  Building2,
  Wrench,
  BookOpen,
  PenLine,
  Paperclip,
  Folder,
  Cpu,
  Users,
  Coffee,
  Banknote,
  QrCode,
  CreditCard,
  Settings,
  Tag
} from 'lucide-react';

// Intelligent Icon Resolver for Categories & Filters
export const getFilterIcon = (label = '') => {
  if (!label) return LayoutGrid;
  const l = label.toLowerCase();
  if (l.includes('all')) return LayoutGrid;
  if (l.includes('stationer')) return Pencil;
  if (l.includes('paper') && !l.includes('print')) return FileText;
  if (l.includes('ink') || l.includes('toner')) return Droplet;
  if (l.includes('xerox')) return Printer;
  if (l.includes('color') || l.includes('printing')) return Droplet;
  if (l.includes('electric') || l.includes('power')) return Zap;
  if (l.includes('rent') || l.includes('shop') || l.includes('building')) return Building2;
  if (l.includes('maint') || l.includes('machine') || l.includes('repair')) return Wrench;
  if (l.includes('note') || l.includes('book')) return BookOpen;
  if (l.includes('writing') || l.includes('pen')) return PenLine;
  if (l.includes('desk') || l.includes('staple') || l.includes('accessor')) return Paperclip;
  if (l.includes('file') || l.includes('folder')) return Folder;
  if (l.includes('electronic')) return Cpu;
  if (l.includes('salary') || l.includes('labor') || l.includes('wage')) return Users;
  if (l.includes('tea') || l.includes('refresh') || l.includes('food') || l.includes('coffee')) return Coffee;
  if (l.includes('cash')) return Banknote;
  if (l.includes('upi') || l.includes('qr')) return QrCode;
  if (l.includes('card')) return CreditCard;
  if (l.includes('service') || l.includes('other')) return Settings;
  return Tag;
};

export default function SearchableFilterDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'All Categories',
  triggerIcon: TriggerIcon = Filter,
  searchable = false,
  searchPlaceholder = 'Search...',
  align = 'right', // Default to right alignment so popovers stay cleanly within cards
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

  // Close on Escape key
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

  // Selected Option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button (Material Style Floating Pill) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border transition duration-150 select-none shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
          isOpen
            ? 'border-blue-500 shadow-md ring-2 ring-blue-500/10'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <TriggerIcon className="w-4 h-4 text-slate-500 shrink-0 stroke-[1.8]" />
        <span className="text-xs font-bold text-slate-800 tracking-tight max-w-[140px] truncate">
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Floating Popover Menu (Material Card matching reference) */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 ${
            align === 'left' ? 'left-0' : 'right-0'
          } z-50 w-64 bg-white rounded-3xl border border-slate-100 shadow-[0_16px_40px_-6px_rgba(0,0,0,0.15)] p-2 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Integrated Search Box (disabled by default: "search no need") */}
          {searchable && (
            <div className="p-1 pb-2 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/70 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="py-1 max-h-60 overflow-y-auto space-y-1 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const ItemIcon = opt.icon || getFilterIcon(opt.label);

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-150 select-none ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-950 font-bold shadow-[0_1px_3px_rgba(79,70,229,0.08)]'
                        : 'text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-950 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isSelected
                            ? 'text-indigo-700 stroke-[2.2]'
                            : 'text-slate-400 group-hover:text-indigo-700 stroke-[1.8]'
                        }`}
                      />
                      <span className="truncate tracking-tight">{opt.label}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-700 stroke-[2.5] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
