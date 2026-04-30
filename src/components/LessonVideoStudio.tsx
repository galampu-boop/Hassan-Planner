import React, { useState, useMemo } from 'react';
import { 
  Video, 
  Search, 
  Filter, 
  Play, 
  Download, 
  Share2, 
  MoreVertical, 
  Plus, 
  Sparkles,
  ChevronRight,
  FileVideo,
  Clock,
  User,
  Layers,
  Presentation,
  ExternalLink,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Button, Card, Input, Badge } from './ui';
import { LessonPlan, VideoMode, VideoLength, VoiceGender, VoiceTone, VoicePace, AvatarStyle, AvatarPlacement } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonVideoStudioProps {
  lessonPlans: LessonPlan[];
  onGenerateVideo: (
    plan: LessonPlan, 
    mode: VideoMode, 
    length: VideoLength, 
    voiceSettings: { gender: VoiceGender; tone: VoiceTone; pace: VoicePace },
    avatarSettings: { enabled: boolean; style: AvatarStyle; placement: AvatarPlacement }
  ) => Promise<void>;
  onViewLesson: (plan: LessonPlan) => void;
  isGenerating?: boolean;
}

export function LessonVideoStudio({ lessonPlans, onGenerateVideo, onViewLesson, isGenerating }: LessonVideoStudioProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'generated' | 'pending'>('all');
  const [selectedVideo, setSelectedVideo] = useState<LessonPlan | null>(null);

  const filteredPlans = useMemo(() => {
    return lessonPlans.filter(plan => {
      const matchesSearch = plan.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          plan.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterMode === 'all' || 
                          (filterMode === 'generated' && !!plan.lessonVideo) ||
                          (filterMode === 'pending' && !plan.lessonVideo);
      return matchesSearch && matchesFilter;
    });
  }, [lessonPlans, searchQuery, filterMode]);

  const stats = useMemo(() => {
    const generated = lessonPlans.filter(p => !!p.lessonVideo).length;
    return {
      total: lessonPlans.length,
      generated,
      pending: lessonPlans.length - generated
    };
  }, [lessonPlans]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Video className="w-7 h-7" />
            </div>
            Lesson Video Studio
          </h1>
          <p className="text-gray-500 font-medium">Manage and generate AI-powered teaching videos for your lessons.</p>
        </div>

        <div className="flex gap-4">
          <Card className="px-4 py-2 flex items-center gap-3 bg-white border-gray-100">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generated</p>
              <p className="text-lg font-black text-gray-900">{stats.generated}</p>
            </div>
          </Card>
          <Card className="px-4 py-2 flex items-center gap-3 bg-white border-gray-100">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
              <p className="text-lg font-black text-gray-900">{stats.pending}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Search lessons by title or subject..." 
            className="pl-12 h-14 bg-white border-gray-100 rounded-2xl shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'generated', 'pending'] as const).map(mode => (
            <Button
              key={mode}
              variant={filterMode === mode ? 'primary' : 'outline'}
              onClick={() => setFilterMode(mode)}
              className={cn(
                "h-14 px-6 rounded-2xl font-bold capitalize",
                filterMode === mode ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border-gray-100"
              )}
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPlans.map((plan) => (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="group overflow-hidden border-gray-100 hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-50 flex flex-col h-full">
                {/* Thumbnail Area */}
                <div className="aspect-video bg-slate-900 relative overflow-hidden">
                  {plan.lessonVideo ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <Badge className="bg-indigo-600 text-white border-none text-[10px] uppercase font-black tracking-widest">
                          {plan.lessonVideo.length}
                        </Badge>
                        <Badge className="bg-black/40 text-white backdrop-blur-md border-none text-[10px] uppercase font-black tracking-widest">
                          {plan.lessonVideo.mode}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 space-y-2">
                      <Video className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">No Video Generated</p>
                    </div>
                  )}
                  
                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    {plan.lessonVideo ? (
                      <>
                        <Button size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50" onClick={() => onViewLesson(plan)}>
                          <Play className="w-4 h-4 mr-2" />
                          Watch
                        </Button>
                        <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/10">
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => onViewLesson(plan)}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-grow space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{plan.subject}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grade {plan.grade}</p>
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{plan.lessonTitle}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                    {plan.lessonVideo && (
                      <div className={cn(
                        "flex items-center gap-1 font-bold",
                        plan.lessonVideo.videoStatus === 'completed' ? "text-emerald-600" : "text-amber-600"
                      )}>
                        <RefreshCw className={cn("w-3 h-3", plan.lessonVideo.videoStatus === 'rendering' && "animate-spin")} />
                        {(plan.lessonVideo.videoStatus || 'draft').replace('_', ' ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-indigo-600" onClick={() => onViewLesson(plan)}>
                    View Lesson
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-indigo-600">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPlans.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">No lessons found</h3>
              <p className="text-gray-500">Try adjusting your search or filters.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterMode('all'); }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
