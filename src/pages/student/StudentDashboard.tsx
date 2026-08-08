import React, { useState, useEffect } from 'react';
import { Calendar, Wallet, Award } from 'lucide-react';
import { api } from '../../services/api';

export const StudentDashboard: React.FC = () => {
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, enrollRes, attRes] = await Promise.all([
          api.get('/student-portal/me'),
          api.get('/student-portal/enrollments'),
          api.get('/student-portal/attendance')
        ]);
        setStudent(meRes.data);
        setEnrollments(enrollRes.data.data || []);
        setAttendance(attRes.data.data || []);
      } catch (error) {
        console.error("Failed to load student data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-gray-400 text-center py-10">Yuklanmoqda...</div>;
  }

  if (!student) {
    return <div className="text-red-400 text-center py-10">Ma'lumot topilmadi. Tizimga qayta kiring.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Xush kelibsiz, {student.full_name}!</h2>
        <p className="text-gray-400 mt-1">Darslaringiz va to'lovlar holati.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Wallet className="w-6 h-6" /></div>
            {student.balance < 0 ? (
              <span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/20">Qarzdorlik</span>
            ) : (
              <span className="text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">To'langan</span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400">Hisobingiz</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {new Intl.NumberFormat('uz-UZ').format(student.balance)} <span className="text-lg text-gray-500 font-normal">so'm</span>
            </h3>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl flex flex-col gap-4">
           <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Calendar className="w-6 h-6" /></div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Davomat tarixi</p>
            <h3 className="text-xl font-bold text-white mt-1">
              Jami {attendance.length} dars <span className="text-lg text-gray-500 font-normal">kiritilgan</span>
            </h3>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl flex flex-col gap-4">
           <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><Award className="w-6 h-6" /></div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Joriy guruhlar</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {enrollments.length} <span className="text-lg text-gray-500 font-normal">ta guruh</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Mening guruhlarim</h3>
        <div className="space-y-3">
          {enrollments.length === 0 ? (
            <p className="text-gray-500">Hozircha guruhlaringiz yo'q</p>
          ) : (
            enrollments.map((enr, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-800 text-center px-4 py-2 rounded-lg border border-gray-700">
                    <span className="block text-xs text-gray-400">Boshlangan</span>
                    <span className="block text-sm font-bold text-white">{enr.start_date || 'Noma\'lum'}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-lg">{enr.group_name}</h4>
                    <p className="text-sm text-gray-400">Status: {enr.status}</p>
                  </div>
                </div>
                <span className="text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-sm font-medium border border-blue-400/20">Aktiv</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
