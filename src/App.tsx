/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Upload, 
  FileText, 
  Calendar, 
  BookOpen, 
  Settings, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  StickyNote, 
  Search,
  BookMarked,
  LayoutDashboard,
  Layout,
  ListChecks,
  CalendarRange,
  CalendarDays,
  Sparkles,
  Zap,
  Layers,
  Target,
  Users,
  BarChart3,
  Map as MapIcon,
  ArrowRight,
  HelpCircle,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useToasts } from './context/ToastContext';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { cn, stripUndefined } from './lib/utils';
import { 
  parseCurriculum, 
  parseCurriculumUnit,
  generateResource,
  generateLanguageArtsResourcePack,
  generateLessonPlan,
  generateReteachLesson,
  generateInterventionWork,
  generateCatchUpLesson,
  generateRevisionWeek,
  generateYearlyCurriculumMap,
  generateCyclePlan,
  generateWeeklyTeachingPlan,
  generateLessonVideo,
  generateVideoResourcePack,
  generateSceneAudio,
  generateSceneVisual,
  safeJsonParse
} from './services/gemini';
import { renderVideo } from "./services/videoRenderer";
import { uploadVideo, uploadThumbnail, uploadAudio } from "./services/storageService";
import { 
  GradeLevel,
  Subject,
  Class,
  Student,
  AttendanceRecord,
  CurriculumEntry, 
  CurriculumUnit,
  WeeklyCurriculumPlan, 
  DailyLessonPlan,
  YearlyCalendarPlan,
  CyclePacingMap,
  LessonPlan, 
  LessonStatus,
  UserSettings,
  handleFirestoreError,
  OperationType,
  AssessmentRecord,
  OutcomeMastery,
  StudentSupportFlag,
  MisconceptionLog,
  AcademicCalendar,
  YearlyCurriculumMap,
  CyclePlan,
  WeeklyTeachingPlan,
  CoverageRecord,
  LessonVideo,
  VideoMode,
  VideoLength,
  VoiceGender,
  VoiceTone,
  VoicePace,
  AvatarStyle,
  AvatarPlacement
} from './types';

// --- Components ---
import { 
  Button, 
  Card, 
  Input, 
  ErrorBoundary
} from './components/ui';
import { 
  StatCard, 
  NavButton, 
  QuickAction 
} from './components/DashboardComponents';
import { ClassSelectionModal } from './components/ClassSelectionModal';

