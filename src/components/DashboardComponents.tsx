import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from './ui';
import { cn } from '../lib/utils';

export function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <Card className="p-6 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', color)}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: cn('w-6 h-6', (icon as React.ReactElement<any>).props.className) }) : icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
      </div>
    </Card>
  );
}

export function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group',
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
      )}
    >
      <span className={cn('transition-colors shrink-0', active ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600')}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: cn('w-5 h-5', (icon as React.ReactElement<any>).props.className) }) : icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function QuickAction({ icon, title, desc, onClick, color }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 transition-all duration-300 group text-left"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 shrink-0', color)}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: cn('w-6 h-6', (icon as React.ReactElement<any>).props.className) }) : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
    </button>
  );
}
