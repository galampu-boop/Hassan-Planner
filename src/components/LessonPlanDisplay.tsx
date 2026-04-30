import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Target, 
  ListChecks, 
  Layers, 
  MessageSquare, 
  CheckCircle2, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  XCircle, 
  Printer, 
  Download, 
  ChevronDown,
  Sparkles,
  StickyNote,
  FileText,
  Presentation,
  BookOpen,
  Eye,
  EyeOff,
  ClipboardList,
  Package,
  FileQuestion,
  Image as ImageIcon,
  User,
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  CheckSquare,
  Square,
  History,
  BarChart3,
  Video,
  Play,
  Settings,
  Settings2,
  Volume2,
  MonitorPlay,
  Share2,
  FileVideo,
  ExternalLink,
  Loader2,
  Mic,
  Users,
  PenTool,
  HelpCircle,
  Home
} from 'lucide-react';
import Markdown from 'react-markdown';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, Card, LessonStatusBadge, Badge, DropdownMenu, Tabs, TabsList, TabsTrigger, TabsContent } from './ui';
import { LessonPlan, LessonStatus, LessonResource, VideoMode, VideoLength, VoiceGender, VoiceTone, VoicePace, AvatarStyle, AvatarPlacement, handleFirestoreError, OperationType } from '../types';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LessonVideoPlayer } from './LessonVideoPlayer';
import { ActionPanel } from './ActionPanel';

interface LessonPlanDisplayProps {
  plan: LessonPlan;
  hideActions?: boolean;
  onStatusChange?: (status: LessonStatus) => Promise<void>;
  onGenerateResource?: (plan: LessonPlan, type: string) => Promise<void>;
  onGenerateFullPack?: (plan: LessonPlan) => Promise<void>;
  onUpdatePlan?: (plan: LessonPlan) => Promise<void>;
  onOpenCheckIn?: () => void;
  onGenerateReteach?: () => void;
  onGenerateIntervention?: () => void;
  onGenerateCatchUp?: () => void;
  onScheduleReview?: () => void;
  onAddToRevisionWeek?: () => void;
  onViewProgress?: () => void;
  onGenerateVideo?: (
    plan: LessonPlan, 
    mode: VideoMode, 
    length: VideoLength, 
    voiceSettings: { gender: VoiceGender; tone: VoiceTone; pace: VoicePace },
    avatarSettings: { enabled: boolean; style: AvatarStyle; placement: AvatarPlacement }
  ) => Promise<void>;
  onRenderVideo?: (plan: LessonPlan) => Promise<void>;
  isGenerating?: boolean;
  parentCollection?: 'lesson_plans' | 'daily_lesson_plans' | 'resources';
}

