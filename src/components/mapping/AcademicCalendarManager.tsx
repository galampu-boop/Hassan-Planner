import React from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  CalendarDays,
  Target,
  Layers,
  Activity,
  BarChart3,
  Settings,
  Upload,
  Info
} from 'lucide-react';
import { Card, Button, Input } from '../ui';
import { AcademicCalendar, AcademicEvent } from '../../types';

interface AcademicCalendarManagerProps {
  calendar: AcademicCalendar | null;
  onUpdate: (calendar: AcademicCalendar) => void;
}

export const AcademicCalendarManager: React.FC<AcademicCalendarManagerProps> = ({ calendar, onUpdate }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [newEvent, setNewEvent] = React.useState<Partial<AcademicEvent>>({
    title: '',
    type: 'Holiday',
    startDate: '',
    endDate: '',
    isTeachingDay: false
  });

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '0 weeks';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    
    if (weeks === 0) return `${diffDays} days`;
    if (remainingDays === 0) return `${weeks} weeks`;
    return `${weeks} weeks, ${remainingDays} days`;
  };

  const handleUpdateCycle = (index: number, field: string, value: any) => {
    const updatedCycles = [...calendar.cycles];
    updatedCycles[index] = { ...updatedCycles[index], [field]: value };
    onUpdate({ ...calendar, cycles: updatedCycles });
  };

  if (!calendar) {
    return (
      <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-indigo-50 rounded-full">
          <Calendar className="w-12 h-12 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">No Academic Calendar Found</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            Upload or create your school academic calendar to drive all curriculum pacing and scheduling.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => onUpdate({
              schoolYear: '2025-2026',
              startDate: '2025-09-01',
              endDate: '2026-06-30',
              cycles: [
                { number: 1, label: 'Cycle 1', startDate: '2025-09-01', endDate: '2025-11-30' },
                { number: 2, label: 'Cycle 2', startDate: '2025-12-01', endDate: '2026-03-15' },
                { number: 3, label: 'Cycle 3', startDate: '2026-03-16', endDate: '2026-06-30' }
              ],
              events: [],
              createdBy: 'System'
            })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Default Calendar
          </Button>
          <Button variant="outline" className="border-slate-200 hover:border-indigo-200 hover:text-indigo-600">
            <Upload className="w-5 h-5 mr-2" />
            Upload PDF/Image
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Overview & Cycle Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">School Year Info</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Settings className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">School Year</p>
                {isEditing ? (
                  <Input 
                    value={calendar.schoolYear} 
                    onChange={(e) => onUpdate({ ...calendar, schoolYear: e.target.value })}
                    className="text-sm font-bold"
                  />
                ) : (
                  <p className="text-lg font-black text-slate-900">{calendar.schoolYear}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</p>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={calendar.startDate} 
                      onChange={(e) => onUpdate({ ...calendar, startDate: e.target.value })}
                      className="text-xs"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{calendar.startDate}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</p>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={calendar.endDate} 
                      onChange={(e) => onUpdate({ ...calendar, endDate: e.target.value })}
                      className="text-xs"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{calendar.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Cycle Tracking</h3>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="space-y-4">
              {calendar.cycles.map((cycle, idx) => (
                <div key={cycle.number} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    {isEditing ? (
                      <Input 
                        value={cycle.label || `Cycle ${cycle.number}`}
                        onChange={(e) => handleUpdateCycle(idx, 'label', e.target.value)}
                        className="text-xs font-bold bg-white h-7 py-0"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-900">{cycle.label || `Cycle ${cycle.number}`}</span>
                    )}
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black rounded uppercase tracking-tighter">
                      {calculateDuration(cycle.startDate, cycle.endDate)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Start</p>
                      {isEditing ? (
                        <Input 
                          type="date"
                          value={cycle.startDate}
                          onChange={(e) => handleUpdateCycle(idx, 'startDate', e.target.value)}
                          className="text-[10px] h-7 py-0"
                        />
                      ) : (
                        <p className="text-[10px] font-medium text-slate-600">{cycle.startDate}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">End</p>
                      {isEditing ? (
                        <Input 
                          type="date"
                          value={cycle.endDate}
                          onChange={(e) => handleUpdateCycle(idx, 'endDate', e.target.value)}
                          className="text-[10px] h-7 py-0"
                        />
                      ) : (
                        <p className="text-[10px] font-medium text-slate-600">{cycle.endDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isEditing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200"
                  onClick={() => onUpdate({
                    ...calendar,
                    cycles: [...calendar.cycles, { 
                      number: calendar.cycles.length + 1, 
                      label: `Cycle ${calendar.cycles.length + 1}`,
                      startDate: '', 
                      endDate: '' 
                    }]
                  })}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Cycle
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Events List */}
        <Card className="p-6 bg-white border-slate-200 md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">Academic Events & Holidays</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">{calendar.events.length} Events</span>
            </div>
            <Button size="sm" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Event
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {calendar.events.sort((a, b) => a.startDate.localeCompare(b.startDate)).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    event.type === 'Holiday' ? "bg-red-50 text-red-500" :
                    event.type === 'Break' ? "bg-amber-50 text-amber-500" :
                    event.type === 'Exam' ? "bg-blue-50 text-blue-500" :
                    event.type === 'PD Day' ? "bg-indigo-50 text-indigo-500" :
                    "bg-slate-50 text-slate-500"
                  )}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{event.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.startDate} {event.endDate && `- ${event.endDate}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {event.type}
                      </span>
                      {!event.isTeachingDay && (
                        <span className="text-red-500 font-bold uppercase">No School</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {calendar.events.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                No events or holidays added yet.
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg border border-amber-200 shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-800 mb-1">Planning Rule Active</h4>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                The mapping engine will automatically skip all <span className="font-bold">No School</span> days during yearly and weekly planning. Lessons will never be scheduled on holidays or breaks.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
