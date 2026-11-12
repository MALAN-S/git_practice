import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Check,
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
  Tag,
  Box,
  Layers,
  Shield,
  ShieldCheck,
  User,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Sliders,
  Sparkles,
  FileSpreadsheet,
  File
} from 'lucide-react';

// Intelligent Icon Resolver for Form Dropdowns
export const getFormOptionIcon = (label = '', value = '') => {
  const combined = `${label} ${value}`.toLowerCase();
  
  // Status
  if (combined.includes('active') && !combined.includes('inactive')) return CheckCircle2;
  if (combined.includes('inactive')) return XCircle;

  // Roles
  if (combined.includes('admin')) return ShieldCheck;
  if (combined.includes('staff') || combined.includes('cashier')) return User;

  // Transaction Types
  if (combined === 'in' || combined.includes('stock in')) return PlusCircle;
  if (combined === 'out' || combined.includes('stock out')) return MinusCircle;
  if (combined.includes('adjust')) return Sliders;

  // Payment Methods
  if (combined.includes('cash')) return Banknote;
  if (combined.includes('upi') || combined.includes('qr')) return QrCode;
  if (combined.includes('card')) return CreditCard;

  // Printing & Services
  if (combined.includes('single')) return FileText;
  if (combined.includes('double')) return Copy;
  if (combined.includes('a4')) return FileText;
  if (combined.includes('a3')) return FileSpreadsheet;
  if (combined.includes('a5') || combined.includes('legal')) return File;
  if (combined.includes('xerox')) return Printer;
  if (combined.includes('print') || combined.includes('color')) return Droplet;
  if (combined.includes('scan')) return Sparkles;
  if (combined.includes('laminat') || combined.includes('bind')) return Layers;

  // Product Categories
  if (combined.includes('stationer')) return Pencil;
  if (combined.includes('paper')) return FileText;
  if (combined.includes('ink') || combined.includes('toner')) return Droplet;
  if (combined.includes('electric') || combined.includes('power')) return Zap;
  if (combined.includes('rent') || combined.includes('building') || combined.includes('shop')) return Building2;
  if (combined.includes('maint') || combined.includes('machine') || combined.includes('repair')) return Wrench;
  if (combined.includes('note') || combined.includes('book')) return BookOpen;
  if (combined.includes('writing') || combined.includes('pen')) return PenLine;
  if (combined.includes('desk') || combined.includes('staple')) return Paperclip;
  if (combined.includes('file') || combined.includes('folder')) return Folder;
  if (combined.includes('electronic')) return Cpu;
  if (combined.includes('salary') || combined.includes('labor') || combined.includes('wage')) return Users;
  if (combined.includes('tea') || combined.includes('coffee') || combined.includes('food')) return Coffee;
  if (combined.includes('service') || combined.includes('other')) return Settings;

  return Tag;
};

export default function FormSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  icon: TriggerIcon,
  disabled = false,
  required = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  align = 'full' // 'full' | 'left' | 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);

  // Normalize options into { value, label, icon }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return {
        value: opt,
        label: String(opt),
        icon: getFormOptionIcon(String(opt), String(opt))
      };
    }
    const val = opt.value !== undefined ? opt.value : opt.id;
    const lbl = opt.label !== undefined ? opt.label : opt.name;
    return {
      value: val,
      label: String(lbl ?? ''),
      icon: opt.icon || getFormOptionIcon(String(lbl ?? ''), String(val ?? ''))
    };
  });

  // Selected Option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close when clicking outside
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

  // Flip upward if near bottom of viewport
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 260 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange(optValue);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 border border-slate-200 text-slate-400'
            : isOpen
            ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm text-slate-900'
            : 'bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-slate-800'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate pr-2">
          {TriggerIcon ? (
            <TriggerIcon className="w-4 h-4 text-slate-400 shrink-0" />
          ) : selectedOption?.icon ? (
            React.createElement(selectedOption.icon, {
              className: 'w-4 h-4 text-slate-400 shrink-0'
            })
          ) : (
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          )}

          <span className={`truncate ${selectedOption ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-700' : ''
          }`}
        />
      </button>

      {/* Floating Card Popover (Matches Reference Image Design) */}
      {isOpen && (
        <div
          className={`absolute ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-0 right-0'
          } z-50 min-w-[240px] bg-white rounded-3xl border border-slate-100 shadow-[0_16px_40px_-6px_rgba(0,0,0,0.15)] p-2 transition-all duration-150 animate-in fade-in zoom-in-95 ${menuClassName}`}
        >
          {/* Options List with Soft Pill Highlight & Icons */}
          <div className="py-1 max-h-60 overflow-y-auto space-y-1 pr-0.5">
            {normalizedOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const ItemIcon = opt.icon || getFormOptionIcon(opt.label, opt.value);

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm transition-all duration-150 select-none ${
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
