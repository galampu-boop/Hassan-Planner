import React, { useState } from 'react';
import { 
  Plus, 
  School, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  GraduationCap,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Class, GradeLevel } from '../types';
import { Button, Card, Input } from './ui';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface ClassSelectionModalProps {
  classes: Class[];
  onSelect: (classId: string) => void;
  userId: string;
  onClose?: () => void;
}

export const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({ 
  classes, 
  onSelect, 
  userId,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<GradeLevel>('Standard 1');
  const [newClassSection, setNewClassSection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingClass) {
        await updateDoc(doc(db, 'classes', editingClass.id!), {
          name: newClassName,
          grade: newClassGrade,
          section: newClassSection,
        });
        setEditingClass(null);
      } else {
        const docRef = await addDoc(collection(db, 'classes'), {
          name: newClassName,
          grade: newClassGrade,
          section: newClassSection,
          teacherId: userId,
          schoolYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
          createdAt: new Date().toISOString()
        });
        onSelect(docRef.id);
      }
      setNewClassName('');
      setNewClassSection('');
      setIsCreating(false);
    } catch (error) {
      console.error("Error saving class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, cls: Class) => {
    e.stopPropagation();
    setEditingClass(cls);
    setNewClassName(cls.name);
    setNewClassGrade(cls.grade as GradeLevel);
    setNewClassSection(cls.section || '');
    setIsCreating(true);
  };

  const handleDeleteClass = async (classId: string) => {
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'classes', classId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting class:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? (editingClass ? 'Edit Class' : 'Add New Class') : 'Select Your Class'}
                </h2>
                <p className="text-gray-500">
                  {isCreating ? 'Fill in the details below.' : 'Choose the class you are currently teaching.'}
                </p>
              </div>
            </div>
            {onClose && !isCreating && (
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            )}
          </div>

          {!isCreating ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {classes.map((cls) => (
                  <div key={cls.id} className="relative group">
                    <button
                      onClick={() => onSelect(cls.id!)}
                      className="w-full flex flex-col items-start p-5 rounded-xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md uppercase tracking-wider">
                          {cls.grade}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.name}</h3>
                      {cls.section && (
                        <p className="text-sm text-gray-500">Section: {cls.section}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cls.schoolYear}
                      </p>
                    </button>
                    
                    <div className="absolute top-2 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditClick(e, cls)}
                        className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                        title="Edit Class"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(cls.id!);
                        }}
                        className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-red-600 hover:border-red-200 transition-all"
                        title="Delete Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setIsCreating(true)}
                  className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-gray-50 transition-all group min-h-[140px]"
                >
                  <div className="p-3 bg-gray-100 rounded-full text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">Add New Class</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateClass} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Class Name</label>
                  <Input
                    placeholder="e.g., Standard 4 Blue"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Grade Level</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value as GradeLevel)}
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={`Standard ${num}`}>Standard {num}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Section (Optional)</label>
                  <Input
                    placeholder="e.g., A, Blue, Morning"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setEditingClass(null);
                    setNewClassName('');
                    setNewClassSection('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingClass ? 'Update Class' : 'Create and Select'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Class?</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete this class? This action cannot be undone and all associated data will be hidden.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => handleDeleteClass(showDeleteConfirm)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
