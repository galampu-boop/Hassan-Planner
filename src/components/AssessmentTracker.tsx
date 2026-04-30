import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight,
  Filter,
  Search,
  Zap,
  BookOpen,
  Users,
  Target,
  ArrowRight
} from 'lucide-react';
import { Button, Card, Input, Select } from './ui';
import { 
  AssessmentRecord, 
  OutcomeMastery, 
  StudentSupportFlag, 
  MisconceptionLog,
  GradeLevel,
  Subject
} from '../types';
import { cn } from '../lib/utils';

interface AssessmentTrackerProps {
  records: AssessmentRecord[];
  mastery: OutcomeMastery[];
  supportFlags: StudentSupportFlag[];
  misconceptions: MisconceptionLog[];
  onGenerateReteach: (record: AssessmentRecord) => void;
  onGenerateIntervention: (record: AssessmentRecord) => void;
  onGenerateRevisionWeek: (grade: GradeLevel, subject: Subject, cycle: number) => void;
}

export function AssessmentTracker({ 
  records, 
  mastery, 
  supportFlags, 
  misconceptions,
  onGenerateReteach,
  onGenerateIntervention,
  onGenerateRevisionWeek
}: AssessmentTrackerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'outcomes' | 'misconceptions' | 'support'>('overview');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'All'>('All');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');

  const filteredRecords = records.filter(r => 
    (selectedGrade === 'All' || r.grade === selectedGrade) &&
    (selectedSubject === 'All' || r.subject === selectedSubject)
  );

  const weakOutcomes = mastery.filter(m => 
    ['Needs reteach', 'Needs review', 'Partially mastered'].includes(m.status)
  );

  return (
    <div className="space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Assessment Tracker & Progress Dashboard
          </h2>
          <p className="text-sm text-gray-500">Monitor teaching progress, student mastery, and instructional needs.</p>
        </div>
        <div className="flex gap-3">
          <Select 
            value={selectedGrade} 
            onChange={(val) => setSelectedGrade(val as any)}
            options={[
              { label: 'All Grades', value: 'All' },
              { label: 'Infant 1', value: 'Infant 1' },
              { label: 'Infant 2', value: 'Infant 2' },
              { label: 'Standard 1', value: 'Standard 1' },
              { label: 'Standard 2', value: 'Standard 2' },
              { label: 'Standard 3', value: 'Standard 3' },
              { label: 'Standard 4', value: 'Standard 4' },
              { label: 'Standard 5', value: 'Standard 5' },
              { label: 'Standard 6', value: 'Standard 6' }
            ]}
            className="w-32"
          />
          <Select 
            value={selectedSubject} 
            onChange={(val) => setSelectedSubject(val as any)}
            options={[
              { label: 'All Subjects', value: 'All' },
              { label: 'Mathematics', value: 'Mathematics' },
              { label: 'Language Arts', value: 'Language Arts' },
              { label: 'Science and Technology', value: 'Science and Technology' },
              { label: 'Belizean Studies', value: 'Belizean Studies' }
            ]}
            className="w-32"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-emerald-100 bg-emerald-50/30 space-y-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{records.filter(r => r.deliveryStatus === 'Fully taught').length}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lessons Completed</div>
          </div>
        </Card>

        <Card className="p-5 border-amber-100 bg-amber-50/30 space-y-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{weakOutcomes.length}</span>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{weakOutcomes.length}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weak Outcomes</div>
          </div>
        </Card>

        <Card className="p-5 border-indigo-100 bg-indigo-50/30 space-y-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{records.filter(r => r.understandingLevel === 'Needs reteaching').length}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reteach Needed</div>
          </div>
        </Card>

        <Card className="p-5 border-purple-100 bg-purple-50/30 space-y-2">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{Math.round((mastery.filter(m => m.status === 'Mastered').length / (mastery.length || 1)) * 100)}%</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mastery Rate</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        <Button 
          variant={activeTab === 'overview' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('overview')}
          className="rounded-xl"
        >
          Teaching Record
        </Button>
        <Button 
          variant={activeTab === 'outcomes' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('outcomes')}
          className="rounded-xl"
        >
          Outcome Mastery
        </Button>
        <Button 
          variant={activeTab === 'misconceptions' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('misconceptions')}
          className="rounded-xl"
        >
          Misconceptions Log
        </Button>
        <Button 
          variant={activeTab === 'support' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setActiveTab('support')}
          className="rounded-xl"
        >
          Support Flags
        </Button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <Card className="divide-y divide-gray-50">
              <div className="p-6 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Recent Teaching History</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search records..." className="pl-10 py-1 h-9 text-sm w-48" />
                </div>
              </div>
              {filteredRecords.length > 0 ? filteredRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((record) => (
                <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        record.deliveryStatus === 'Fully taught' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {record.deliveryStatus === 'Fully taught' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase tracking-widest">{record.grade}</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black uppercase tracking-widest">{record.subject}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                            record.understandingLevel === 'Most understood' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>{record.understandingLevel}</span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">{record.lessonTitle}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()} • {record.deliveryStatus}
                        </p>
                        
                        {record.understandingLevel === 'Needs reteaching' && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => onGenerateReteach(record)} className="bg-indigo-600 text-white">
                              <Zap className="w-3 h-3 mr-1" />
                              Generate Reteach
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => onGenerateIntervention(record)}>
                              Intervention Work
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mastery</div>
                      <div className={cn(
                        "text-sm font-black",
                        record.objectiveMastery === 'Mastered' ? "text-emerald-600" : "text-amber-600"
                      )}>{record.objectiveMastery}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-400 italic">No teaching records found for the selected filters.</div>
              )}
            </Card>
          )}

          {activeTab === 'outcomes' && (
            <Card className="divide-y divide-gray-50">
              <div className="p-6 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Learning Outcome Mastery</h3>
              </div>
              {mastery.filter(m => (selectedGrade === 'All' || m.grade === selectedGrade) && (selectedSubject === 'All' || m.subject === selectedSubject)).map((m) => (
                <div key={m.id} className="p-6 flex justify-between items-center">
                  <div className="space-y-1 flex-1 pr-8">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{m.subject}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{m.topic}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{m.outcome}</p>
                    <p className="text-xs text-gray-500">Last assessed: {new Date(m.lastAssessed).toLocaleDateString()}</p>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2",
                    m.status === 'Mastered' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                    m.status === 'Needs reteach' ? "bg-red-50 border-red-100 text-red-700" :
                    "bg-amber-50 border-amber-100 text-amber-700"
                  )}>
                    {m.status}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'misconceptions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {misconceptions.filter(m => selectedSubject === 'All' || m.subject === selectedSubject).map((m) => (
                <Card key={m.id} className="p-6 space-y-4 border-amber-100">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">Frequency: {m.frequency}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{m.topic}</div>
                    <h4 className="font-bold text-gray-900">{m.misconception}</h4>
                  </div>
                  {m.suggestedCorrection && (
                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100">
                      <span className="font-bold text-indigo-600">Correction:</span> {m.suggestedCorrection}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportFlags.map((flag) => (
                <Card key={flag.id} className="p-6 space-y-4 border-indigo-100">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">{flag.studentCount} Students</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">{flag.category}</h4>
                    <p className="text-sm text-gray-500">{flag.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Recommendations & Actions */}
        <div className="space-y-6">
          <Card className="p-6 bg-indigo-900 text-white space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-300" />
                Instructional Intelligence
              </h3>
              <p className="text-sm text-indigo-100/70">Based on your recent check-ins, here are recommended actions.</p>
            </div>

            <div className="space-y-4">
              {weakOutcomes.length > 0 && (
                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">Priority Reteach</div>
                  <p className="text-sm font-medium">{weakOutcomes[0].outcome}</p>
                  <Button size="sm" className="w-full bg-white text-indigo-900 hover:bg-indigo-50">
                    Plan Reteach Lesson
                  </Button>
                </div>
              )}

              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">Revision Planning</div>
                <p className="text-sm">You have {weakOutcomes.length} outcomes needing review before the next cycle assessment.</p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full text-white border border-white/20 hover:bg-white/10"
                  onClick={() => selectedGrade !== 'All' && selectedSubject !== 'All' && onGenerateRevisionWeek(selectedGrade, selectedSubject, 1)}
                  disabled={selectedGrade === 'All' || selectedSubject === 'All'}
                >
                  Build Revision Week
                </Button>
                {selectedGrade === 'All' && <p className="text-[10px] text-indigo-300 italic text-center">Select a grade & subject to build</p>}
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Class Readiness
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-gray-500">Curriculum Coverage</span>
                  <span className="text-indigo-600">65%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-indigo-600 rounded-full" />
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div className="text-sm font-bold text-emerald-800">Ready to Move On</div>
              </div>

              <p className="text-xs text-gray-500 italic">
                Class readiness is calculated based on assessment results and objective mastery across the current unit.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
