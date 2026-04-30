import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Zap, 
  Users, 
  UserPlus, 
  Calendar, 
  BarChart3, 
  History,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button, Card } from './ui';
import { LessonPlan, LessonStatus } from '../types';
import { cn } from '../lib/utils';

interface ActionPanelProps {
  lesson: LessonPlan;
  onStatusChange: (status: LessonStatus) => void;
  onOpenCheckIn: () => void;
  onGenerateReteach: () => void;
  onGenerateIntervention: () => void;
  onGenerateCatchUp: () => void;
  onScheduleReview: () => void;
  onAddToRevisionWeek: () => void;
  onViewProgress: () => void;
}

export function ActionPanel({ 
  lesson, 
  onStatusChange, 
  onOpenCheckIn, 
  onGenerateReteach, 
  onGenerateIntervention, 
  onGenerateCatchUp,
  onScheduleReview,
  onAddToRevisionWeek,
  onViewProgress
}: ActionPanelProps) {
  return (
    <Card className="p-6 border-indigo-100 bg-indigo-50/20 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Teaching Action Panel
        </h3>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2",
          lesson.status === 'Completed' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
          lesson.status === 'Reteach Needed' ? "bg-red-50 border-red-100 text-red-700" :
          "bg-indigo-50 border-indigo-100 text-indigo-700"
        )}>
          {lesson.status || 'Planned'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick Status Actions */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Teaching Status</div>
          <div className="flex flex-col gap-2">
            <Button 
              variant={lesson.status === 'Completed' ? 'primary' : 'secondary'} 
              className="justify-start h-12 rounded-xl"
              onClick={() => onStatusChange('Completed')}
            >
              <CheckCircle2 className="w-5 h-5 mr-3" />
              Mark as Taught
            </Button>
            <Button 
              variant={lesson.status === 'Partially Taught' ? 'primary' : 'secondary'} 
              className="justify-start h-12 rounded-xl"
              onClick={() => onStatusChange('Partially Taught')}
            >
              <Clock className="w-5 h-5 mr-3" />
              Mark as Partially Taught
            </Button>
            <Button 
              variant={lesson.status === 'Reteach Needed' ? 'primary' : 'secondary'} 
              className="justify-start h-12 rounded-xl text-red-600 hover:text-red-700"
              onClick={() => onStatusChange('Reteach Needed')}
            >
              <AlertCircle className="w-5 h-5 mr-3" />
              Mark for Reteach
            </Button>
          </div>
        </div>

        {/* AI Response Actions */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Instructional Response</div>
          <div className="flex flex-col gap-2">
            <Button 
              variant="secondary" 
              className="justify-start h-12 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 border-none"
              onClick={onGenerateReteach}
            >
              <Zap className="w-5 h-5 mr-3" />
              Generate Reteach Lesson
            </Button>
            <Button 
              variant="secondary" 
              className="justify-start h-12 rounded-xl"
              onClick={onGenerateIntervention}
            >
              <Users className="w-5 h-5 mr-3" />
              Generate Intervention Work
            </Button>
            <Button 
              variant="secondary" 
              className="justify-start h-12 rounded-xl"
              onClick={onGenerateCatchUp}
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Generate Catch-Up Work
            </Button>
          </div>
        </div>

        {/* Tracking & Planning */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking & Planning</div>
          <div className="flex flex-col gap-2">
            <Button 
              variant="secondary" 
              className="justify-start h-12 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              onClick={onOpenCheckIn}
            >
              <History className="w-5 h-5 mr-3" />
              Record Assessment Result
            </Button>
            <Button 
              variant="secondary" 
              className="justify-start h-12 rounded-xl"
              onClick={onScheduleReview}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Schedule Review
            </Button>
            <Button 
              variant="secondary" 
              className="justify-start h-12 rounded-xl"
              onClick={onViewProgress}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              View Progress Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