export function LessonPlanDisplay({ 
  plan, 
  hideActions = false, 
  onStatusChange,
  onGenerateResource,
  onGenerateFullPack,
  onUpdatePlan,
  onOpenCheckIn,
  onGenerateReteach,
  onGenerateIntervention,
  onGenerateCatchUp,
  onScheduleReview,
  onAddToRevisionWeek,
  onViewProgress,
  onGenerateVideo,
  onRenderVideo,
  isGenerating,
  parentCollection = 'lesson_plans'
}: LessonPlanDisplayProps) {
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>('teacher');
  const [activeTab, setActiveTab] = useState('plan');
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [fetchedVisuals, setFetchedVisuals] = useState<any[]>([]);

  useEffect(() => {
    if (plan.id) {
      const q = query(collection(db, parentCollection, plan.id, 'visuals'));
      const unsub = onSnapshot(q, (snap) => {
        setFetchedVisuals(snap.docs.map(d => d.data()));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `${parentCollection}/${plan.id}/visuals`, auth);
      });
      return () => unsub();
    }
  }, [plan.id, parentCollection]);

  const visualsToDisplay = plan.generatedVisuals || fetchedVisuals;

  // Video Settings State
  const [videoMode, setVideoMode] = useState<VideoMode>('Teacher Explainer');
  const [videoLength, setVideoLength] = useState<VideoLength>('5 min');
  const [voiceSettings, setVoiceSettings] = useState({
    gender: 'Female' as VoiceGender,
    tone: 'Normal' as VoiceTone,
    pace: 'Normal' as VoicePace
  });
  const [avatarSettings, setAvatarSettings] = useState({
    enabled: false,
    style: 'Female Teacher' as AvatarStyle,
    placement: 'Corner' as AvatarPlacement
  });

  const handlePrint = () => {
    window.print();
  };

  const toggleChecklist = async (index: number) => {
    if (!plan.beforeClassChecklist || !onUpdatePlan) return;
    const newChecklist = [...plan.beforeClassChecklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    await onUpdatePlan({ ...plan, beforeClassChecklist: newChecklist });
  };

  const handleGenerateFullPack = async () => {
    if (!onGenerateFullPack) return;
    await onGenerateFullPack(plan);
  };

  const renderResourceCard = (title: string, content: string, type: string, key?: string | number) => (
    <Card key={key} className="p-6 space-y-4 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" title="Edit">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Download">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Regenerate" onClick={() => onGenerateResource?.(plan, type)}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none text-gray-600">
        <Markdown>{content}</Markdown>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header & Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('teacher')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                viewMode === 'teacher' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <User className="w-4 h-4" />
              Teacher Mode
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                viewMode === 'student' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <GraduationCap className="w-4 h-4" />
              Student Mode
            </button>
          </div>
          {plan.isReadyToTeach && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4" />
              Ready to Teach
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onGenerateFullPack && (
            <Button 
              onClick={handleGenerateFullPack} 
              disabled={isGenerating}
              variant={plan.isReadyToTeach ? "secondary" : "primary"}
              className={cn(
                !plan.isReadyToTeach && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg"
              )}
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              {plan.isReadyToTeach ? "Regenerate Classroom Pack" : "Upgrade to Full Classroom Pack"}
            </Button>
          )}
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print Full Pack
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-gray-100 shadow-xl print:shadow-none print:border-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-gray-50/50 border-b border-gray-100 px-6 pt-4 print:hidden">
            <TabsList className="bg-transparent h-auto p-0 gap-6 overflow-x-auto flex-nowrap no-scrollbar">
              <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                Lesson Plan
              </TabsTrigger>
              <TabsTrigger value="ai-video" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold text-indigo-600">
                <Video className="w-4 h-4 mr-1" />
                AI Teaching Video
              </TabsTrigger>
              {viewMode === 'teacher' && (
                <React.Fragment key="teacher-tabs">
                  <TabsTrigger value="video" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                    Video Assistant
                  </TabsTrigger>
                  <TabsTrigger value="visual-aids" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                    Visual Aids
                  </TabsTrigger>
                  <TabsTrigger value="board-plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                    Board Plan
                  </TabsTrigger>
                  <TabsTrigger value="materials-prep" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                    Materials & Prep
                  </TabsTrigger>
                  <TabsTrigger value="demo" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                    Demonstration
                  </TabsTrigger>
                  <TabsTrigger value="execution" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold text-rose-600">
                    <Zap className="w-4 h-4 mr-1" />
                    Teach Now
                  </TabsTrigger>
                  {plan.subject === 'Language Arts' && (
                    <TabsTrigger value="la-resources" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold text-indigo-600">
                      <BookOpen className="w-4 h-4 mr-1" />
                      LA Resource Pack
                    </TabsTrigger>
                  )}
                </React.Fragment>
              )}
              {viewMode === 'teacher' && (
                <TabsTrigger value="resources" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                  Teaching Resources
                </TabsTrigger>
              )}
              <TabsTrigger value="worksheets" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                Worksheets
              </TabsTrigger>
              <TabsTrigger value="assessments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                Assessments
              </TabsTrigger>
              <TabsTrigger value="visuals" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                Visuals
              </TabsTrigger>
              {viewMode === 'teacher' && (
                <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                  Notes & Scripts
                </TabsTrigger>
              )}
              <TabsTrigger value="homework" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none pb-4 text-sm font-bold">
                Homework
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8 print:p-0">
            <TabsContent value="ai-video" className="mt-0 space-y-8">
              {plan.lessonVideo ? (
                <div className="space-y-8">
                  {/* Video Player Placeholder / Preview */}
                  <div className="aspect-video bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="z-10 flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                        <Play className="w-10 h-10 fill-current" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-black tracking-tight">{plan.lessonVideo.title}</h3>
                        <p className="text-white/60 text-sm">{plan.lessonVideo.mode} • {plan.lessonVideo.length}</p>
                      </div>
                    </div>

                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        <div className="h-1 w-48 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-indigo-500" />
                        </div>
                        <span className="text-xs font-mono">01:24 / {plan.lessonVideo.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <Settings2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                          <MonitorPlay className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Script Section */}
                      <Card className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <FileVideo className="w-6 h-6 text-indigo-600" />
                            Teaching Script
                          </h3>
                          <Button variant="secondary" size="sm">
                            <Edit3 className="w-4 h-4" />
                            Edit Script
                          </Button>
                        </div>
                        <div className="prose prose-indigo max-w-none text-gray-600 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          <Markdown>{plan.lessonVideo.script}</Markdown>
                        </div>
                      </Card>

                      {/* Scene Breakdown */}
                      <section className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Scene Breakdown</h3>
                        <div className="space-y-4">
                          {plan.lessonVideo.scenes?.map((scene, i) => (
                            <Card key={i} className="p-6 flex gap-6">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-grow space-y-3">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-gray-900">{scene.title}</h4>
                                  <span className="text-xs font-mono text-gray-400">{scene.duration}s</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Narration</p>
                                    <p className="text-sm text-gray-600 italic">"{scene.narration}"</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Visuals</p>
                                    <p className="text-sm text-gray-700">{scene.visualDescription}</p>
                                  </div>
                                </div>
                                {scene.onScreenText && scene.onScreenText.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {scene.onScreenText.map((text, j) => (
                                      <span key={j} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                                        ON SCREEN: {text}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-8">
                      {/* Video Actions */}
                      <Card className="p-6 space-y-4 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200">
                        <h3 className="text-lg font-bold">Video Actions</h3>
                        <div className="space-y-2">
                          <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50">
                            <Download className="w-4 h-4" />
                            Export as MP4
                          </Button>
                          <Button className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20">
                            <Share2 className="w-4 h-4" />
                            Share Lesson Link
                          </Button>
                          <Button className="w-full bg-white/10 text-white hover:bg-white/20 border-white/20">
                            <Presentation className="w-4 h-4" />
                            Open in Presenter
                          </Button>
                        </div>
                      </Card>

                      {/* Voice Settings Summary */}
                      <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-indigo-600" />
                          Voice Profile
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Gender</span>
                            <span className="font-bold text-gray-900">{plan.lessonVideo.voiceSettings.gender}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tone</span>
                            <span className="font-bold text-gray-900">{plan.lessonVideo.voiceSettings.tone}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Pace</span>
                            <span className="font-bold text-gray-900">{plan.lessonVideo.voiceSettings.pace}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setActiveTab('ai-video-settings')}>
                            <Settings2 className="w-4 h-4" />
                            Change Settings
                          </Button>
                        </div>
                      </Card>

                      {/* Resource Pack */}
                      <Card className="p-6 space-y-4 bg-emerald-50 border-emerald-100">
                        <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Resource Pack
                        </h3>
                        <p className="text-xs text-emerald-700">Complementary materials generated with this video.</p>
                        <div className="space-y-2">
                          <Button variant="ghost" size="sm" className="w-full justify-start text-emerald-800 hover:bg-emerald-100">
                            <FileText className="w-4 h-4" />
                            Printable Visuals
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-emerald-800 hover:bg-emerald-100">
                            <ListChecks className="w-4 h-4" />
                            Review Questions
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-emerald-800 hover:bg-emerald-100">
                            <Layers className="w-4 h-4" />
                            Vocabulary Cards
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="text-center space-y-4 py-12">
                    <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Video className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">AI Video Lesson Teacher</h3>
                    <p className="text-gray-500 max-w-xl mx-auto">
                      Transform this lesson plan into a student-friendly teaching video. 
                      Perfect for introducing concepts, explaining vocabulary, or providing a clear recap.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 space-y-6">
                      <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings2 className="w-6 h-6 text-indigo-600" />
                        Video Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Video Style</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Teacher Explainer', 'Animated Lesson', 'Visual Slideshow', 'Whiteboard', 'Tutorial', 'Vocabulary', 'Revision'] as VideoMode[]).map(mode => (
                              <button
                                key={mode}
                                onClick={() => setVideoMode(mode)}
                                className={cn(
                                  "px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all text-left",
                                  videoMode === mode ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                )}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Target Length</label>
                          <div className="flex gap-2">
                            {(['2 min', '5 min', '8 min', '10 min'] as VideoLength[]).map(len => (
                              <button
                                key={len}
                                onClick={() => setVideoLength(len)}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                                  videoLength === len ? "bg-emerald-50 border-emerald-600 text-emerald-600" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                )}
                              >
                                {len}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-8 space-y-6">
                      <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Volume2 className="w-6 h-6 text-emerald-600" />
                        Voice Settings
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Teacher Voice</label>
                          <div className="flex gap-2">
                            {(['Male', 'Female'] as VoiceGender[]).map(gender => (
                              <button
                                key={gender}
                                onClick={() => setVoiceSettings(prev => ({ ...prev, gender }))}
                                className={cn(
                                  "flex-1 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                                  voiceSettings.gender === gender ? "bg-amber-50 border-amber-600 text-amber-600" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                )}
                              >
                                {gender} Teacher
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Tone & Pace</label>
                          <div className="grid grid-cols-2 gap-4">
                            <select 
                              value={voiceSettings.tone}
                              onChange={(e) => setVoiceSettings(prev => ({ ...prev, tone: e.target.value as VoiceTone }))}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                            >
                              <option value="Normal">Normal Tone</option>
                              <option value="Calm">Calm Tone</option>
                              <option value="Energetic">Energetic Tone</option>
                            </select>
                            <select 
                              value={voiceSettings.pace}
                              onChange={(e) => setVoiceSettings(prev => ({ ...prev, pace: e.target.value as VoicePace }))}
                              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
                            >
                              <option value="Normal">Normal Pace</option>
                              <option value="Slow">Slow Pace</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-6 h-6 text-indigo-600" />
                            AI Avatar Teacher
                          </h4>
                          <button
                            onClick={() => setAvatarSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                              avatarSettings.enabled ? "bg-indigo-600" : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                avatarSettings.enabled ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </div>

                        {avatarSettings.enabled && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 pt-2"
                          >
                            <div>
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Avatar Style</label>
                              <div className="grid grid-cols-2 gap-2">
                                {(['Female Teacher', 'Male Teacher', 'Cartoon Character', 'Robot Assistant'] as AvatarStyle[]).map(style => (
                                  <button
                                    key={style}
                                    onClick={() => setAvatarSettings(prev => ({ ...prev, style }))}
                                    className={cn(
                                      "px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all",
                                      avatarSettings.style === style ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                    )}
                                  >
                                    {style}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Placement</label>
                              <div className="flex gap-2">
                                {(['Corner', 'Full Screen', 'Split Screen'] as AvatarPlacement[]).map(placement => (
                                  <button
                                    key={placement}
                                    onClick={() => setAvatarSettings(prev => ({ ...prev, placement }))}
                                    className={cn(
                                      "flex-1 px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all",
                                      avatarSettings.placement === placement ? "bg-indigo-50 border-indigo-600 text-indigo-600" : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                                    )}
                                  >
                                    {placement}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        {plan.lessonVideo ? (
                          <div className="space-y-4">
                            <Button 
                              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black shadow-xl shadow-emerald-200"
                              onClick={() => setShowVideoPlayer(true)}
                            >
                              <Play className="w-6 h-6 mr-2 fill-current" />
                              Play Teaching Video
                            </Button>
                            <Button 
                              variant="outline"
                              className="w-full h-12 border-2 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50"
                              onClick={() => onGenerateVideo?.(plan, videoMode, videoLength, voiceSettings, avatarSettings)}
                              disabled={isGenerating}
                            >
                              <RefreshCw className={cn("w-5 h-5 mr-2", isGenerating && "animate-spin")} />
                              Regenerate Video
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-black shadow-xl shadow-indigo-200"
                            onClick={() => onGenerateVideo?.(plan, videoMode, videoLength, voiceSettings, avatarSettings)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                            ) : (
                              <Sparkles className="w-6 h-6 mr-2" />
                            )}
                            {isGenerating ? "Generating Video Package..." : "Generate Full Teaching Video"}
                          </Button>
                        )}
                        <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">
                          Curriculum-aligned • Age-appropriate • Teacher-ready
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="plan" className="mt-0 space-y-8">
              {/* Action Panel */}
              {!hideActions && (
                <ActionPanel 
                  lesson={plan}
                  onStatusChange={(status) => onStatusChange?.(status)}
                  onOpenCheckIn={() => onOpenCheckIn?.()}
                  onGenerateReteach={() => onGenerateReteach?.()}
                  onGenerateIntervention={() => onGenerateIntervention?.()}
                  onGenerateCatchUp={() => onGenerateCatchUp?.()}
                  onScheduleReview={() => onScheduleReview?.()}
                  onAddToRevisionWeek={() => onAddToRevisionWeek?.()}
                  onViewProgress={() => onViewProgress?.()}
                />
              )}

              {/* Original Lesson Plan Content */}
              <div className="space-y-6 border-b border-gray-100 pb-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <LessonStatusBadge status={plan.status} />
                      <span className="text-xs text-gray-400 font-medium">{new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight print:text-2xl">{plan.lessonTitle}</h2>
                  </div>
                  {!hideActions && onStatusChange && (
                    <DropdownMenu 
                      trigger={
                        <Button variant="secondary" size="sm">
                          Status: {plan.status || 'Not Started'}
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      }
                      items={[
                        { label: 'Not Started', onClick: () => onStatusChange('Not Started'), icon: <Clock className="w-4 h-4" /> },
                        { label: 'Planned', onClick: () => onStatusChange('Planned'), icon: <Target className="w-4 h-4" /> },
                        { label: 'Taught', onClick: () => onStatusChange('Taught'), icon: <Zap className="w-4 h-4" /> },
                        { label: 'Completed', onClick: () => onStatusChange('Completed'), icon: <CheckCircle2 className="w-4 h-4" /> },
                        { label: 'Skipped', onClick: () => onStatusChange('Skipped'), icon: <XCircle className="w-4 h-4" /> },
                        { label: 'Postponed', onClick: () => onStatusChange('Postponed'), icon: <RefreshCw className="w-4 h-4" /> },
                        { label: 'Needs Review', onClick: () => onStatusChange('Needs Review'), icon: <AlertCircle className="w-4 h-4" /> }
                      ]}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 print:grid-cols-4 print:gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teacher</p>
                    <p className="font-bold text-gray-900">____________________</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="font-bold text-gray-900">{new Date(plan.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grade</p>
                    <p className="font-bold text-gray-900">{plan.grade}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</p>
                    <p className="font-bold text-gray-900">{plan.subject}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                    <p className="font-bold text-gray-900">{plan.duration}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle</p>
                    <p className="font-bold text-gray-900">{plan.cycle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Week</p>
                    <p className="font-bold text-gray-900">{plan.week || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Day</p>
                    <p className="font-bold text-gray-900">____________________</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 print:space-y-6 mt-8">
                {/* 2. Strands / Sub-strands */}
                {plan.strand && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Strands / Sub-strands</h3>
                    <p className="font-bold text-gray-900">{plan.strand}</p>
                  </section>
                )}

                {/* 3. Topic & 4. Sub-topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-2">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Topic</h3>
                    <p className="font-bold text-gray-900">{plan.topic}</p>
                  </section>
                  <section className="space-y-2">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Sub-topic</h3>
                    <p className="font-bold text-gray-900">{plan.subtopic || 'N/A'}</p>
                  </section>
                </div>

                {/* 5. Learning Outcomes / Objectives */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                    <Target className="w-5 h-5" />
                    Learning Outcomes / Objectives
                  </h3>
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-50">
                    <p className="font-bold text-indigo-900 mb-2">General Objective:</p>
                    <p className="text-indigo-800">{plan.generalObjective}</p>
                    <div className="mt-4 space-y-2">
                      <p className="font-bold text-indigo-900">Specific Objectives:</p>
                      <ul className="list-disc list-inside space-y-1 text-indigo-800">
                        {plan.specificObjectives?.map((obj, i) => <li key={i}>{obj}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 6. Key Vocabulary */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-amber-600">
                    <BookOpen className="w-5 h-5" />
                    Key Vocabulary
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {plan.keyVocabulary?.map((v, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium border border-amber-100">
                        {v}
                      </span>
                    ))}
                  </div>
                </section>

                {/* 7. Previous Knowledge */}
                {plan.previousKnowledge && (
                  <section className="space-y-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600">
                      <History className="w-5 h-5" />
                      Previous Knowledge
                    </h3>
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-50">
                      <p className="text-emerald-900 leading-relaxed italic">
                        {plan.previousKnowledge}
                      </p>
                    </div>
                  </section>
                )}

                {/* 8. Teaching / Learning Resources */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600">
                    <Package className="w-5 h-5" />
                    Teaching / Learning Resources
                  </h3>
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-50">
                    <ul className="list-disc list-inside space-y-1 text-rose-800">
                      {plan.materials?.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                </section>

                {/* Lesson Procedures (9-11) */}
                <section className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Lesson Procedures
                  </h3>

                  {plan.languageArtsSections && (
                    <div className="space-y-6 mb-8">
                      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            Section 1: Comprehension (Oral & Listening)
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">10 MINS</span>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-indigo-900">Objective: {plan.languageArtsSections.comprehension.objective}</p>
                          <div className="text-sm text-indigo-800 leading-relaxed">
                            <p className="font-bold mb-1">Task:</p>
                            <p>{plan.languageArtsSections.comprehension.task}</p>
                          </div>
                          <div className="text-sm text-indigo-800 leading-relaxed">
                            <p className="font-bold mb-1">Read Aloud / Discussion:</p>
                            <p>{plan.languageArtsSections.comprehension.readAloud}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Guided Questions</p>
                              <ul className="list-disc list-inside text-xs text-indigo-800">
                                {plan.languageArtsSections.comprehension.questions.map((q, i) => <li key={i}>{q}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Expected Responses</p>
                              <ul className="list-disc list-inside text-xs text-indigo-800 italic">
                                {plan.languageArtsSections.comprehension.expectedResponses.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Section 2: Word Study / Phonics / Recognition
                          </h4>
                          <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full border border-amber-100">35 MINS</span>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-amber-900">Objective: {plan.languageArtsSections.wordStudy.objective}</p>
                          <div className="text-sm text-amber-800 leading-relaxed">
                            <p className="font-bold mb-1">Explicit Mini-Lesson:</p>
                            <p>{plan.languageArtsSections.wordStudy.miniLesson}</p>
                          </div>
                          <div className="text-sm text-amber-800 leading-relaxed">
                            <p className="font-bold mb-1">Guided Practice:</p>
                            <p>{plan.languageArtsSections.wordStudy.guidedPractice}</p>
                          </div>
                          <div className="text-sm text-amber-800 leading-relaxed">
                            <p className="font-bold mb-1">Independent Activity:</p>
                            <p>{plan.languageArtsSections.wordStudy.independentActivity}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Examples</p>
                            <div className="flex flex-wrap gap-2">
                              {plan.languageArtsSections.wordStudy.examples.map((ex, i) => (
                                <span key={i} className="px-2 py-1 bg-white text-amber-800 rounded-lg text-xs font-bold border border-amber-100">{ex}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Section 3: Language Structure & Production
                          </h4>
                          <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-100">15 MINS</span>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-emerald-900">Objective: {plan.languageArtsSections.languageStructure.objective}</p>
                          <div className="text-sm text-emerald-800 leading-relaxed">
                            <p className="font-bold mb-1">Writing Focus:</p>
                            <p>{plan.languageArtsSections.languageStructure.writingFocus}</p>
                          </div>
                          <div className="text-sm text-emerald-800 leading-relaxed">
                            <p className="font-bold mb-1">Teacher Modeling:</p>
                            <p>{plan.languageArtsSections.languageStructure.modeling}</p>
                          </div>
                          <div className="text-sm text-emerald-800 leading-relaxed">
                            <p className="font-bold mb-1">Composition Activity:</p>
                            <p>{plan.languageArtsSections.languageStructure.activity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-8">
                    {/* 9. Introduction */}
                    {plan.introduction && plan.introduction.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-md font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                          9. Introduction
                        </h4>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                          {plan.introduction?.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* 10. Development */}
                    {(plan.development || plan.guidedPractice || plan.independentPractice) && (
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-md font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                          10. Development
                        </h4>
                        <div className="space-y-6">
                          {plan.development && plan.development.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-bold text-gray-800 text-sm">Activities & Modeling:</p>
                              <ul className="list-disc list-inside space-y-2 text-gray-600">
                                {plan.development?.map((step, i) => <li key={i}>{step}</li>)}
                              </ul>
                            </div>
                          )}
                          {plan.guidedPractice && plan.guidedPractice.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-bold text-gray-800 text-sm">Guided Practice:</p>
                              <ul className="list-disc list-inside space-y-2 text-gray-600">
                                {plan.guidedPractice?.map((step, i) => <li key={i}>{step}</li>)}
                              </ul>
                            </div>
                          )}
                          {plan.independentPractice && plan.independentPractice.length > 0 && (
                            <div className="space-y-2">
                              <p className="font-bold text-gray-800 text-sm">Independent Practice:</p>
                              <ul className="list-disc list-inside space-y-2 text-gray-600">
                                {plan.independentPractice?.map((step, i) => <li key={i}>{step}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 11. Closure */}
                    {plan.closure && plan.closure.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-md font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-600 rounded-full" />
                          11. Closure
                        </h4>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                          {plan.closure?.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>

                {/* 12. Assessment */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    12. Assessment
                  </h3>
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-50">
                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                      {plan.assessment?.map((a, i) => <li key={i}>{a}</li>)}
                      {(!plan.assessment || plan.assessment.length === 0) && <li className="italic">No assessment specified.</li>}
                    </ul>
                  </div>
                </section>

                {/* 13. Differentiation */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                    <Users className="w-5 h-5" />
                    13. Differentiation
                  </h3>
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-50">
                    <ul className="list-disc list-inside space-y-1 text-indigo-800">
                      {plan.differentiation?.map((d, i) => <li key={i}>{d}</li>)}
                      {(!plan.differentiation || plan.differentiation.length === 0) && <li className="italic">Standard instruction for all learners.</li>}
                    </ul>
                  </div>
                </section>

                {/* 14. Homework / Follow-Up Activity */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-amber-600">
                    <Home className="w-5 h-5" />
                    14. Homework / Follow-Up Activity
                  </h3>
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-50">
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      {plan.homework?.map((h, i) => <li key={i}>{h}</li>)}
                      {(!plan.homework || plan.homework.length === 0) && <li className="italic">No homework assigned.</li>}
                    </ul>
                  </div>
                </section>

                {/* 15. Teacher Reflection */}
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-400">
                    <StickyNote className="w-5 h-5" />
                    15. Teacher Reflection
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 min-h-[150px]">
                    <p className="text-gray-400 italic">
                      {plan.reflection || "To be completed after the lesson..."}
                    </p>
                  </div>
                </section>

                {viewMode === 'teacher' && plan.teacherScript && (
                  <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <StickyNote className="w-5 h-5" />
                      Teacher Script / Key Prompts
                    </h3>
                    <div className="prose prose-indigo max-w-none text-indigo-900/80 italic">
                      <Markdown>{plan.teacherScript}</Markdown>
                    </div>
                  </section>
                )}
              </div>

            </TabsContent>

            <TabsContent value="resources" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Teacher Materials */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
                      <User className="w-6 h-6" />
                      Teacher Materials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.teachingResources?.teacherMaterials.notes && renderResourceCard("Teacher Notes", plan.teachingResources.teacherMaterials.notes, "Teacher Notes", "teacher-notes")}
                      {plan.teachingResources?.teacherMaterials.script && renderResourceCard("Teaching Script", plan.teachingResources.teacherMaterials.script, "Teaching Script", "teaching-script")}
                      {plan.teachingResources?.teacherMaterials.boardWork && renderResourceCard("Board Work", plan.teachingResources.teacherMaterials.boardWork, "Board Work", "board-work")}
                    </div>
                  </section>

                  {/* Student Materials */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                      <GraduationCap className="w-6 h-6" />
                      Student Materials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.teachingResources?.studentMaterials.notebookNotes && renderResourceCard("Notebook Notes", plan.teachingResources.studentMaterials.notebookNotes, "Notebook Notes", "notebook-notes")}
                      {plan.teachingResources?.studentMaterials.homework && renderResourceCard("Homework", plan.teachingResources.studentMaterials.homework, "Homework", "homework-res")}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  {/* Before Class Checklist */}
                  <Card className="p-6 bg-amber-50/30 border-amber-100">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-amber-700 mb-4">
                      <ClipboardList className="w-5 h-5" />
                      Before Class Checklist
                    </h3>
                    <div className="space-y-3">
                      {plan.beforeClassChecklist?.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => toggleChecklist(i)}
                          className="flex items-start gap-3 w-full text-left group"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Square className="w-5 h-5 text-amber-300 group-hover:text-amber-400" />
                          )}
                          <span className={cn(
                            "text-sm font-medium transition-colors",
                            item.completed ? "text-amber-900/50 line-through" : "text-amber-900"
                          )}>
                            {item.task}
                          </span>
                        </button>
                      ))}
                      {!plan.beforeClassChecklist && (
                        <p className="text-sm text-amber-600 italic">No checklist generated yet.</p>
                      )}
                    </div>
                  </Card>

                  {/* Materials Needed */}
                  <Card className="p-6 bg-indigo-50/30 border-indigo-100">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-700 mb-4">
                      <Package className="w-5 h-5" />
                      Materials Needed
                    </h3>
                    <ul className="space-y-2">
                      {plan.materialsNeeded?.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-indigo-900 font-medium">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                          {item}
                        </li>
                      ))}
                      {!plan.materialsNeeded && (
                        <p className="text-sm text-indigo-600 italic">No materials list generated yet.</p>
                      )}
                    </ul>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="worksheets" className="mt-0 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Student Worksheets</h3>
                <Button size="sm" onClick={() => onGenerateResource?.(plan, 'Worksheet')}>
                  <Plus className="w-4 h-4" />
                  Add Worksheet
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plan.teachingResources?.studentMaterials.worksheets?.map((ws, i) => (
                  renderResourceCard(`Worksheet ${i + 1}`, ws, 'Worksheet', `worksheet-${i}`)
                ))}
                {(!plan.teachingResources?.studentMaterials.worksheets || plan.teachingResources.studentMaterials.worksheets?.length === 0) && (
                  <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No worksheets generated for this lesson.</p>
                    <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Worksheet')}>
                      Generate First Worksheet
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plan.teachingResources?.assessmentMaterials.formativeAssessment && renderResourceCard("Formative Assessment", plan.teachingResources.assessmentMaterials.formativeAssessment, "Assessment", "assessment-formative")}
                {plan.teachingResources?.assessmentMaterials.rubric && renderResourceCard("Grading Rubric", plan.teachingResources.assessmentMaterials.rubric, "Rubric", "assessment-rubric")}
                {plan.teachingResources?.assessmentMaterials.answerKey && renderResourceCard("Answer Key", plan.teachingResources.assessmentMaterials.answerKey, "Answer Key", "assessment-answer-key")}
              </div>
            </TabsContent>

            <TabsContent value="visuals" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plan.teachingResources?.visualMaterials.boardLayout && renderResourceCard("Board Layout", plan.teachingResources.visualMaterials.boardLayout, "Board Layout", "visual-board")}
                {plan.teachingResources?.visualMaterials.anchorChart && renderResourceCard("Anchor Chart", plan.teachingResources.visualMaterials.anchorChart, "Anchor Chart", "visual-anchor")}
                {plan.teachingResources?.visualMaterials.slideDeck && renderResourceCard("Slide Deck Content", plan.teachingResources.visualMaterials.slideDeck, "PowerPoint", "visual-slide")}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plan.teachingResources?.teacherMaterials.notes && renderResourceCard("Detailed Teacher Notes", plan.teachingResources.teacherMaterials.notes, "Teacher Notes", "notes-teacher")}
                {plan.teachingResources?.teacherMaterials.script && renderResourceCard("Teaching Script", plan.teachingResources.teacherMaterials.script, "Teaching Script", "notes-script")}
              </div>
            </TabsContent>

            <TabsContent value="homework" className="mt-0 space-y-6">
              <div className="max-w-3xl mx-auto">
                {plan.teachingResources?.studentMaterials.homework ? (
                  renderResourceCard("Homework Assignment", plan.teachingResources.studentMaterials.homework, "Homework", "homework-assignment")
                ) : (
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No homework generated yet.</p>
                    <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Homework')}>
                      Generate Homework
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-0 space-y-8">
              {plan.lessonVideo ? (
                <div className="space-y-8">
                  {/* Video Status & Controls */}
                  <Card className="p-6 border-indigo-100 bg-white shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Video className="w-6 h-6 text-indigo-600" />
                          {plan.lessonVideo.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                            plan.lessonVideo.videoStatus === 'completed' ? "bg-emerald-100 text-emerald-700" :
                            plan.lessonVideo.videoStatus === 'failed' ? "bg-rose-100 text-rose-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            Status: {(plan.lessonVideo.videoStatus || 'draft').replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">{plan.lessonVideo.mode} • {plan.lessonVideo.length}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {plan.lessonVideo.videoStatus === 'completed' && plan.lessonVideo.finalVideoUrl ? (
                          <>
                            <Button 
                              onClick={() => setShowVideoPlayer(true)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Play Video
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => window.open(plan.lessonVideo?.finalVideoUrl, '_blank')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download MP4
                            </Button>
                          </>
                        ) : plan.lessonVideo.videoStatus === 'visuals_ready' || plan.lessonVideo.videoStatus === 'failed' ? (
                          <Button 
                            onClick={() => onRenderVideo?.(plan)}
                            disabled={isGenerating}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                            {plan.lessonVideo.videoStatus === 'failed' ? 'Retry Render' : 'Render Final MP4'}
                          </Button>
                        ) : plan.lessonVideo.videoStatus === 'rendering' ? (
                          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg text-indigo-700 font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Rendering Video...
                          </div>
                        ) : null}
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            if (plan.lessonVideo) {
                              onGenerateVideo?.(
                                plan,
                                plan.lessonVideo.mode,
                                plan.lessonVideo.length,
                                plan.lessonVideo.voiceSettings,
                                plan.lessonVideo.avatarSettings
                              );
                            }
                          }}
                          disabled={isGenerating}
                        >
                          Regenerate Video
                        </Button>
                      </div>
                    </div>

                    {/* Progress Stages */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(plan.lessonVideo.stages).map(([stage, status]) => (
                        <div key={stage} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stage}</span>
                            {status === 'Completed' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : 
                             status === 'Generating' ? <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" /> :
                             status === 'Error' ? <AlertCircle className="w-3 h-3 text-rose-500" /> :
                             <div className="w-3 h-3 rounded-full border border-gray-200" />}
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn(
                              "h-full transition-all duration-500",
                              status === 'Completed' ? "w-full bg-emerald-500" :
                              status === 'Generating' ? "w-1/2 bg-indigo-500 animate-pulse" :
                              status === 'Error' ? "w-full bg-rose-500" :
                              "w-0"
                            )} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Video Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <section className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Scene Breakdown</h3>
                        <div className="space-y-4">
                          {plan.lessonVideo.scenes?.map((scene, i) => (
                            <Card key={i} className="p-6 flex gap-6">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-gray-900 text-lg">{scene.title}</h4>
                                  <span className="text-xs font-mono text-gray-400">{scene.duration}s</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Narration</p>
                                    <p className="text-sm text-gray-600 italic">"{scene.narration}"</p>
                                  </div>
                                  <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                    {scene.visualUrl ? (
                                      <img src={scene.visualUrl} alt={scene.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                      </div>
                                    )}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded backdrop-blur-sm">
                                      Visual Prompt: {scene.visualDescription}
                                    </div>
                                  </div>
                                </div>
                                {scene.onScreenText && scene.onScreenText.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {scene.onScreenText.map((text, j) => (
                                      <span key={j} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">
                                        ON SCREEN: {text}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-8">
                      <Card className="p-6 space-y-6">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-indigo-600" />
                          Voice & Avatar
                        </h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-50">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Voice Profile</p>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Mic className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-bold text-indigo-900">{plan.lessonVideo.voiceSettings.gender} Voice</p>
                                <p className="text-xs text-indigo-600">{plan.lessonVideo.voiceSettings.tone} Tone • {plan.lessonVideo.voiceSettings.pace} Pace</p>
                              </div>
                            </div>
                          </div>
                          {plan.lessonVideo.avatarSettings.enabled && (
                            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-50">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">AI Avatar</p>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <Users className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-emerald-900">{plan.lessonVideo.avatarSettings.style}</p>
                                  <p className="text-xs text-emerald-600">{plan.lessonVideo.avatarSettings.placement}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>

                      <Card className="p-6 space-y-4">
                        <h4 className="text-lg font-bold text-gray-900">Resource Pack</h4>
                        <div className="space-y-2">
                          <Button variant="ghost" className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            <FileText className="w-4 h-4 mr-2" />
                            Download Full Script
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Printable Visuals
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            <FileText className="w-4 h-4 mr-2" />
                            Lesson Worksheet
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : plan.videoAssistant ? (
                <div className="space-y-8">
                  <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Presentation className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Generate Teaching Video</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Transform your lesson plan into a professional AI-powered teaching video with narration, visuals, and optional avatar.
                    </p>
                    <Button 
                      onClick={() => onGenerateResource?.(plan, 'Video Assistant')}
                      disabled={isGenerating}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Video Script & Assets
                    </Button>
                  </div>
                  
                  <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <Presentation className="w-6 h-6" />
                      Video Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">Topic</p>
                        <p className="font-bold text-indigo-900">{plan.videoAssistant.suggestedVideo.topic}</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1">Purpose</p>
                        <p className="text-indigo-800">{plan.videoAssistant.suggestedVideo.purpose}</p>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="p-6 space-y-6">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Teacher Guidance
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pre-Video Instructions</p>
                          <p className="text-sm text-gray-700">{plan.videoAssistant.teacherGuidance.beforeVideo}</p>
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pause Points & Discussion</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {plan.videoAssistant.teacherGuidance.pausePoints?.map((p, i) => <li key={i}>{p.timestamp}: {p.question}</li>)}
                          </ul>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 space-y-6 bg-rose-50 border-rose-100">
                      <h4 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        "If No Internet" Backup Plan
                      </h4>
                      <div className="space-y-4">
                        <p className="text-sm text-rose-800">{plan.videoAssistant.noInternetBackup.simplifiedExplanation}</p>
                        <div>
                          <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">Board Drawing Version</p>
                          <p className="text-sm text-rose-700">{plan.videoAssistant.noInternetBackup.boardDrawing}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Presentation className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No video assistant generated for this lesson.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Video Assistant')}>
                    Generate Video Assistant
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="visual-aids" className="mt-0 space-y-8">
              {visualsToDisplay && visualsToDisplay.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {visualsToDisplay.map((visual, i) => (
                    <Card key={i} className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{visual.title}</h4>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase tracking-widest">{visual.type}</span>
                        </div>
                        <ImageIcon className="w-6 h-6 text-indigo-400" />
                      </div>

                      {visual.imageUrl && (
                        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                          <img 
                            src={visual.imageUrl} 
                            alt={visual.title} 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute bottom-4 right-4">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="bg-white/90 backdrop-blur shadow-sm" 
                              onClick={() => window.open(visual.imageUrl)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="prose prose-sm max-w-none text-gray-600">
                        <Markdown>{visual.content}</Markdown>
                      </div>
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Student Friendly Wording</p>
                        <p className="text-sm text-gray-700">{visual.studentFriendlyWording}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No in-depth visual aids generated for this lesson.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Visual Aids')}>
                    Generate Visual Aids
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="board-plan" className="mt-0 space-y-8">
              {plan.boardVisualPlan ? (
                <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <Presentation className="w-8 h-8 text-indigo-400" />
                      Chalkboard / Whiteboard Plan
                    </h3>
                    <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                      <Download className="w-4 h-4" />
                      Export Plan
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-3 space-y-8">
                      <div className="border-2 border-white/20 rounded-xl p-6 min-h-[400px] relative">
                        <div className="absolute -top-3 left-6 px-2 bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white/40">Main Board Area</div>
                        <div className="space-y-6">
                          <div className="text-center border-b border-white/10 pb-4">
                            <h4 className="text-3xl font-black underline decoration-indigo-500 underline-offset-8">{plan.boardVisualPlan.title}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h5 className="text-indigo-400 font-bold uppercase tracking-wider text-xs">Key Concepts</h5>
                              <ul className="list-disc list-inside space-y-2 text-lg">
                                {plan.boardVisualPlan.keyNotes?.map((note, i) => <li key={i}>{note}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-4">
                              <h5 className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Examples / Steps</h5>
                              <div className="bg-white/5 p-4 rounded-lg border border-white/10 font-mono text-sm">
                                <Markdown>{plan.boardVisualPlan.workedExamples.join('\n\n')}</Markdown>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h5 className="text-amber-400 font-bold uppercase tracking-wider text-[10px] mb-3">Layout</h5>
                        <p className="text-sm text-white/70">{plan.boardVisualPlan.layout}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h5 className="text-rose-400 font-bold uppercase tracking-wider text-[10px] mb-3">Sections</h5>
                        <ol className="list-decimal list-inside space-y-2 text-xs text-white/70">
                          {plan.boardVisualPlan.sections?.map((section, i) => <li key={i}>{section.heading}: {section.content}</li>)}
                        </ol>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Presentation className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No board visual plan generated for this lesson.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Board Plan')}>
                    Generate Board Plan
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="materials-prep" className="mt-0 space-y-8">
              {plan.exactMaterials ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Package className="w-6 h-6 text-indigo-600" />
                        Materials List
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plan.exactMaterials.items?.map((item, i) => (
                          <Card key={i} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase tracking-widest">{item.quantity}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{item.stage}</p>
                            <p className="text-sm text-gray-600">{item.prepInstructions}</p>
                            {item.substitute && (
                              <p className="text-xs text-emerald-600 italic">Sub: {item.substitute}</p>
                            )}
                          </Card>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    <Card className="p-6 bg-amber-50 border-amber-100">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-amber-900 mb-4">
                        <Clock className="w-5 h-5" />
                        General Preparation
                      </h3>
                      <ul className="space-y-4">
                        {plan.exactMaterials.generalPrep?.map((prep, i) => (
                          <li key={i} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-900 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</div>
                            <p className="text-sm text-amber-900 font-medium">{prep}</p>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No exact materials list generated for this lesson.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Materials')}>
                    Generate Materials List
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="demo" className="mt-0 space-y-8">
              {plan.demonstrationSupport ? (
                <div className="max-w-4xl mx-auto space-y-8">
                  <section className="bg-indigo-600 text-white p-8 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                      <Zap className="w-8 h-8" />
                      Lesson Demonstration / Practical
                    </h3>
                    <p className="text-indigo-100 text-lg">Modeling Tips: {plan.demonstrationSupport.modelingTips.join(', ')}</p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {plan.demonstrationSupport.steps?.map((step, i) => (
                      <Card key={i} className="p-6 space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <Eye className="w-5 h-5 text-indigo-600" />
                          Step {i + 1}: {step.action}
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-emerald-600">Observation: <span className="font-normal text-gray-700">{step.observation}</span></p>
                          <p className="text-sm font-bold text-amber-600">Question: <span className="font-normal text-gray-700">{step.question}</span></p>
                          <p className="text-sm font-bold text-indigo-600">Conclusion: <span className="font-normal text-gray-700">{step.conclusion}</span></p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No demonstration support generated for this lesson.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => onGenerateResource?.(plan, 'Demonstration')}>
                    Generate Demonstration Support
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="execution" className="mt-0 space-y-8">
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center bg-rose-600 text-white p-6 rounded-2xl shadow-lg">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                      <Zap className="w-8 h-8" />
                      Teacher Execution Mode
                    </h3>
                    <p className="text-rose-100">Real-time teaching guide for {plan.lessonTitle}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-200">Duration</p>
                      <p className="font-bold">{plan.duration}</p>
                    </div>
                    <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                      <Clock className="w-4 h-4" />
                      Start Timer
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Active Teaching Script */}
                    <section className="space-y-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Live Teaching Script
                      </h4>
                      <Card className="p-6 bg-indigo-50/30 border-indigo-100 prose prose-indigo max-w-none">
                        <Markdown>{plan.teacherScript || "No script generated yet."}</Markdown>
                      </Card>
                    </section>

                    {/* Board Visual Reference */}
                    {plan.boardVisualPlan && (
                      <section className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Presentation className="w-5 h-5 text-slate-700" />
                          Board Visual Reference
                        </h4>
                        <Card className="p-6 bg-slate-900 text-white border-none">
                          <div className="text-center border-b border-white/10 pb-4 mb-4">
                            <h5 className="text-xl font-bold underline decoration-indigo-500 underline-offset-4">{plan.boardVisualPlan.title}</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Key Notes</p>
                              <ul className="list-disc list-inside space-y-1">
                                {plan.boardVisualPlan.keyNotes?.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Examples</p>
                              <div className="bg-white/5 p-2 rounded border border-white/10 font-mono text-[10px]">
                                {plan.boardVisualPlan.workedExamples[0]}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </section>
                    )}

                    {/* Video Guidance */}
                    {plan.videoAssistant && (
                      <section className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Presentation className="w-5 h-5 text-rose-600" />
                          Video Integration
                        </h4>
                        <Card className="p-6 border-rose-100 bg-rose-50/30">
                          <p className="font-bold text-rose-900 mb-2">Topic: {plan.videoAssistant.suggestedVideo.topic}</p>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Pre-Video Prompt</p>
                              <p className="text-sm text-rose-800 italic">"{plan.videoAssistant.teacherGuidance.beforeVideo}"</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Discussion Questions</p>
                              <ul className="list-disc list-inside space-y-1 text-sm text-rose-800">
                                {plan.videoAssistant.teacherGuidance.pausePoints?.slice(0, 3).map((q, i) => <li key={i}>{q.timestamp}: {q.question}</li>)}
                              </ul>
                            </div>
                          </div>
                        </Card>
                      </section>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Materials Checklist */}
                    <Card className="p-6 bg-amber-50 border-amber-100">
                      <h4 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Materials Check
                      </h4>
                      <div className="space-y-3">
                        {plan.materials?.map((m, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                            <span className="text-sm font-medium text-amber-900">{m}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Demonstration Quick Guide */}
                    {plan.demonstrationSupport && (
                      <Card className="p-6 bg-emerald-50 border-emerald-100">
                        <h4 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Demo Guide
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Action</p>
                            <p className="text-sm text-emerald-800">{plan.demonstrationSupport.steps[0]?.action}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Watch For</p>
                            <ul className="list-disc list-inside space-y-1 text-xs text-emerald-800">
                              {plan.demonstrationSupport.steps[0]?.observation.split('.').map((o, i) => o.trim() && <li key={i}>{o}</li>)}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Assessment Quick Check */}
                    <Card className="p-6 bg-indigo-50 border-indigo-100">
                      <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Quick Assessment
                      </h4>
                      <ul className="list-disc list-inside space-y-2 text-sm text-indigo-800">
                        {plan.assessment?.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            {plan.subject === 'Language Arts' && (
              <TabsContent value="la-resources" className="mt-0 p-8 space-y-8">
                {plan.languageArtsResourcePack ? (
                  <div className="space-y-12">
                    {/* Reading Passage */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-4">
                        <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                          <BookOpen className="w-6 h-6 text-indigo-600" />
                          Reading Passage: {plan.languageArtsResourcePack.readingPassage.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                            {plan.languageArtsResourcePack.readingPassage.type}
                          </Badge>
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                            {plan.languageArtsResourcePack.readingPassage.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm leading-relaxed text-gray-800 text-lg italic font-serif">
                        {plan.languageArtsResourcePack.readingPassage.content.split('\n').map((para, i) => (
                          <p key={i} className="mb-4 last:mb-0">{para}</p>
                        ))}
                      </div>
                    </section>

                    {/* Vocabulary */}
                    <section className="space-y-4">
                      <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-indigo-600" />
                        Vocabulary Focus
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plan.languageArtsResourcePack.vocabulary.map((v, i) => (
                          <div key={i} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                            <p className="text-lg font-black text-indigo-900">{v.word}</p>
                            <p className="text-sm text-indigo-800 font-medium">{v.definition}</p>
                            <p className="text-xs text-indigo-600 italic">"{v.sentence}"</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Phonics & Grammar */}
                      <div className="space-y-8">
                        <section className="space-y-4">
                          <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-600" />
                            Phonics & Word Work
                          </h3>
                          <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <ul className="space-y-2">
                              {plan.languageArtsResourcePack.phonicsPractice.map((p, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-emerald-600" />
                            Grammar & Language Structure
                          </h3>
                          <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <ul className="space-y-2">
                              {plan.languageArtsResourcePack.grammarExercises.map((g, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>
                      </div>

                      {/* Writing & Assessment */}
                      <div className="space-y-8">
                        <section className="space-y-4">
                          <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                            <PenTool className="w-5 h-5 text-indigo-600" />
                            Writing Prompt
                          </h3>
                          <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                              {plan.languageArtsResourcePack.writingPrompt}
                            </p>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-lg font-black text-rose-900 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-rose-600" />
                            Assessment Questions
                          </h3>
                          <div className="space-y-3">
                            {plan.languageArtsResourcePack.assessmentQuestions.map((q, i) => (
                              <div key={i} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-black text-rose-400 uppercase tracking-widest">{q.type}</p>
                                </div>
                                <p className="text-sm font-bold text-rose-900">{q.question}</p>
                                <p className="text-xs text-rose-700 italic">Answer: {q.answer}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>

                    {/* Differentiation */}
                    <section className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        Differentiation Tips
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">For Struggling Learners</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {plan.languageArtsResourcePack.differentiationTips.struggling}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">For Advanced Learners</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {plan.languageArtsResourcePack.differentiationTips.advanced}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">No Resource Pack Generated</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">
                        Generate the full classroom pack to unlock the Language Arts specific resource materials.
                      </p>
                    </div>
                    <Button 
                      onClick={() => onGenerateFullPack?.(plan)}
                      disabled={isGenerating}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Package className="w-4 h-4 mr-2" />
                      )}
                      Generate Resource Pack
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </Card>
      {/* Video Player Modal */}
      {showVideoPlayer && plan.lessonVideo && (
        <LessonVideoPlayer 
          video={plan.lessonVideo} 
          onClose={() => setShowVideoPlayer(false)} 
        />
      )}
    </div>
  );
}
