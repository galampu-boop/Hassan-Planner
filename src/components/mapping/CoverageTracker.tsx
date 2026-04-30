import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight,
  Target,
  Layers,
  Activity,
  BarChart3
} from 'lucide-react';
import { Card, Button, Input } from '../ui';
import { CoverageRecord, GradeLevel, Subject } from '../../types';

interface CoverageTrackerProps {
  coverage: CoverageRecord[];
  grade: GradeLevel;
  subject: Subject;
  onUpdate: (record: CoverageRecord) => void;
}

export const CoverageTracker: React.FC<CoverageTrackerProps> = ({ coverage, grade, subject, onUpdate }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const filteredCoverage = coverage.filter(c => {
    const matchesSearch = c.outcome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: coverage.length,
    covered: coverage.filter(c => c.status === 'Fully Covered' || c.status === 'Assessed' || c.status === 'Mastered').length,
    assessed: coverage.filter(c => c.status === 'Assessed' || c.status === 'Mastered').length,
    mastered: coverage.filter(c => c.status === 'Mastered').length,
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outcomes</p>
              <p className="text-xl font-black text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Covered</p>
              <p className="text-xl font-black text-slate-900">{stats.covered}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessed</p>
              <p className="text-xl font-black text-slate-900">{stats.assessed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mastered</p>
              <p className="text-xl font-black text-slate-900">{stats.mastered}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-6 bg-white border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Curriculum Coverage Progress</h3>
          <span className="text-2xl font-black text-indigo-600">{progressPercent}%</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div 
            className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">{stats.covered} of {stats.total} Outcomes Covered</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{stats.total - stats.covered} Remaining</span>
        </div>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search learning outcomes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="Not Covered">Not Covered</option>
            <option value="Partially Covered">Partially Covered</option>
            <option value="Fully Covered">Fully Covered</option>
            <option value="Assessed">Assessed</option>
            <option value="Mastered">Mastered</option>
          </select>
        </div>
      </div>

      {/* Coverage Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Outcome</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Taught</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cycle</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoverage.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{record.outcome}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                      record.status === 'Mastered' ? "bg-emerald-100 text-emerald-700" :
                      record.status === 'Assessed' ? "bg-blue-100 text-blue-700" :
                      record.status === 'Fully Covered' ? "bg-indigo-100 text-indigo-700" :
                      record.status === 'Partially Covered' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {record.lastTaughtDate || 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-600">Cycle {record.cycleNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredCoverage.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    No learning outcomes found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