// Views
import WeeklyPlanDetailView from './components/views/WeeklyPlanDetailView';
import { CyclePacingView } from './components/views/CyclePacingView';
import { CurriculumView } from './components/views/CurriculumView';
import { CycleUnitPlansView } from './components/views/CycleUnitPlansView';
import { YearlyCalendarView } from './components/views/YearlyCalendarView';
import { PlannerView } from './components/views/PlannerView';
import { SavedPlanDetailView } from './components/views/SavedPlanDetailView';
import { SavedPlansView } from './components/views/SavedPlansView';
import { TemplatesView } from './components/views/TemplatesView';
import { ResourceGenView } from './components/views/ResourceGenView';
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';
import { AssessmentTracker } from './components/AssessmentTracker';
import { PostLessonCheckIn } from './components/PostLessonCheckIn';
import { CurriculumMappingEngine } from './components/mapping/CurriculumMappingEngine';
import { PacingDashboard } from './components/mapping/PacingDashboard';
import { LessonVideoStudio } from './components/LessonVideoStudio';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingPlan, setViewingPlan] = useState<LessonPlan | null>(null);
  const [viewingDailyPlan, setViewingDailyPlan] = useState<DailyLessonPlan | null>(null);
  const [viewingWeeklyPlan, setViewingWeeklyPlan] = useState<WeeklyCurriculumPlan | null>(null);
  const [viewingResource, setViewingResource] = useState<any | null>(null);
  const [generatedResource, setGeneratedResource] = useState<{ type: string, content: string, planId?: string } | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumEntry[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyCurriculumPlan[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [dailyLessonPlans, setDailyLessonPlans] = useState<DailyLessonPlan[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [yearlyCalendars, setYearlyCalendars] = useState<YearlyCalendarPlan[]>([]);
  const [cyclePacingMaps, setCyclePacingMaps] = useState<CyclePacingMap[]>([]);
  const [assessmentRecords, setAssessmentRecords] = useState<AssessmentRecord[]>([]);
  const [outcomeMastery, setOutcomeMastery] = useState<OutcomeMastery[]>([]);
  const [supportFlags, setSupportFlags] = useState<StudentSupportFlag[]>([]);
  const [misconceptionLogs, setMisconceptionLogs] = useState<MisconceptionLog[]>([]);
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnit[]>([]);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkInLesson, setCheckInLesson] = useState<LessonPlan | null>(null);
  const { showToast } = useToasts();

  const handleSelectClass = async (classId: string) => {
    setActiveClassId(classId);
    setIsClassSelectionOpen(false);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          settings: {
            lastSelectedClassId: classId
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error saving last selected class:", error);
      }
    }
  };

  // Class & Subject Context
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [isClassSelectionOpen, setIsClassSelectionOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const currentClass = useMemo(() => classes.find(c => c.id === activeClassId) || null, [classes, activeClassId]);

  // Curriculum Mapping Engine State
  const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendar | null>(null);
  const [yearlyCurriculumMaps, setYearlyCurriculumMaps] = useState<YearlyCurriculumMap[]>([]);
  const [cyclePlans, setCyclePlans] = useState<CyclePlan[]>([]);
  const [weeklyTeachingPlans, setWeeklyTeachingPlans] = useState<WeeklyTeachingPlan[]>([]);
  const [coverageRecords, setCoverageRecords] = useState<CoverageRecord[]>([]);

  const [userSettings, setUserSettings] = useState<UserSettings>({
    schoolName: '',
    defaultGrade: 'Standard 1',
    defaultSubject: 'Mathematics',
    curriculumStructure: 'Cycles',
    languageArtsStructure: 'Recommended',
    aiQuality: {
      defaultOutputStyle: 'Standard Teacher',
      includeTeacherScript: false,
      includeDifferentiation: true,
      defaultDetailLevel: 'Standard',
      preferCompetencyObjectives: true,
      preferredTone: 'Professional and Encouraging'
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<any>(null);

  const overallProgress = useMemo(() => {
    let total = 0;
    let completed = 0;
    yearlyCalendars.forEach(cal => {
      const teachingDays = cal.days.filter(d => d.isTeachingDay);
      total += teachingDays.length;
      completed += teachingDays.filter(d => d.status === 'Completed' || d.status === 'Taught').length;
    });
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [yearlyCalendars]);

  const resumeLesson = useMemo(() => {
    for (const cal of yearlyCalendars) {
      const sortedDays = [...cal.days]
        .filter(d => d.isTeachingDay)
        .sort((a, b) => a.date.localeCompare(b.date));
      const next = sortedDays.find(d => !d.status || d.status === 'Not Started' || d.status === 'Planned' || d.status === 'Postponed');
      if (next) return { calendar: cal, lesson: next };
    }
    return null;
  }, [yearlyCalendars]);

  const currentCycleInfo = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    for (const cal of yearlyCalendars) {
      const todayEntry = cal.days.find(d => d.date === today);
      if (todayEntry && todayEntry.isTeachingDay && todayEntry.cycle) {
        const pacingMap = cyclePacingMaps.find(m => m.grade === cal.grade && m.subject === cal.subject && m.cycle === todayEntry.cycle);
        return {
          cycle: todayEntry.cycle,
          week: todayEntry.week,
          subject: cal.subject,
          grade: cal.grade,
          pacingMap
        };
      }
    }
    return null;
  }, [yearlyCalendars, cyclePacingMaps]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore connection test failed: client is offline. Check configuration.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    // --- Core Context Listeners (Always Active) ---
    
    // User Settings
    const unsubSettings = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.settings) {
          setUserSettings(prev => ({ ...prev, ...data.settings }));
          // If activeClassId not set, try to load from settings
          if (!activeClassId && data.settings.lastSelectedClassId) {
            setActiveClassId(data.settings.lastSelectedClassId);
          }
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`, auth);
    });

    // Classes
    const qClasses = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      const fetchedClasses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Class));
      setClasses(fetchedClasses);
      
      // If active class was deleted, reset it
      if (activeClassId && !fetchedClasses.some(c => c.id === activeClassId)) {
        setActiveClassId(null);
        setIsClassSelectionOpen(true);
      }

      if (!activeClassId && fetchedClasses.length > 0) {
        // If we have classes but no active one, and settings didn't provide one, open selection
        setIsClassSelectionOpen(true);
      } else if (fetchedClasses.length === 0) {
        // No classes at all, open selection (which will have a "Create Class" option)
        setIsClassSelectionOpen(true);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'classes', auth);
    });

    // --- Class-Scoped Listeners ---
    
    if (!activeClassId) {
      // Clear data if no class is active
      setCurriculum([]);
      setWeeklyPlans([]);
      setLessonPlans([]);
      setDailyLessonPlans([]);
      setResources([]);
      setYearlyCalendars([]);
      setCyclePacingMaps([]);
      setAssessmentRecords([]);
      setOutcomeMastery([]);
      setSupportFlags([]);
      setMisconceptionLogs([]);
      setAcademicCalendar(null);
      setYearlyCurriculumMaps([]);
      setCyclePlans([]);
      setWeeklyTeachingPlans([]);
      setCoverageRecords([]);
      setStudents([]);
      setAttendanceRecords([]);
      return () => {
        unsubSettings();
        unsubClasses();
      };
    }

    const qCurriculum = query(
      collection(db, 'curriculum'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubCurriculum = onSnapshot(qCurriculum, (snap) => {
      setCurriculum(snap.docs.map(d => ({ id: d.id, ...d.data() } as CurriculumEntry)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'curriculum', auth);
    });

    const qWeekly = query(
      collection(db, 'weekly_curriculum_plans'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubWeekly = onSnapshot(qWeekly, (snap) => {
      setWeeklyPlans(snap.docs.map(d => {
        const data = d.data();
        let daily_objectives = data.daily_objectives;
        if (typeof daily_objectives === 'string') {
          try {
            daily_objectives = safeJsonParse(daily_objectives);
          } catch (e) {
            console.error("Error parsing daily_objectives", e);
            daily_objectives = [];
          }
        }
        return { id: d.id, ...data, daily_objectives } as WeeklyCurriculumPlan;
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'weekly_curriculum_plans', auth);
    });

    const qLesson = query(
      collection(db, 'lesson_plans'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubLesson = onSnapshot(qLesson, (snap) => {
      setLessonPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as LessonPlan)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'lesson_plans', auth);
    });

    const qDaily = query(
      collection(db, 'daily_lesson_plans'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubDaily = onSnapshot(qDaily, (snap) => {
      setDailyLessonPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyLessonPlan)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'daily_lesson_plans', auth);
    });

    const qResources = query(
      collection(db, 'resources'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubResources = onSnapshot(qResources, (snap) => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'resources', auth);
    });

    const qYearly = query(
      collection(db, 'yearly_calendars'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubYearly = onSnapshot(qYearly, (snap) => {
      setYearlyCalendars(snap.docs.map(d => ({ id: d.id, ...d.data() } as YearlyCalendarPlan)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'yearly_calendars', auth);
    });

    const qPacing = query(
      collection(db, 'cycle_pacing_maps'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubPacing = onSnapshot(qPacing, (snap) => {
      setCyclePacingMaps(snap.docs.map(d => ({ id: d.id, ...d.data() } as CyclePacingMap)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'cycle_pacing_maps', auth);
    });

    const qStudents = query(collection(db, 'students'), where('createdBy', '==', user.uid), where('classId', '==', activeClassId));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'students', auth);
    });

    const qAttendance = query(collection(db, 'attendance'), where('createdBy', '==', user.uid), where('classId', '==', activeClassId));
    const unsubAttendance = onSnapshot(qAttendance, (snap) => {
      setAttendanceRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'attendance', auth);
    });

    // Curriculum Mapping Engine Listeners
    const qCalendar = query(collection(db, 'academic_calendars'), where('createdBy', '==', user.uid), where('classId', '==', activeClassId));
    const unsubCalendar = onSnapshot(qCalendar, (snap) => {
      if (!snap.empty) {
        setAcademicCalendar({ id: snap.docs[0].id, ...snap.docs[0].data() } as AcademicCalendar);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'academic_calendars', auth);
    });

    const qYearlyMaps = query(
      collection(db, 'yearly_curriculum_maps'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubYearlyMaps = onSnapshot(qYearlyMaps, (snap) => {
      setYearlyCurriculumMaps(snap.docs.map(d => ({ id: d.id, ...d.data() } as YearlyCurriculumMap)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'yearly_curriculum_maps', auth);
    });

    const qCyclePlans = query(
      collection(db, 'cycle_plans'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubCyclePlans = onSnapshot(qCyclePlans, (snap) => {
      setCyclePlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as CyclePlan)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'cycle_plans', auth);
    });

    const qWeeklyTeaching = query(
      collection(db, 'weekly_teaching_plans'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubWeeklyTeaching = onSnapshot(qWeeklyTeaching, (snap) => {
      setWeeklyTeachingPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyTeachingPlan)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'weekly_teaching_plans', auth);
    });

    const qCoverage = query(
      collection(db, 'coverage_records'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubCoverage = onSnapshot(qCoverage, (snap) => {
      setCoverageRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as CoverageRecord)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'coverage_records', auth);
    });

    const qCurriculumUnits = query(
      collection(db, 'curriculum_units'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubCurriculumUnits = onSnapshot(qCurriculumUnits, (snap) => {
      setCurriculumUnits(snap.docs.map(d => ({ id: d.id, ...d.data() } as CurriculumUnit)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'curriculum_units', auth);
    });

    const qAssessment = query(
      collection(db, 'assessment_records'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubAssessment = onSnapshot(qAssessment, (snap) => {
      setAssessmentRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentRecord)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'assessment_records', auth);
    });

    const qMastery = query(
      collection(db, 'outcome_mastery'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubMastery = onSnapshot(qMastery, (snap) => {
      setOutcomeMastery(snap.docs.map(d => ({ id: d.id, ...d.data() } as OutcomeMastery)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'outcome_mastery', auth);
    });

    const qSupport = query(collection(db, 'student_support_flags'), where('createdBy', '==', user.uid), where('classId', '==', activeClassId));
    const unsubSupport = onSnapshot(qSupport, (snap) => {
      setSupportFlags(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentSupportFlag)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'student_support_flags', auth);
    });

    const qMisconception = query(
      collection(db, 'misconception_logs'), 
      where('createdBy', '==', user.uid), 
      where('classId', '==', activeClassId),
      ...(activeSubject ? [where('subject', '==', activeSubject)] : [])
    );
    const unsubMisconception = onSnapshot(qMisconception, (snap) => {
      setMisconceptionLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as MisconceptionLog)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'misconception_logs', auth);
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubCurriculum();
      unsubWeekly();
      unsubLesson();
      unsubDaily();
      unsubResources();
      unsubYearly();
      unsubPacing();
      unsubStudents();
      unsubAttendance();
      unsubCalendar();
      unsubYearlyMaps();
      unsubCyclePlans();
      unsubWeeklyTeaching();
      unsubCoverage();
      unsubCurriculumUnits();
      unsubAssessment();
      unsubMastery();
      unsubSupport();
      unsubMisconception();
    };
  }, [user, activeClassId, activeSubject]);

  const handleLoadSample = async () => {
    if (!user) return;
    const samples: Partial<CurriculumEntry>[] = [
      {
        grade: 'Standard 1',
        subject: 'Mathematics',
        cycle: 1,
        strand: 'Number and Operations',
        topic: 'Place Value',
        subtopic: 'Tens and Ones',
        learning_outcomes: [
          'Identify tens and ones in a two-digit number',
          'Represent numbers using base-ten blocks',
          'Compare two-digit numbers using <, >, and ='
        ],
        suggestedLessons: 3,
        suggestedWeeks: 1,
        isAmbiguous: false
      },
      {
        grade: 'Standard 1',
        subject: 'Mathematics',
        cycle: 1,
        strand: 'Number and Operations',
        topic: 'Addition within 20',
        subtopic: 'Basic Facts',
        learning_outcomes: [
          'Recall addition facts up to 10',
          'Use strategies like counting on to solve addition problems',
          'Solve simple word problems involving addition'
        ],
        suggestedLessons: 4,
        suggestedWeeks: 1,
        isAmbiguous: false
      },
      {
        grade: 'Standard 1',
        subject: 'Mathematics',
        cycle: 2,
        strand: 'Geometry',
        topic: '2D Shapes',
        subtopic: 'Properties',
        learning_outcomes: [
          'Identify and name common 2D shapes (circle, square, triangle, rectangle)',
          'Describe shapes based on number of sides and corners',
          'Create patterns using 2D shapes'
        ],
        suggestedLessons: 2,
        suggestedWeeks: 1,
        isAmbiguous: true
      }
    ];

    try {
      for (const sample of samples) {
        const strippedSample = stripUndefined({
          ...sample,
          classId: activeClassId,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
        await addDoc(collection(db, 'curriculum'), strippedSample);
      }
      showToast("Sample curriculum data loaded successfully!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'curriculum', auth);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    setUploadError(null);

    let totalUploaded = 0;
    let totalFailed = 0;

    const filesArray = Array.from(files);
    const processFile = async (file: File) => {
      try {
        let parsed: any[] = [];
        const isUnitPlan = file.name.toLowerCase().includes('unit');

        if (file.type === 'application/pdf') {
          try {
            // Try direct PDF parsing first (better for layout)
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
            const data = base64.split(',')[1];
            
            if (isUnitPlan) {
              parsed = await parseCurriculumUnit({ data, mimeType: file.type });
            } else {
              parsed = await parseCurriculum({ data, mimeType: file.type });
            }
          } catch (pdfErr: any) {
            console.warn("Direct PDF parsing failed, falling back to text extraction:", pdfErr);
            // Fallback to text extraction if direct parsing fails (e.g. 500 error)
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
              fullText += pageText + '\n';
            }
            
            if (isUnitPlan) {
              parsed = await parseCurriculumUnit(undefined, fullText);
            } else {
              parsed = await parseCurriculum(undefined, fullText);
            }
          }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          
          if (isUnitPlan) {
            parsed = await parseCurriculumUnit(undefined, text);
          } else {
            parsed = await parseCurriculum(undefined, text);
          }
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = await file.text();
          if (isUnitPlan) {
            parsed = await parseCurriculumUnit(undefined, text);
          } else {
            parsed = await parseCurriculum(undefined, text);
          }
        } else {
          // Default to trying as image or other supported type if it's not PDF/DOCX/TXT
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          const data = base64.split(',')[1];
          parsed = await parseCurriculum({ data, mimeType: file.type });
        }

        // Batch writes
        const collectionName = isUnitPlan ? 'curriculum_units' : 'curriculum';
        const batchPromises = parsed.map(async (item: any) => {
          try {
            const strippedItem = stripUndefined({
              ...item,
              classId: activeClassId,
              createdBy: user.uid,
              createdAt: new Date().toISOString(),
              source: file.name
            });
            await addDoc(collection(db, collectionName), strippedItem);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, collectionName, auth);
          }
        });
        await Promise.all(batchPromises);
        totalUploaded++;
      } catch (err) {
        console.error(`Error parsing curriculum file ${file.name}:`, err);
        totalFailed++;
      }
    };

    // Process files in small chunks to avoid overwhelming the API
    const chunkSize = 2;
    for (let i = 0; i < filesArray.length; i += chunkSize) {
      const chunk = filesArray.slice(i, i + chunkSize);
      await Promise.all(chunk.map(file => processFile(file)));
    }

    setIsUploading(false);
    if (totalFailed > 0) {
      setUploadError(`Uploaded ${totalUploaded} file(s), but ${totalFailed} file(s) failed to parse.`);
    } else {
      setActiveTab('curriculum');
      showToast(`Successfully uploaded and parsed ${totalUploaded} curriculum guide(s)!`, "success");
    }
  };

  const handleGlobalStatusUpdate = async (type: 'daily' | 'general', id: string, status: LessonStatus, planData: any) => {
    if (!user) return;
    try {
      if (type === 'daily') {
        await updateDoc(doc(db, 'daily_lesson_plans', id), { status, createdBy: user.uid });
      } else {
        await updateDoc(doc(db, 'lesson_plans', id), { status, createdBy: user.uid });
      }

      const calendar = yearlyCalendars.find(c => c.subject === planData.subject && c.grade === planData.grade);
      if (calendar) {
        let updatedDays = [...calendar.days];
        const dayIdx = updatedDays.findIndex(d => d.lessonTitle === (planData.lesson_title || planData.lessonTitle));
        
        if (dayIdx !== -1) {
          const originalDay = updatedDays[dayIdx];
          
          if (status === 'Postponed') {
            const subsequentTeachingDays = updatedDays.slice(dayIdx).filter(d => d.isTeachingDay);
            if (subsequentTeachingDays.length > 1) {
              for (let i = subsequentTeachingDays.length - 1; i > 0; i--) {
                const target = subsequentTeachingDays[i];
                const source = subsequentTeachingDays[i - 1];
                const updatedTarget = {
                  ...target,
                  subject: source.subject,
                  grade: source.grade,
                  topic: source.topic,
                  subtopic: source.subtopic,
                  lessonTitle: source.lessonTitle,
                  objective: source.objective,
                  cycle: source.cycle,
                  week: source.week,
                  dayNumber: source.dayNumber,
                  learningOutcomes: source.learningOutcomes,
                  status: (source.status === 'Completed' || source.status === 'Taught' ? source.status : 'Not Started') as LessonStatus
                };
                const idxInMain = updatedDays.findIndex(d => d.id === target.id);
                updatedDays[idxInMain] = updatedTarget;
              }
            }
            updatedDays[dayIdx] = {
              ...updatedDays[dayIdx],
              status: 'Postponed',
              lessonTitle: `POSTPONED: ${originalDay.lessonTitle}`,
              topic: 'Rescheduling',
              subtopic: 'Curriculum Shift'
            };
          } else if (status === 'Skipped') {
            updatedDays[dayIdx] = { ...updatedDays[dayIdx], status: 'Skipped' };
          } else {
            updatedDays[dayIdx] = { ...updatedDays[dayIdx], status };
          }
          
          await updateDoc(doc(db, 'yearly_calendars', calendar.id!), { days: stripUndefined(updatedDays), createdBy: user.uid });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${type}_lesson_plans/${id}`, auth);
    }
  };

  const saveVisuals = async (parentId: string, visuals: any[], parentCollection: 'lesson_plans' | 'resources' | 'daily_lesson_plans' = 'lesson_plans') => {
    if (!visuals || visuals.length === 0) return;
    try {
      const visualsCollection = collection(db, parentCollection, parentId, 'visuals');
      for (const visual of visuals) {
        await addDoc(visualsCollection, stripUndefined({
          ...visual,
          parentId,
          classId: activeClassId,
          createdBy: user?.uid,
          createdAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${parentCollection}/${parentId}/visuals`, auth);
    }
  };

  const handleGenerateFullPack = async (plan: LessonPlan) => {
    if (!plan.id) return;
    setIsGenerating(true);
    try {
      const { generatedVisuals, ...fullPlan } = await generateLessonPlan({
        grade: plan.grade,
        subject: plan.subject,
        cycle: plan.cycle,
        week: plan.week || 1,
        day: 1, // Default or extract from plan
        topic: plan.topic,
        subtopic: plan.subtopic,
        lessonTitle: plan.lessonTitle,
        objectives: plan.specificObjectives || [],
        learningOutcome: plan.learningOutcome,
        duration: plan.duration,
        teachingModel: plan.teachingModel,
        style: plan.style,
        includeTeacherScript: plan.includeTeacherScript,
        includeDifferentiation: plan.includeDifferentiation,
        languageArtsStructure: userSettings.languageArtsStructure
      });

      let laResourcePack = null;
      if (plan.subject === 'Language Arts') {
        laResourcePack = await generateLanguageArtsResourcePack({
          grade: plan.grade,
          subject: plan.subject,
          cycle: plan.cycle,
          week: plan.week || 1,
          topic: plan.topic,
          learningOutcomes: [plan.learningOutcome]
        });
      }
      
      const strippedPlan = stripUndefined({
        ...fullPlan,
        languageArtsResourcePack: laResourcePack,
        isReadyToTeach: true
      });
      const docRef = doc(db, 'lesson_plans', plan.id);
      await updateDoc(docRef, strippedPlan as any);
      
      // Save visuals to subcollection
      if (generatedVisuals) {
        await saveVisuals(plan.id, generatedVisuals);
      }
      
      // Update local state
      setLessonPlans(prev => prev.map(p => p.id === plan.id ? { ...p, ...fullPlan, languageArtsResourcePack: laResourcePack, isReadyToTeach: true } : p));
      if (viewingPlan?.id === plan.id) setViewingPlan({ ...viewingPlan, ...fullPlan, languageArtsResourcePack: laResourcePack, isReadyToTeach: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lesson_plans/${plan.id}`, auth);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateLessonVideo = async (
    lesson: LessonPlan,
    mode: VideoMode,
    length: VideoLength,
    voiceSettings: { gender: VoiceGender; tone: VoiceTone; pace: VoicePace },
    avatarSettings: { enabled: boolean; style: AvatarStyle; placement: AvatarPlacement }
  ) => {
    if (!user || !lesson.id) return;
    setIsGenerating(true);
    try {
      // Stage 1: Generate Content (Script & Scenes)
      const video = await generateLessonVideo(lesson, mode, length, voiceSettings, avatarSettings);
      
      // Ensure all scenes have IDs
      if (video.scenes) {
        video.scenes = video.scenes.map((scene, idx) => ({
          ...scene,
          id: scene.id || `scene_${idx}_${Math.random().toString(36).substr(2, 5)}`
        }));
      }

      const docRef = doc(db, 'lesson_plans', lesson.id);
      const initialVideo: LessonVideo = {
        ...video,
        videoStatus: 'script_ready',
        status: 'Generating',
        stages: {
          ...video.stages,
          script: 'Completed',
          scenes: 'Completed',
          voiceover: 'Pending',
          visuals: 'Pending',
          assembly: 'Pending'
        }
      };

      await updateDoc(docRef, { lessonVideo: stripUndefined(initialVideo) });
      setViewingPlan(prev => prev?.id === lesson.id ? { ...prev, lessonVideo: initialVideo } : prev);

      // Stage 1b: Generate Resource Pack
      try {
        const resourcePack = await generateVideoResourcePack(lesson, initialVideo);
        await updateDoc(docRef, { 'lessonVideo.resourcePack': stripUndefined(resourcePack) });
        setViewingPlan(prev => prev?.id === lesson.id && prev.lessonVideo ? { 
          ...prev, 
          lessonVideo: { ...prev.lessonVideo, resourcePack } 
        } : prev);
      } catch (resourceError) {
        console.error("Resource Pack Generation Error:", resourceError);
        // We don't fail the whole process if just the resource pack fails
      }

      // Stage 2: Generate Audio (TTS)
      await updateDoc(docRef, { 'lessonVideo.stages.voiceover': 'Generating' });
      const updatedScenes = [...video.scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.narration) continue;

        try {
          const base64Audio = await generateSceneAudio(scene.narration, voiceSettings);
          if (base64Audio) {
            const audioUrl = await uploadAudio(base64Audio, lesson.id, scene.id);
            updatedScenes[i].audioUrl = audioUrl;
          }
        } catch (audioErr) {
          console.error(`Error generating audio for scene ${i}:`, audioErr);
          // Continue with other scenes, but this might cause issues during rendering
        }
      }
      
      await updateDoc(docRef, { 
        'lessonVideo.scenes': updatedScenes,
        'lessonVideo.stages.voiceover': 'Completed',
        'lessonVideo.videoStatus': 'audio_ready'
      });

      // Stage 3: Generate Visuals (Images)
      await updateDoc(docRef, { 'lessonVideo.stages.visuals': 'Generating' });
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.visualDescription) continue;

        try {
          const dataUrl = await generateSceneVisual(scene.visualDescription, lesson.grade);
          if (dataUrl) {
            const imageUrl = await uploadThumbnail(dataUrl, lesson.id); // Reusing uploadThumbnail for scene images
            updatedScenes[i].visualUrl = imageUrl;
          }
        } catch (visualErr) {
          console.error(`Error generating visual for scene ${i}:`, visualErr);
        }
      }

      const visualsReadyVideo: LessonVideo = {
        ...initialVideo,
        scenes: updatedScenes,
        videoStatus: 'visuals_ready',
        stages: {
          ...initialVideo.stages,
          voiceover: 'Completed',
          visuals: 'Completed'
        }
      };

      await updateDoc(docRef, { lessonVideo: stripUndefined(visualsReadyVideo) });
      setViewingPlan(prev => prev?.id === lesson.id ? { ...prev, lessonVideo: visualsReadyVideo } : prev);
      
      showToast("Video script, audio, and visuals are ready! Click 'Render MP4' to finalize.", "success");
    } catch (err) {
      console.error("Video Generation Error:", err);
      handleFirestoreError(err, OperationType.UPDATE, `lesson_plans/${lesson.id}`, auth);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRenderFinalVideo = async (lesson: LessonPlan) => {
    if (!user || !lesson.id || !lesson.lessonVideo) return;
    setIsGenerating(true);
    try {
      const video = lesson.lessonVideo;
      const docRef = doc(db, 'lesson_plans', lesson.id);

      await updateDoc(docRef, { 
        'lessonVideo.videoStatus': 'rendering',
        'lessonVideo.stages.assembly': 'Generating'
      });

      // Stage 4: Render Final Video
      const videoBlob = await renderVideo(video.scenes, (progress) => {
        console.log(`Render Progress: ${progress.stage} - ${progress.progress}%`);
      });

      const finalVideoUrl = await uploadVideo(videoBlob, lesson.id);
      const thumbnailUrl = video.scenes[0]?.visualUrl || '';

      const completedVideo: LessonVideo = {
        ...video,
        videoStatus: 'completed',
        status: 'Ready',
        finalVideoUrl,
        thumbnailUrl,
        stages: {
          ...video.stages,
          assembly: 'Completed'
        },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, { lessonVideo: stripUndefined(completedVideo) });
      
      setLessonPlans(prev => prev.map(p => p.id === lesson.id ? { ...p, lessonVideo: completedVideo } : p));
      if (viewingPlan?.id === lesson.id) setViewingPlan({ ...viewingPlan, lessonVideo: completedVideo });
      
      showToast("Lesson video rendered successfully!", "success");
    } catch (err) {
      console.error("Video Rendering Error:", err);
      const docRef = doc(db, 'lesson_plans', lesson.id);
      await updateDoc(docRef, { 'lessonVideo.videoStatus': 'failed' });
      handleFirestoreError(err, OperationType.UPDATE, `lesson_plans/${lesson.id}`, auth);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdatePlan = async (plan: LessonPlan) => {
    if (!plan.id) return;
    try {
      const { generatedVisuals, ...planData } = plan;
      const strippedPlan = stripUndefined(planData);
      const docRef = doc(db, 'lesson_plans', plan.id);
      await updateDoc(docRef, strippedPlan as any);
      
      // Update local state
      setLessonPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
      if (viewingPlan?.id === plan.id) setViewingPlan(plan);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `lesson_plans/${plan.id}`, auth);
    }
  };

  const handleSaveAssessmentRecord = async (record: Omit<AssessmentRecord, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!user) return;
    try {
      const newRecord = {
        ...record,
        classId: activeClassId,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      };
      await addDoc(collection(db, 'assessment_records'), newRecord);

      // Update coverage records based on assessment
      const existingCoverage = coverageRecords.find(c => 
        c.grade === record.grade && 
        c.subject === record.subject && 
        c.outcome === record.outcome
      );

      const status = record.objectiveMastery === 'Mastered' ? 'Mastered' : 
                     record.objectiveMastery === 'Partially met' ? 'Partially Covered' : 'Not Covered';

      if (existingCoverage) {
        await updateDoc(doc(db, 'coverage_records', existingCoverage.id), {
          status,
          lastTaughtDate: record.date
        });
      } else {
        await addDoc(collection(db, 'coverage_records'), {
          grade: record.grade,
          subject: record.subject,
          cycleNumber: record.cycle,
          outcome: record.outcome,
          status,
          lastTaughtDate: record.date,
          classId: activeClassId,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
      }

      // Update Outcome Mastery
      // For now, we'll use the lesson title or objectives as the outcome name
      const outcomeName = record.lessonTitle;
      const existingMastery = outcomeMastery.find(m => m.outcome === outcomeName);
      
      if (existingMastery) {
        const masteryRef = doc(db, 'outcome_mastery', existingMastery.id!);
        await updateDoc(masteryRef, {
          status: record.objectiveMastery === 'Mastered' ? 'Mastered' : 
                  record.objectiveMastery === 'Partially met' ? 'Partially mastered' : 'Needs reteach',
          lastAssessed: new Date().toISOString(),
          relatedLessonIds: [...(existingMastery.relatedLessonIds || []), record.lessonId]
        });
      } else {
        const newMastery: Omit<OutcomeMastery, 'id'> = {
          outcome: outcomeName,
          grade: record.grade,
          subject: record.subject,
          topic: record.lessonTitle,
          status: record.objectiveMastery === 'Mastered' ? 'Mastered' : 
                  record.objectiveMastery === 'Partially met' ? 'Partially mastered' : 'Needs reteach',
          lastAssessed: new Date().toISOString(),
          relatedLessonIds: [record.lessonId],
          classId: activeClassId,
          createdBy: user.uid
        };
        await addDoc(collection(db, 'outcome_mastery'), newMastery);
      }

      // Log Misconceptions
      if (record.classPerformanceNotes.whatStudentsStruggledWith) {
        const newMisconception: Omit<MisconceptionLog, 'id'> = {
          subject: record.subject,
          topic: record.lessonTitle,
          misconception: record.classPerformanceNotes.whatStudentsStruggledWith,
          frequency: 1,
          lastNoticed: new Date().toISOString(),
          suggestedCorrection: record.classPerformanceNotes.whatNeedsReteaching || 'Review concept with visual aids',
          classId: activeClassId,
          createdBy: user.uid
        };
        await addDoc(collection(db, 'misconception_logs'), newMisconception);
      }

      // Add Support Flags
      if (record.classPerformanceNotes.studentsNeedingSupport) {
        const newFlag: Omit<StudentSupportFlag, 'id'> = {
          category: 'Learning Support',
          description: `Support needed for: ${record.classPerformanceNotes.studentsNeedingSupport}`,
          studentCount: record.results.studentsNeedingSupport || 1,
          notes: `Identified during lesson: ${record.lessonTitle}`,
          classId: activeClassId,
          createdBy: user.uid
        };
        await addDoc(collection(db, 'student_support_flags'), newFlag);
      }

      setIsCheckInOpen(false);
      setCheckInLesson(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'assessment_records', auth);
    }
  };

  // Curriculum Mapping Engine Handlers
  const handleGenerateYearlyMap = async (grade: GradeLevel, subject: Subject) => {
    if (!user) return;
    if (!academicCalendar) {
      showToast("Please set up your Academic Calendar first in the 'Calendar' tab of the Mapping Engine.", "error");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const subjectCurriculum = curriculum.filter(c => c.grade === grade && c.subject === subject);
      const subjectUnits = curriculumUnits.filter(u => u.grade === grade && u.subject === subject);
      if (subjectCurriculum.length === 0 && subjectUnits.length === 0) {
        throw new Error(`No curriculum data or teacher's guide units found for ${grade} ${subject}. Please upload curriculum documents first.`);
      }

      const map = await generateYearlyCurriculumMap(grade, subject, subjectCurriculum, academicCalendar, userSettings.languageArtsStructure, subjectUnits);
      
      // Save to Firestore
      const existingMap = yearlyCurriculumMaps.find(m => m.grade === grade && m.subject === subject);
      if (existingMap) {
        await updateDoc(doc(db, 'yearly_curriculum_maps', existingMap.id), {
          ...map,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'yearly_curriculum_maps'), {
          ...map,
          classId: activeClassId,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
      }

      // Initialize coverage records
      for (const cycle of map.cycles) {
        for (const topic of cycle.topics) {
          for (const outcome of topic.outcomes) {
            const exists = coverageRecords.find(c => c.grade === grade && c.subject === subject && c.outcome === outcome);
            if (!exists) {
              await addDoc(collection(db, 'coverage_records'), {
                grade,
                subject,
                cycleNumber: cycle.cycleNumber,
                outcome,
                status: 'Not Covered',
                classId: activeClassId,
                createdBy: user.uid,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateCyclePlan = async (map: YearlyCurriculumMap, cycle: number) => {
    if (!user) return;
    if (!academicCalendar) {
      showToast("Please set up your Academic Calendar first.", "error");
      return;
    }
    setIsUploading(true);
    try {
      const subjectUnits = curriculumUnits.filter(u => u.grade === map.grade && u.subject === map.subject);
      const plan = await generateCyclePlan(map, cycle, academicCalendar, userSettings.languageArtsStructure, subjectUnits);
      
      const existingPlan = cyclePlans.find(p => 
        p.grade === map.grade && 
        p.subject === map.subject && 
        p.cycleNumber === cycle
      );

      if (existingPlan) {
        await updateDoc(doc(db, 'cycle_plans', existingPlan.id), {
          ...plan,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'cycle_plans'), {
          ...plan,
          classId: activeClassId,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateWeeklyPlan = async (cyclePlan: CyclePlan, week: number) => {
    if (!user) return;
    if (!academicCalendar) {
      showToast("Please set up your Academic Calendar first.", "error");
      return;
    }
    setIsUploading(true);
    try {
      const subjectUnits = curriculumUnits.filter(u => u.grade === cyclePlan.grade && u.subject === cyclePlan.subject);
      const plan = await generateWeeklyTeachingPlan(cyclePlan, week, academicCalendar, userSettings.languageArtsStructure, subjectUnits);
      
      const existingPlan = weeklyTeachingPlans.find(p => 
        p.grade === cyclePlan.grade && 
        p.subject === cyclePlan.subject && 
        p.cycleNumber === cyclePlan.cycleNumber &&
        p.weekNumber === week
      );

      if (existingPlan) {
        await updateDoc(doc(db, 'weekly_teaching_plans', existingPlan.id), {
          ...plan,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'weekly_teaching_plans'), {
          ...plan,
          classId: activeClassId,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateCalendar = async (calendar: AcademicCalendar) => {
    if (!user) return;
    try {
      if (calendar.id) {
        await updateDoc(doc(db, 'academic_calendars', calendar.id), {
          ...calendar,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'academic_calendars'), {
          ...calendar,
          classId: activeClassId,
          createdBy: user.uid,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'academic_calendars', auth);
    }
  };

  const handleUpdateCoverage = async (record: CoverageRecord) => {
    if (!user || !record.id) return;
    try {
      await updateDoc(doc(db, 'coverage_records', record.id), {
        ...record,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'coverage_records', auth);
    }
  };

  const handleGenerateReteach = async (record: AssessmentRecord) => {
    if (!user) return;
    const lesson = lessonPlans.find(p => p.id === record.lessonId) || 
                   dailyLessonPlans.find(p => p.id === record.lessonId);
    
    if (!lesson) {
      console.error('Lesson not found for reteach generation');
      return;
    }

    setLoading(true);
    try {
      const { generatedVisuals, ...reteachPlan } = await generateReteachLesson(lesson as any, record);
      const docRef = await addDoc(collection(db, 'lesson_plans'), {
        ...reteachPlan,
        status: 'Planned',
        classId: activeClassId,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      
      if (generatedVisuals) {
        await saveVisuals(docRef.id, generatedVisuals);
      }
      
      setViewingPlan({ id: docRef.id, ...reteachPlan, generatedVisuals } as LessonPlan);
      setActiveTab('saved');
    } catch (err) {
      console.error('Error generating reteach lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIntervention = async (record: AssessmentRecord) => {
    if (!user) return;
    const lesson = lessonPlans.find(p => p.id === record.lessonId) || 
                   dailyLessonPlans.find(p => p.id === record.lessonId);
    
    if (!lesson) {
      console.error('Lesson not found for intervention generation');
      return;
    }

    setLoading(true);
    try {
      const interventionWork = await generateInterventionWork(lesson as any, record);
      const docRef = await addDoc(collection(db, 'resources'), {
        type: 'Intervention Work',
        content: interventionWork,
        planId: lesson.id,
        classId: activeClassId,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      setViewingResource({ id: docRef.id, type: 'Intervention Work', content: interventionWork, planId: lesson.id });
      setActiveTab('resources');
    } catch (err) {
      console.error('Error generating intervention work:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCatchUp = async (lesson: LessonPlan) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { generatedVisuals, ...catchUpLesson } = await generateCatchUpLesson(lesson);
      const docRef = await addDoc(collection(db, 'lesson_plans'), {
        ...catchUpLesson,
        status: 'Planned',
        classId: activeClassId,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        isCatchUp: true
      });
      
      if (generatedVisuals) {
        await saveVisuals(docRef.id, generatedVisuals, 'lesson_plans');
      }
      
      setViewingPlan({ id: docRef.id, ...catchUpLesson, generatedVisuals } as LessonPlan);
      setActiveTab('saved');
    } catch (err) {
      console.error('Error generating catch-up lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRevisionWeek = async (grade: GradeLevel, subject: Subject, cycle: number) => {
    if (!user) return;
    const weakOutcomes = outcomeMastery.filter(m => m.grade === grade && m.subject === subject && m.status === 'Needs reteach');
    const relevantMisconceptions = misconceptionLogs.filter(m => m.subject === subject);
    
    setLoading(true);
    try {
      const revisionWeek = await generateRevisionWeek(grade, subject, weakOutcomes, relevantMisconceptions);
      const docRef = await addDoc(collection(db, 'weekly_curriculum_plans'), {
        ...revisionWeek,
        classId: activeClassId,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      setViewingWeeklyPlan({ id: docRef.id, ...revisionWeek } as WeeklyCurriculumPlan);
      setActiveTab('weekly-plan-detail');
    } catch (err) {
      console.error('Error generating revision week:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
            <BookMarked className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Hassan Planner</h1>
            <p className="text-gray-500">The professional educational productivity platform for teachers.</p>
          </div>
          <Button onClick={signInWithGoogle} className="w-full py-6 text-lg">
            Sign in with Google
          </Button>
          <p className="text-xs text-gray-400">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <BookMarked className="w-6 h-6" />
          </div>
          <span className="font-bold text-gray-900 leading-tight">EduPlan<br/>Builder</span>
        </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
          />
          <NavButton 
            active={activeTab === 'mapping'} 
            onClick={() => setActiveTab('mapping')} 
            icon={<MapIcon className="w-5 h-5" />} 
            label="Curriculum Mapping" 
          />
          <NavButton 
            active={activeTab === 'assessment-tracker'} 
            onClick={() => setActiveTab('assessment-tracker')} 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="Assessment Tracker" 
          />
          <NavButton 
            active={activeTab === 'curriculum'} 
            onClick={() => setActiveTab('curriculum')} 
            icon={<BookOpen className="w-5 h-5" />} 
            label="Curriculum Library" 
          />
          <NavButton 
            active={activeTab === 'cycleUnitPlans'} 
            onClick={() => setActiveTab('cycleUnitPlans')} 
            icon={<ListChecks className="w-5 h-5" />} 
            label="Cycle Unit Plans" 
          />
          <NavButton 
            active={activeTab === 'pacingMap'} 
            onClick={() => setActiveTab('pacingMap')} 
            icon={<CalendarRange className="w-5 h-5" />} 
            label="Week-to-Topic Mapping" 
          />
          <NavButton 
            active={activeTab === 'planner'} 
            onClick={() => setActiveTab('planner')} 
            icon={<Plus className="w-5 h-5" />} 
            label="Lesson Planner" 
          />
          <NavButton 
            active={activeTab === 'yearlyCalendar'} 
            onClick={() => setActiveTab('yearlyCalendar')} 
            icon={<Calendar className="w-5 h-5" />} 
            label="School Year Calendar" 
          />
          <NavButton 
            active={activeTab === 'saved'} 
            onClick={() => setActiveTab('saved')} 
            icon={<StickyNote className="w-5 h-5" />} 
            label="Saved Plans" 
          />
          <NavButton 
            active={activeTab === 'templates'} 
            onClick={() => setActiveTab('templates')} 
            icon={<Layout className="w-5 h-5" />} 
            label="Templates" 
          />
          <NavButton 
            active={activeTab === 'resources'} 
            onClick={() => setActiveTab('resources')} 
            icon={<Layers className="w-5 h-5" />} 
            label="Resource Gen" 
          />
          <NavButton 
            active={activeTab === 'video-studio'} 
            onClick={() => setActiveTab('video-studio')} 
            icon={<Video className="w-5 h-5" />} 
            label="Lesson Video Studio" 
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
          />
          <NavButton 
            active={activeTab === 'help'} 
            onClick={() => setActiveTab('help')} 
            icon={<HelpCircle className="w-5 h-5" />} 
            label="Help & Manual" 
          />
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-2 mb-4">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h1>
            </div>
            
            {currentClass && (
              <div className="h-8 w-px bg-gray-200 hidden md:block" />
            )}

            {currentClass && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Current Class</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-indigo-600">{currentClass.name}</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider border border-indigo-100">
                      {currentClass.grade}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsClassSelectionOpen(true)}
                  className="h-8 px-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Switch
                </Button>
              </div>
            )}

            {currentClass && (
              <div className="h-8 w-px bg-gray-200 hidden md:block" />
            )}

            {currentClass && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Subject</span>
                  <select
                    className="text-sm font-bold text-gray-700 bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:text-indigo-600 transition-colors"
                    value={activeSubject || ''}
                    onChange={(e) => setActiveSubject(e.target.value as Subject)}
                  >
                    <option value="">All Subjects</option>
                    {['Mathematics', 'Language Arts', 'Science and Technology', 'Belizean Studies', 'HFLE', 'Spanish', 'PE', 'Creative Arts'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search everything..." className="pl-10 w-64 bg-gray-50 border-none" />
            </div>
            <Button size="sm" onClick={() => setActiveTab('planner')}>
              <Plus className="w-4 h-4" />
              New Plan
            </Button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      icon={<BookOpen className="text-indigo-600" />} 
                      label="Curriculum" 
                      value={curriculum.length + curriculumUnits.length} 
                      color="bg-indigo-50" 
                    />
                    <StatCard 
                      icon={<Target className="text-emerald-600" />} 
                      label="Teaching Progress" 
                      value={`${overallProgress.percentage}%`} 
                      color="bg-emerald-50" 
                    />
                    <StatCard 
                      icon={<StickyNote className="text-amber-600" />} 
                      label="Weekly Maps" 
                      value={weeklyPlans.length} 
                      color="bg-amber-50" 
                    />
                    <StatCard 
                      icon={<Users className="text-rose-600" />} 
                      label="Class Levels" 
                      value={new Set([...curriculum.map(c => c.grade), ...curriculumUnits.map(u => u.grade)]).size} 
                      color="bg-rose-50" 
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Instructional Pacing</h2>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('mapping')}>View Full Map</Button>
                      </div>
                      <PacingDashboard 
                        calendar={academicCalendar}
                        map={yearlyCurriculumMaps[0]}
                        cyclePlan={cyclePlans[0]}
                        coverage={coverageRecords}
                        grade={userSettings.defaultGrade as GradeLevel}
                        subject={userSettings.defaultSubject as Subject}
                        cycle={1}
                      />
                      
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Recent Activity</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                      </div>
                      <Card className="divide-y divide-gray-50">
                        {[...lessonPlans, ...weeklyPlans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((item: any) => (
                          <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                            if (item.lessonTitle) {
                              setViewingPlan(item);
                            } else {
                              setViewingWeeklyPlan(item);
                            }
                            setActiveTab('saved');
                          }}>
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.lessonTitle ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600')}>
                              {item.lessonTitle ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{item.lessonTitle || item.weeklyTopic}</p>
                              <p className="text-sm text-gray-500">{item.subject} • {item.grade} • {item.lessonTitle ? `Week ${item.week}` : `Week ${item.weekNumber}`}</p>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                        ))}
                        {lessonPlans.length === 0 && weeklyPlans.length === 0 && (
                          <div className="p-12 text-center space-y-3">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                              <Zap className="w-6 h-6" />
                            </div>
                            <p className="text-gray-500">No activity yet. Start by uploading curriculum or planning a lesson.</p>
                            <Button variant="outline" size="sm" onClick={() => setActiveTab('planner')}>Start Planning</Button>
                          </div>
                        )}
                      </Card>
                    </div>

                    <div className="space-y-6">
                      {currentCycleInfo && (
                        <Card className="p-6 bg-indigo-900 text-white space-y-4 shadow-xl shadow-indigo-100">
                          <div className="flex items-center gap-2 text-indigo-300">
                            <CalendarRange className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Current Pacing</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold leading-tight">Cycle {currentCycleInfo.cycle} • Week {currentCycleInfo.week}</h3>
                            <p className="text-indigo-300 text-xs mt-1">{currentCycleInfo.subject} • {currentCycleInfo.grade}</p>
                          </div>
                          {currentCycleInfo.pacingMap && (
                            <div className="p-3 bg-white/10 rounded-xl space-y-1">
                              <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">Current Topic</p>
                              <p className="text-sm font-bold">{currentCycleInfo.pacingMap.weeks.find(w => w.weekNumber === currentCycleInfo.week)?.topic || 'Topic not mapped'}</p>
                            </div>
                          )}
                          <div className="pt-2">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="bg-white text-indigo-900 hover:bg-indigo-50 w-full"
                              onClick={() => setActiveTab('mapping')}
                            >
                              View Curriculum Map
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </Card>
                      )}

                      {resumeLesson && (
                        <Card className="p-6 bg-indigo-900 text-white space-y-4 shadow-xl shadow-indigo-100">
                          <div className="flex items-center gap-2 text-indigo-300">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Resume Teaching</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold leading-tight">{resumeLesson.lesson.lessonTitle}</h3>
                            <p className="text-indigo-300 text-xs mt-1">{resumeLesson.lesson.subject} • {resumeLesson.lesson.grade}</p>
                          </div>
                          <div className="pt-4 border-t border-white/10 flex gap-2">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="bg-white text-indigo-900 hover:bg-indigo-50 w-full"
                              onClick={() => {
                                setActiveTab('yearlyCalendar');
                              }}
                            >
                              Go to Lesson
                            </Button>
                          </div>
                        </Card>
                      )}
                      
                      {yearlyCalendars.length > 0 && yearlyCalendars[0].metadata && (
                        <Card className="p-6 space-y-4 border-emerald-100 bg-emerald-50/30">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Academic Year Summary</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teaching Weeks</p>
                              <p className="text-xl font-bold text-gray-900">{yearlyCalendars[0].metadata.totalWeeks}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teaching Days</p>
                              <p className="text-xl font-bold text-gray-900">{yearlyCalendars[0].metadata.totalTeachingDays}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Holidays</p>
                              <p className="text-xl font-bold text-rose-600">{yearlyCalendars[0].metadata.totalHolidays}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completion</p>
                              <p className="text-xl font-bold text-emerald-600">{overallProgress.percentage}%</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-emerald-600 hover:bg-emerald-100"
                            onClick={() => setActiveTab('yearlyCalendar')}
                          >
                            Manage Academic Calendar
                          </Button>
                        </Card>
                      )}

                      <h2 className="text-xl font-bold">Quick Actions</h2>
                      <div className="grid grid-cols-1 gap-4">
                        <QuickAction 
                          icon={<Upload className="w-5 h-5" />} 
                          title="Upload Curriculum" 
                          desc="Import PDF/DOCX guides" 
                          onClick={() => setActiveTab('curriculum')}
                          color="bg-indigo-600"
                        />
                        <QuickAction 
                          icon={<Plus className="w-5 h-5" />} 
                          title="New Lesson Plan" 
                          desc="Generate from curriculum" 
                          onClick={() => setActiveTab('planner')}
                          color="bg-emerald-600"
                        />
                        <QuickAction 
                          icon={<Layers className="w-5 h-5" />} 
                          title="Create Worksheet" 
                          desc="Generate teaching aids" 
                          onClick={() => setActiveTab('resources')}
                          color="bg-amber-600"
                        />
                      </div>

                      <Card className="p-6 bg-indigo-900 text-white space-y-4">
                        <div className="flex items-center gap-2 text-indigo-300">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Pro Tip</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          Upload your school's specific curriculum guides to ensure AI-generated plans align perfectly with your requirements.
                        </p>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'video-studio' && (
                <LessonVideoStudio 
                  lessonPlans={lessonPlans}
                  onGenerateVideo={handleGenerateLessonVideo}
                  isGenerating={isGenerating}
                  onViewLesson={(plan) => {
                    setViewingPlan(plan);
                    setActiveTab('saved');
                  }}
                />
              )}

              {activeTab === 'mapping' && (
                <CurriculumMappingEngine 
                  calendar={academicCalendar}
                  yearlyMaps={yearlyCurriculumMaps}
                  cyclePlans={cyclePlans}
                  weeklyPlans={weeklyTeachingPlans}
                  curriculumUnits={curriculumUnits}
                  coverage={coverageRecords}
                  onGenerateYearlyMap={handleGenerateYearlyMap}
                  onGenerateCyclePlan={handleGenerateCyclePlan}
                  onGenerateWeeklyPlan={handleGenerateWeeklyPlan}
                  onUpdateCalendar={handleUpdateCalendar}
                  onUpdateCoverage={handleUpdateCoverage}
                  isGenerating={isUploading}
                  error={uploadError}
                />
              )}

              {activeTab === 'curriculum' && (
                <CurriculumView 
                  curriculum={curriculum} 
                  curriculumUnits={curriculumUnits}
                  onDelete={async (id) => {
                    try {
                      await deleteDoc(doc(db, 'curriculum', id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `curriculum/${id}`, auth);
                    }
                  }} 
                  onDeleteUnit={async (id) => {
                    try {
                      await deleteDoc(doc(db, 'curriculum_units', id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `curriculum_units/${id}`, auth);
                    }
                  }}
                  onUpload={handleFileUpload}
                  onSaveManual={async (entry) => {
                    if (!user) return;
                    try {
                      const strippedEntry = stripUndefined(entry);
                      const { id, ...data } = strippedEntry;
                      if (id && curriculum.some(c => c.id === id)) {
                        await updateDoc(doc(db, 'curriculum', id), {
                          ...data,
                          createdBy: user.uid,
                          updatedAt: new Date().toISOString()
                        });
                      } else {
                        await addDoc(collection(db, 'curriculum'), {
                          ...data,
                          classId: activeClassId,
                          createdBy: user.uid,
                          createdAt: new Date().toISOString()
                        });
                      }
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, 'curriculum', auth);
                    }
                  }}
                  isUploading={isUploading}
                  setActiveTab={setActiveTab}
                  uploadError={uploadError}
                  onUseInPlan={(entry) => {
                    setPrefillData({
                      grade: entry.grade,
                      subject: entry.subject,
                      cycle: entry.cycle,
                      topic: entry.topic,
                      subtopic: entry.subtopic,
                      outcomes: entry.learning_outcomes
                    });
                    setActiveTab('planner');
                  }}
                  onLoadSample={handleLoadSample}
                />
              )}

              {activeTab === 'cycleUnitPlans' && (
                <CycleUnitPlansView 
                  curriculum={curriculum} 
                  setActiveTab={setActiveTab}
                  setPrefillData={setPrefillData}
                />
              )}

              {activeTab === 'pacingMap' && (
                <CyclePacingView 
                  curriculum={curriculum}
                  yearlyCalendars={yearlyCalendars}
                  cyclePacingMaps={cyclePacingMaps}
                  userSettings={userSettings}
                  setActiveTab={setActiveTab}
                  onSave={async (map) => {
                    if (!user) return;
                    try {
                      const strippedMap = stripUndefined(map);
                      const existing = cyclePacingMaps.find(m => m.grade === map.grade && m.subject === map.subject && m.cycle === map.cycle);
                      if (existing) {
                        await updateDoc(doc(db, 'cycle_pacing_maps', existing.id!), { 
                          ...strippedMap, 
                          createdBy: user.uid 
                        });
                      } else {
                        await addDoc(collection(db, 'cycle_pacing_maps'), {
                          ...strippedMap,
                          classId: activeClassId,
                          createdBy: user.uid,
                          createdAt: new Date().toISOString()
                        });
                      }
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, 'cycle_pacing_maps', auth);
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      await deleteDoc(doc(db, 'cycle_pacing_maps', id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `cycle_pacing_maps/${id}`, auth);
                    }
                  }}
                />
              )}

              {activeTab === 'yearlyCalendar' && (
                <YearlyCalendarView 
                  curriculum={curriculum}
                  weeklyPlans={weeklyPlans}
                  dailyLessonPlans={dailyLessonPlans}
                  yearlyCalendars={yearlyCalendars}
                  cyclePacingMaps={cyclePacingMaps}
                  userSettings={userSettings}
                  setActiveTab={setActiveTab}
                  setPrefillData={setPrefillData}
                  onSave={async (calendar) => {
                    if (!user) return;
                    try {
                      const strippedCalendar = stripUndefined(calendar);
                      if (calendar.id) {
                        await updateDoc(doc(db, 'yearly_calendars', calendar.id), { 
                          ...strippedCalendar, 
                          createdBy: user.uid 
                        });
                      } else {
                        await addDoc(collection(db, 'yearly_calendars'), {
                          ...strippedCalendar,
                          classId: activeClassId,
                          createdBy: user.uid,
                          createdAt: new Date().toISOString()
                        });
                      }
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, 'yearly_calendars', auth);
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      await deleteDoc(doc(db, 'yearly_calendars', id));
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `yearly_calendars/${id}`, auth);
                    }
                  }}
                />
              )}

              {activeTab === 'planner' && (
                <PlannerView 
                  curriculum={curriculum} 
                  setActiveTab={setActiveTab}
                  dailyLessonPlans={dailyLessonPlans}
                  yearlyCalendars={yearlyCalendars}
                  cyclePacingMaps={cyclePacingMaps}
                  userSettings={userSettings}
                  prefillData={prefillData}
                  onSave={async (plan) => {
                    if (Object.keys(plan).length > 0) {
                      try {
                        const { generatedVisuals, ...planData } = plan;
                        const strippedPlan = stripUndefined({
                          ...planData,
                          isReadyToTeach: true
                        });
                        const docRef = await addDoc(collection(db, 'lesson_plans'), {
                          ...strippedPlan,
                          classId: activeClassId,
                          createdBy: user.uid,
                          createdAt: new Date().toISOString()
                        });

                        if (generatedVisuals && generatedVisuals.length > 0) {
                          await saveVisuals(docRef.id, generatedVisuals, 'lesson_plans');
                        }
                      } catch (err) {
                        handleFirestoreError(err, OperationType.CREATE, 'lesson_plans', auth);
                      }
                    }
                    setPrefillData(null);
                    setActiveTab('saved');
                  }}
                  onGenerateResource={async (plan, type) => {
                    const res = await generateResource(type, plan.structured_json);
                    setGeneratedResource({ type, content: res, planId: plan.id });
                    setActiveTab('resources');
                  }}
                />
              )}

              {activeTab === 'saved' && (
                viewingPlan ? (
                  <motion.div
                    key="plan-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <SavedPlanDetailView 
                      plan={viewingPlan} 
                      onBack={() => setViewingPlan(null)} 
                      onUpdateStatus={async (id, status) => {
                        await handleGlobalStatusUpdate('general', id, status, viewingPlan);
                        setViewingPlan(prev => prev ? { ...prev, status } : null);
                      }}
                      onGenerateResource={async (plan, type) => {
                        const res = await generateResource(type, plan.structured_json);
                        setGeneratedResource({ type, content: res, planId: plan.id });
                        setActiveTab('resources');
                      }}
                      onGenerateFullPack={handleGenerateFullPack}
                      onUpdatePlan={handleUpdatePlan}
                      onOpenCheckIn={(lesson) => {
                        setCheckInLesson(lesson);
                        setIsCheckInOpen(true);
                      }}
                      onGenerateReteach={async (lesson) => {
                        const record = assessmentRecords.find(r => r.lessonId === lesson.id);
                        if (record) handleGenerateReteach(record);
                      }}
                      onGenerateIntervention={async (lesson) => {
                        const record = assessmentRecords.find(r => r.lessonId === lesson.id);
                        if (record) handleGenerateIntervention(record);
                      }}
                      onGenerateCatchUp={handleGenerateCatchUp}
                      onScheduleReview={() => {}} // TODO
                      onAddToRevisionWeek={() => {}} // TODO
                      onViewProgress={() => setActiveTab('assessment-tracker')}
                      onGenerateVideo={handleGenerateLessonVideo}
                      onRenderVideo={handleRenderFinalVideo}
                      isGenerating={isGenerating}
                    />
                  </motion.div>
                ) : viewingDailyPlan ? (
                  <motion.div
                    key="daily-plan-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Button variant="ghost" size="sm" onClick={() => setViewingDailyPlan(null)}>
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Saved Plans
                      </Button>
                    </div>
                    <SavedPlanDetailView 
                      plan={{
                        ...viewingDailyPlan.structured_json,
                        id: viewingDailyPlan.id,
                        grade: viewingDailyPlan.grade,
                        subject: viewingDailyPlan.subject,
                        topic: viewingDailyPlan.topic,
                        subtopic: viewingDailyPlan.subtopic,
                        learningOutcome: viewingDailyPlan.learning_outcome,
                        lessonTitle: viewingDailyPlan.lesson_title,
                        createdAt: viewingDailyPlan.createdAt,
                        createdBy: viewingDailyPlan.createdBy,
                        status: viewingDailyPlan.status,
                        teachingResources: viewingDailyPlan.teachingResources,
                        resourcePack: viewingDailyPlan.resourcePack,
                        beforeClassChecklist: viewingDailyPlan.beforeClassChecklist,
                        materialsNeeded: viewingDailyPlan.materialsNeeded,
                        isReadyToTeach: viewingDailyPlan.isReadyToTeach
                      }} 
                      parentCollection="daily_lesson_plans"
                      onBack={() => setViewingDailyPlan(null)}
                      onUpdateStatus={async (id, status) => {
                        await handleGlobalStatusUpdate('daily', viewingDailyPlan.id!, status, viewingDailyPlan);
                        setViewingDailyPlan(prev => prev ? { ...prev, status } : null);
                      }}
                      onGenerateResource={async (plan, type) => {
                        const res = await generateResource(type, plan.structured_json);
                        setGeneratedResource({ type, content: res, planId: plan.id });
                        setActiveTab('resources');
                      }}
                      onGenerateFullPack={async (plan) => {
                        // For daily plans, we update the daily_lesson_plans collection
                        try {
                          const { generatedVisuals, ...fullPlan } = await generateLessonPlan({
                            grade: plan.grade,
                            subject: plan.subject,
                            cycle: plan.cycle,
                            week: plan.week || 1,
                            day: 1,
                            topic: plan.topic,
                            subtopic: plan.subtopic,
                            lessonTitle: plan.lessonTitle,
                            objectives: plan.specificObjectives || [],
                            learningOutcome: plan.learningOutcome,
                            duration: plan.duration,
                            teachingModel: plan.teachingModel,
                            style: plan.style,
                            includeTeacherScript: plan.includeTeacherScript,
                            includeDifferentiation: plan.includeDifferentiation
                          });
                          const strippedPlan = stripUndefined({
                            ...fullPlan,
                            isReadyToTeach: true
                          });
                          await updateDoc(doc(db, 'daily_lesson_plans', viewingDailyPlan.id!), strippedPlan as any);
                          
                          // Save visuals to subcollection
                          if (generatedVisuals) {
                            await saveVisuals(viewingDailyPlan.id!, generatedVisuals, 'daily_lesson_plans');
                          }
                          
                          setViewingDailyPlan(prev => prev ? { ...prev, ...fullPlan, isReadyToTeach: true } : null);
                        } catch (err) {
                          handleFirestoreError(err, OperationType.UPDATE, `daily_lesson_plans/${viewingDailyPlan.id}`, auth);
                        }
                      }}
                      onUpdatePlan={async (plan) => {
                        try {
                          const { generatedVisuals, ...planData } = plan;
                          const strippedPlan = stripUndefined(planData);
                          await updateDoc(doc(db, 'daily_lesson_plans', viewingDailyPlan.id!), strippedPlan as any);
                          setViewingDailyPlan(prev => prev ? { ...prev, ...plan } : null);
                        } catch (err) {
                          handleFirestoreError(err, OperationType.UPDATE, `daily_lesson_plans/${viewingDailyPlan.id}`, auth);
                        }
                      }}
                      onOpenCheckIn={(lesson) => {
                        setCheckInLesson(lesson);
                        setIsCheckInOpen(true);
                      }}
                    onGenerateReteach={async (lesson) => {
                        const record = assessmentRecords.find(r => r.lessonId === lesson.id);
                        if (record) handleGenerateReteach(record);
                      }}
                      onGenerateIntervention={async (lesson) => {
                        const record = assessmentRecords.find(r => r.lessonId === lesson.id);
                        if (record) handleGenerateIntervention(record);
                      }}
                      onGenerateCatchUp={handleGenerateCatchUp}
                      onScheduleReview={() => {}} // TODO
                      onAddToRevisionWeek={() => {}} // TODO
                      onViewProgress={() => setActiveTab('assessment-tracker')}
                      onGenerateVideo={handleGenerateLessonVideo}
                      onRenderVideo={handleRenderFinalVideo}
                      isGenerating={isGenerating}
                    />
                  </motion.div>
                ) : viewingResource ? (
                  <motion.div
                    key="resource-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Button variant="ghost" size="sm" onClick={() => setViewingResource(null)}>
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Saved Plans
                      </Button>
                    </div>
                    <Card className="p-8">
                      <h2 className="text-2xl font-bold mb-4">{viewingResource.type}</h2>
                      <div className="prose max-w-none">
                        {viewingResource.content}
                      </div>
                    </Card>
                  </motion.div>
                ) : viewingWeeklyPlan ? (
                  <motion.div
                    key="weekly-plan-detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <WeeklyPlanDetailView 
                      plan={viewingWeeklyPlan} 
                      onBack={() => setViewingWeeklyPlan(null)} 
                      onGenerateResource={async (plan, type) => {
                        const res = await generateResource(type, plan.structured_json);
                        setGeneratedResource({ type, content: res, planId: plan.id });
                        setActiveTab('resources');
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="saved-plans-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <SavedPlansView 
                      plans={lessonPlans} 
                      weeklyPlans={weeklyPlans}
                      dailyLessonPlans={dailyLessonPlans}
                      resources={resources}
                      onDelete={async (id) => {
                        try {
                          await deleteDoc(doc(db, 'lesson_plans', id));
                        } catch (err) {
                          handleFirestoreError(err, OperationType.DELETE, `lesson_plans/${id}`, auth);
                        }
                      }} 
                      onOpen={(plan) => setViewingPlan(plan)}
                      onDeleteWeekly={async (id) => {
                        try {
                          await deleteDoc(doc(db, 'weekly_curriculum_plans', id));
                        } catch (err) {
                          handleFirestoreError(err, OperationType.DELETE, `weekly_curriculum_plans/${id}`, auth);
                        }
                      }}
                      onOpenWeekly={(plan) => setViewingWeeklyPlan(plan)}
                      onDeleteDaily={async (id) => {
                        try {
                          await deleteDoc(doc(db, 'daily_lesson_plans', id));
                        } catch (err) {
                          handleFirestoreError(err, OperationType.DELETE, `daily_lesson_plans/${id}`, auth);
                        }
                      }}
                      onOpenDaily={(plan) => setViewingDailyPlan(plan)}
                      onDeleteResource={async (id) => {
                        try {
                          await deleteDoc(doc(db, 'resources', id));
                        } catch (err) {
                          handleFirestoreError(err, OperationType.DELETE, `resources/${id}`, auth);
                        }
                      }}
                      onOpenResource={(res) => setViewingResource(res)}
                    />
                  </motion.div>
                )
              )}

              {activeTab === 'assessment-tracker' && (
                <AssessmentTracker 
                  records={assessmentRecords}
                  mastery={outcomeMastery}
                  misconceptions={misconceptionLogs}
                  supportFlags={supportFlags}
                  onGenerateReteach={handleGenerateReteach}
                  onGenerateIntervention={handleGenerateIntervention}
                  onGenerateRevisionWeek={handleGenerateRevisionWeek}
                />
              )}

              {activeTab === 'templates' && (
                <TemplatesView />
              )}

              {activeTab === 'resources' && (
                <ResourceGenView 
                  lessonPlans={lessonPlans}
                  prefilledResource={generatedResource}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  user={user} 
                  userSettings={userSettings}
                  setUserSettings={setUserSettings}
                />
              )}

              {activeTab === 'help' && (
                <HelpView />
              )}
            </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {isCheckInOpen && checkInLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <PostLessonCheckIn 
                lesson={checkInLesson}
                onSave={handleSaveAssessmentRecord}
                onCancel={() => {
                  setIsCheckInOpen(false);
                  setCheckInLesson(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isClassSelectionOpen && user && (
        <ClassSelectionModal 
          classes={classes}
          onSelect={handleSelectClass}
          userId={user.uid}
          onClose={activeClassId ? () => setIsClassSelectionOpen(false) : undefined}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
