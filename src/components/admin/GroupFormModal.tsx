import React, { useState, useEffect } from 'react';
import { X, Copy } from 'lucide-react';

const DAYS_MAP = [
  { id: 'monday', label: 'Du' },
  { id: 'tuesday', label: 'Se' },
  { id: 'wednesday', label: 'Ch' },
  { id: 'thursday', label: 'Pa' },
  { id: 'friday', label: 'Ju' },
  { id: 'saturday', label: 'Sh' },
  { id: 'sunday', label: 'Ya' },
];

interface ScheduleItem {
  day: string;
  start: string;
  end: string;
}

export interface GroupFormData {
  name: string;
  course_id: string;
  room_id: string;
  teacher_id: string;
  start_date: string;
  max_students: number;
  schedule: ScheduleItem[];
}

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GroupFormData) => void;
  initialData?: GroupFormData;
  courses: any[];
  teachers: any[];
  rooms: any[];
  isSubmitting: boolean;
  formError: string;
  title: string;
}

const defaultFormData: GroupFormData = {
  name: '',
  course_id: '',
  room_id: '',
  teacher_id: '',
  start_date: new Date().toISOString().split('T')[0],
  max_students: 15,
  schedule: [{ day: 'monday', start: '14:00', end: '16:00' }]
};

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
  teachers,
  rooms,
  isSubmitting,
  formError,
  title
}) => {
  const [formData, setFormData] = useState<GroupFormData>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { ...defaultFormData, course_id: courses[0]?.id || '' });
    }
  }, [isOpen, initialData, courses]);

  if (!isOpen) return null;

  const toggleDay = (dayId: string) => {
    setFormData(prev => {
      const exists = prev.schedule.find(s => s.day === dayId);
      if (exists) {
        return { ...prev, schedule: prev.schedule.filter(s => s.day !== dayId) };
      } else {
        const defaultTime = prev.schedule.length > 0 
          ? { start: prev.schedule[0].start, end: prev.schedule[0].end }
          : { start: '14:00', end: '16:00' };
        
        const newSchedule = [...prev.schedule, { day: dayId, ...defaultTime }];
        newSchedule.sort((a, b) => {
          const idxA = DAYS_MAP.findIndex(d => d.id === a.day);
          const idxB = DAYS_MAP.findIndex(d => d.id === b.day);
          return idxA - idxB;
        });
        
        return { ...prev, schedule: newSchedule };
      }
    });
  };

  const updateScheduleTime = (dayId: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => {
      const newSchedule = prev.schedule.map(s => 
        s.day === dayId ? { ...s, [field]: value } : s
      );
      return { ...prev, schedule: newSchedule };
    });
  };

  const syncAllTimes = (sourceDayId: string) => {
    setFormData(prev => {
      const source = prev.schedule.find(s => s.day === sourceDayId);
      if (!source) return prev;
      
      const newSchedule = prev.schedule.map(s => ({
        ...s,
        start: source.start,
        end: source.end
      }));
      return { ...prev, schedule: newSchedule };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
              {formError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Guruh nomi</label>
            <input 
              type="text" required
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              placeholder="Masalan: IELTS 2024-A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Kursni tanlang</label>
              <select 
                required
                value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Tanlang...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">O'qituvchi</label>
              <select 
                value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">Biriktirilmagan</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Xona (Ixtiyoriy)</label>
              <select 
                value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">Xona tanlanmagan</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} kishi)</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Boshlanish sanasi</label>
              <input 
                type="date" required
                value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Maksimal o'quvchilar</label>
              <input 
                type="number" required min="1" max="100"
                value={formData.max_students || ''} 
                onChange={e => setFormData({...formData, max_students: parseInt(e.target.value) || 0})}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mt-2">
            <label className="block text-sm font-medium text-gray-400 mb-3">Dars kunlarini tanlang</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {DAYS_MAP.map(d => {
                const isSelected = formData.schedule.some(s => s.day === d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`w-10 h-10 rounded-full font-medium transition-all duration-200 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {formData.schedule.length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-400">Tanlangan kunlar vaqti</span>
                  {formData.schedule.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => syncAllTimes(formData.schedule[0].day)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded"
                    >
                      <Copy className="w-3 h-3" /> Barchasiga qo'llash
                    </button>
                  )}
                </div>
                
                {formData.schedule.map((scheduleItem) => {
                  const dayLabel = DAYS_MAP.find(d => d.id === scheduleItem.day)?.label;
                  return (
                    <div key={scheduleItem.day} className="flex items-center gap-3 bg-gray-900/50 p-2.5 rounded-lg border border-gray-700/50">
                      <div className="w-10 text-center font-bold text-gray-300">{dayLabel}</div>
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="time" required
                          value={scheduleItem.start}
                          onChange={e => updateScheduleTime(scheduleItem.day, 'start', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
                        />
                        <span className="text-gray-500 flex items-center">-</span>
                        <input 
                          type="time" required
                          value={scheduleItem.end}
                          onChange={e => updateScheduleTime(scheduleItem.day, 'end', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg font-medium transition-colors border border-gray-700"
            >
              Bekor qilish
            </button>
            <button 
              type="submit" disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
