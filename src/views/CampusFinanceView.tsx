import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  GraduationCap,
  Award,
  Receipt,
  BookOpen,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  DollarSign,
  FileCheck,
  Check,
  Trash2,
  Edit2,
  Sparkles,
  Bookmark,
  PiggyBank,
} from 'lucide-react';
import { formatIDR, getTodayDateString } from '../utils/formatters';
import { SemesterBudget, Scholarship, CampusBill, SavingGoal } from '../types/finance';

export const CampusFinanceView: React.FC = () => {
  const {
    semesterBudgets,
    addSemesterBudget,
    updateSemesterBudget,
    deleteSemesterBudget,
    scholarships,
    addScholarship,
    updateScholarship,
    deleteScholarship,
    disburseScholarship,
    campusBills,
    addCampusBill,
    updateCampusBill,
    deleteCampusBill,
    payCampusBill,
    savingGoals,
    addSavingGoal,
    updateSavingGoal,
    deleteSavingGoal,
    accounts,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'semester' | 'scholarships' | 'bills' | 'academic_goals'>('semester');

  // Modal states
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isAcademicGoalModalOpen, setIsAcademicGoalModalOpen] = useState(false);

  // Edit targets
  const [editingSemester, setEditingSemester] = useState<SemesterBudget | null>(null);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [editingCampusBill, setEditingCampusBill] = useState<CampusBill | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);

  // Form states for Semester Budget
  const [semName, setSemName] = useState('');
  const [semYear, setSemYear] = useState('2026/2027');
  const [semUKT, setSemUKT] = useState('3500000');
  const [semLiving, setSemLiving] = useState('1800000');
  const [semSupplies, setSemSupplies] = useState('500000');
  const [semHousing, setSemHousing] = useState('4500000');
  const [semOther, setSemOther] = useState('300000');
  const [semMonths, setSemMonths] = useState('6');
  const [semNotes, setSemNotes] = useState('');

  // Form states for Scholarship
  const [schName, setSchName] = useState('');
  const [schProvider, setSchProvider] = useState('');
  const [schAmount, setSchAmount] = useState('1000000');
  const [schFreq, setSchFreq] = useState<'monthly' | 'semester' | 'yearly' | 'one_time'>('monthly');
  const [schDueDate, setSchDueDate] = useState(getTodayDateString());
  const [schNotes, setSchNotes] = useState('');

  // Form states for Campus Bill
  const [billTitle, setBillTitle] = useState('');
  const [billCategory, setBillCategory] = useState<CampusBill['category']>('ukt');
  const [billAmount, setBillAmount] = useState('3500000');
  const [billDueDate, setBillDueDate] = useState(getTodayDateString());
  const [billNotes, setBillNotes] = useState('');

  // Form states for Academic Goal
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('1500000');
  const [goalDate, setGoalDate] = useState('2027-02-01');
  const [goalType, setGoalType] = useState<SavingGoal['academicType']>('skripsi');

  // Current active semester
  const activeSemester = semesterBudgets[0] || null;

  // Open Create / Edit helpers
  const handleOpenCreateSemester = () => {
    setEditingSemester(null);
    setSemName('');
    setSemYear('2026/2027');
    setSemUKT('3500000');
    setSemLiving('1800000');
    setSemSupplies('500000');
    setSemHousing('4500000');
    setSemOther('300000');
    setSemMonths('6');
    setSemNotes('');
    setIsSemesterModalOpen(true);
  };

  const handleOpenEditSemester = (sem: SemesterBudget) => {
    setEditingSemester(sem);
    setSemName(sem.name);
    setSemYear(sem.academicYear);
    setSemUKT(sem.targetUKT.toString());
    setSemLiving(sem.monthlyLivingTarget.toString());
    setSemSupplies(sem.academicSuppliesBudget.toString());
    setSemHousing(sem.housingBudget.toString());
    setSemOther(sem.otherBudget.toString());
    setSemMonths((sem.totalMonths || 6).toString());
    setSemNotes(sem.notes || '');
    setIsSemesterModalOpen(true);
  };

  const handleOpenCreateScholarship = () => {
    setEditingScholarship(null);
    setSchName('');
    setSchProvider('');
    setSchAmount('1000000');
    setSchFreq('monthly');
    setSchDueDate(getTodayDateString());
    setSchNotes('');
    setIsScholarshipModalOpen(true);
  };

  const handleOpenEditScholarship = (sch: Scholarship) => {
    setEditingScholarship(sch);
    setSchName(sch.name);
    setSchProvider(sch.provider);
    setSchAmount(sch.amount.toString());
    setSchFreq(sch.frequency);
    setSchDueDate(sch.nextDisbursementDate);
    setSchNotes(sch.notes || '');
    setIsScholarshipModalOpen(true);
  };

  const handleToggleRequirement = (schId: string, reqId: string) => {
    const sch = scholarships.find((s) => s.id === schId);
    if (!sch) return;
    const updated = sch.requirements.map((r) =>
      r.id === reqId ? { ...r, completed: !r.completed } : r
    );
    updateScholarship(schId, { requirements: updated });
  };

  const handleOpenCreateBill = () => {
    setEditingCampusBill(null);
    setBillTitle('');
    setBillCategory('ukt');
    setBillAmount('3500000');
    setBillDueDate(getTodayDateString());
    setBillNotes('');
    setIsBillModalOpen(true);
  };

  const handleOpenEditBill = (bill: CampusBill) => {
    setEditingCampusBill(bill);
    setBillTitle(bill.title);
    setBillCategory(bill.category);
    setBillAmount(bill.amount.toString());
    setBillDueDate(bill.dueDate);
    setBillNotes(bill.notes || '');
    setIsBillModalOpen(true);
  };

  const handleOpenCreateAcademicGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTarget('1500000');
    setGoalDate('2027-02-01');
    setGoalType('skripsi');
    setIsAcademicGoalModalOpen(true);
  };

  const handleOpenEditAcademicGoal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalDate(goal.targetDate);
    setGoalType(goal.academicType || 'skripsi');
    setIsAcademicGoalModalOpen(true);
  };

  // Handlers
  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semName) return;
    const payload = {
      name: semName,
      academicYear: semYear,
      targetUKT: parseFloat(semUKT) || 0,
      monthlyLivingTarget: parseFloat(semLiving) || 0,
      academicSuppliesBudget: parseFloat(semSupplies) || 0,
      housingBudget: parseFloat(semHousing) || 0,
      otherBudget: parseFloat(semOther) || 0,
      totalMonths: parseInt(semMonths, 10) || 6,
      startDate: editingSemester?.startDate || '2026-08',
      endDate: editingSemester?.endDate || '2027-01',
      notes: semNotes,
    };
    if (editingSemester) {
      updateSemesterBudget(editingSemester.id, payload);
    } else {
      addSemesterBudget(payload);
    }
    setIsSemesterModalOpen(false);
    setEditingSemester(null);
  };

  const handleSaveScholarship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schName || !schProvider) return;
    if (editingScholarship) {
      updateScholarship(editingScholarship.id, {
        name: schName,
        provider: schProvider,
        amount: parseFloat(schAmount) || 0,
        frequency: schFreq,
        nextDisbursementDate: schDueDate,
        notes: schNotes,
      });
    } else {
      addScholarship({
        name: schName,
        provider: schProvider,
        amount: parseFloat(schAmount) || 0,
        frequency: schFreq,
        nextDisbursementDate: schDueDate,
        status: 'active',
        requirements: [
          { id: `req_${Date.now()}_1`, title: 'Pertahankan IPK minimal kelayakan beasiswa', completed: true },
          { id: `req_${Date.now()}_2`, title: 'Unggah berkas KHS & bukti pembayaran kuliah', completed: false },
        ],
        notes: schNotes,
      });
    }
    setIsScholarshipModalOpen(false);
    setEditingScholarship(null);
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle) return;
    if (editingCampusBill) {
      updateCampusBill(editingCampusBill.id, {
        title: billTitle,
        category: billCategory,
        amount: parseFloat(billAmount) || 0,
        dueDate: billDueDate,
        notes: billNotes,
      });
    } else {
      addCampusBill({
        title: billTitle,
        category: billCategory,
        amount: parseFloat(billAmount) || 0,
        dueDate: billDueDate,
        isPaid: false,
        notes: billNotes,
      });
    }
    setIsBillModalOpen(false);
    setEditingCampusBill(null);
  };

  const handleSaveAcademicGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName) return;
    if (editingGoal) {
      updateSavingGoal(editingGoal.id, {
        name: goalName,
        targetAmount: parseFloat(goalTarget) || 0,
        targetDate: goalDate,
        academicType: goalType,
        categoryIcon: goalType === 'skripsi' ? 'book-open' : goalType === 'kkn' ? 'compass' : goalType === 'magang' ? 'briefcase' : 'award',
      });
    } else {
      addSavingGoal({
        name: goalName,
        targetAmount: parseFloat(goalTarget) || 0,
        currentAmount: 0,
        targetDate: goalDate,
        categoryIcon: goalType === 'skripsi' ? 'book-open' : goalType === 'kkn' ? 'compass' : goalType === 'magang' ? 'briefcase' : 'award',
        academicType: goalType,
        description: `Target tabungan persiapan ${goalType?.toUpperCase()}`,
        milestones: [
          { id: `m1_${Date.now()}`, title: 'Fase 1: Pendaftaran & Pembelian Bahan Awal', target: Math.round((parseFloat(goalTarget) || 0) * 0.3), completed: false },
          { id: `m2_${Date.now()}`, title: 'Fase 2: Biaya Operasional & Cetak Berkas', target: Math.round((parseFloat(goalTarget) || 0) * 0.7), completed: false },
          { id: `m3_${Date.now()}`, title: 'Fase 3: Pelunasan Akhir & Sertifikasi', target: parseFloat(goalTarget) || 0, completed: false },
        ],
      });
    }
    setIsAcademicGoalModalOpen(false);
    setEditingGoal(null);
  };

  // Academic goals list
  const academicGoals = savingGoals.filter(
    (g) => g.academicType && g.academicType !== 'general'
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur-xs mb-2">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>Manajemen Keuangan Mahasiswa & Kampus</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Perencanaan Semester & Beasiswa
          </h2>
          <p className="text-emerald-100 text-xs md:text-sm mt-1 max-w-xl">
            Atur anggaran per semester, pantau tanggal cair beasiswa, kelola tagihan UKT/praktikum, dan siapkan tabungan skripsi tanpa pusing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeSubTab === 'semester') handleOpenCreateSemester();
              else if (activeSubTab === 'scholarships') handleOpenCreateScholarship();
              else if (activeSubTab === 'bills') handleOpenCreateBill();
              else handleOpenCreateAcademicGoal();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>
              {activeSubTab === 'semester'
                ? 'Buat Rencana Semester'
                : activeSubTab === 'scholarships'
                ? 'Tambah Beasiswa'
                : activeSubTab === 'bills'
                ? 'Tambah Tagihan Kampus'
                : 'Buat Tabungan Skripsi/KKN'}
            </span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto pb-2">
        {[
          { id: 'semester', label: '1. Anggaran Semester', icon: Calendar, badge: semesterBudgets.length },
          { id: 'scholarships', label: '2. Pelacak Beasiswa', icon: Award, badge: scholarships.length },
          { id: 'bills', label: '3. Tagihan UKT & Kampus', icon: Receipt, badge: campusBills.filter((b) => !b.isPaid).length },
          { id: 'academic_goals', label: '4. Tabungan Skripsi / KKN', icon: BookOpen, badge: academicGoals.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-neutral-800 text-emerald-400' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. PERENCANAAN ANGGARAN SEMESTER */}
      {/* ============================================================== */}
      {activeSubTab === 'semester' && (
        <div className="space-y-6">
          {activeSemester ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900">{activeSemester.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md">
                      Tahun Ajaran {activeSemester.academicYear}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Durasi: {activeSemester.totalMonths} Bulan ({activeSemester.startDate} s/d {activeSemester.endDate})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditSemester(activeSemester)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Edit Rencana Semester"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => deleteSemesterBudget(activeSemester.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Hapus Rencana Semester"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Semester Budget KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-800">Biaya Kuliah (UKT)</span>
                  <p className="text-lg font-bold text-emerald-950 font-mono mt-1">
                    {formatIDR(activeSemester.targetUKT)}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Sekali per semester</p>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <span className="text-xs font-semibold text-blue-800">Tempat Tinggal (Kos)</span>
                  <p className="text-lg font-bold text-blue-950 font-mono mt-1">
                    {formatIDR(activeSemester.housingBudget)}
                  </p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Sewa 6 bulan semesteran</p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
                  <span className="text-xs font-semibold text-amber-800">Biaya Hidup 6 Bulan</span>
                  <p className="text-lg font-bold text-amber-950 font-mono mt-1">
                    {formatIDR(activeSemester.monthlyLivingTarget * activeSemester.totalMonths)}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    ~{formatIDR(activeSemester.monthlyLivingTarget)} / bulan
                  </p>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl">
                  <span className="text-xs font-semibold text-purple-800">Modul & Perlengkapan</span>
                  <p className="text-lg font-bold text-purple-950 font-mono mt-1">
                    {formatIDR(activeSemester.academicSuppliesBudget)}
                  </p>
                  <p className="text-[11px] text-purple-700 mt-0.5">Buku, alat tulis & lab</p>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-5 bg-neutral-900 text-white rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                    Total Estimasi Kebutuhan 1 Semester
                  </span>
                  <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                    {formatIDR(
                      activeSemester.targetUKT +
                        activeSemester.housingBudget +
                        activeSemester.monthlyLivingTarget * activeSemester.totalMonths +
                        activeSemester.academicSuppliesBudget +
                        activeSemester.otherBudget
                    )}
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    {activeSemester.notes || 'Rencana alokasi keuangan semester aktif mahasiswa.'}
                  </p>
                </div>

                <div className="p-3 bg-neutral-800 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between gap-4 text-neutral-300">
                    <span>UKT + Kos:</span>
                    <span className="font-mono font-bold text-white">
                      {formatIDR(activeSemester.targetUKT + activeSemester.housingBudget)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 text-neutral-300">
                    <span>Biaya Hidup ({activeSemester.totalMonths} bln):</span>
                    <span className="font-mono font-bold text-white">
                      {formatIDR(activeSemester.monthlyLivingTarget * activeSemester.totalMonths)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Belum Ada Rencana Semester</h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  Kelompokkan pengeluaran berdasarkan semester kuliah (UKT, uang kos, perlengkapan kuliah) agar cashflow mahasiswa terjaga.
                </p>
              </div>
              <button
                onClick={handleOpenCreateSemester}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Buat Rencana Semester Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PELACAKAN BEASISWA & BANTUAN KEUANGAN */}
      {/* ============================================================== */}
      {activeSubTab === 'scholarships' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scholarships.map((sch) => {
              const daysLeft = Math.ceil(
                (new Date(sch.nextDisbursementDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
              );

              return (
                <div
                  key={sch.id}
                  className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-md">
                          {sch.frequency === 'monthly'
                            ? 'Bulanan'
                            : sch.frequency === 'semester'
                            ? 'Per Semester'
                            : 'Tahunan'}
                        </span>
                        <h4 className="text-base font-bold text-neutral-900 mt-1">{sch.name}</h4>
                        <p className="text-xs text-neutral-500">Penyedia: {sch.provider}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold font-mono text-emerald-700 block">
                          {formatIDR(sch.amount)}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            daysLeft <= 7 ? 'text-amber-600 font-bold' : 'text-neutral-500'
                          }`}
                        >
                          {daysLeft > 0 ? `Cair dlm ${daysLeft} hari` : 'Jadwal Cair Tiba'}
                        </span>
                      </div>
                    </div>

                    {/* Requirements checklist */}
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-1.5 border border-neutral-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Syarat & Berkas Pelaporan:</span>
                        </p>
                        <span className="text-[10px] text-neutral-400 italic">Klik untuk centang</span>
                      </div>
                      {sch.requirements.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => handleToggleRequirement(sch.id, req.id)}
                          className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer hover:text-neutral-900 group select-none"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] transition-colors ${
                              req.completed
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'border border-neutral-300 bg-white group-hover:border-emerald-500'
                            }`}
                          >
                            {req.completed ? '✓' : ''}
                          </span>
                          <span className={req.completed ? 'line-through text-neutral-400' : ''}>
                            {req.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {sch.notes && <p className="text-xs text-neutral-500 italic">Catatan: {sch.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditScholarship(sch)}
                        className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Edit data beasiswa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteScholarship(sch.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus data beasiswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => disburseScholarship(sch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Tandai Cair & Masuk Dompet</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {scholarships.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Belum Ada Data Beasiswa</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                    Catat program beasiswa, jadwal pencairan ke rekening, dan syarat berkas pelaporan agar dana kuliah terpantau rapi.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateScholarship}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Tambah Beasiswa Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAGIHAN KAMPUS (UKT, LAB, DENDA PERPUS) */}
      {/* ============================================================== */}
      {activeSubTab === 'bills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campusBills.map((bill) => {
              const isOverdue = !bill.isPaid && new Date(bill.dueDate).getTime() < new Date().getTime();

              return (
                <div
                  key={bill.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-colors ${
                    bill.isPaid
                      ? 'border-neutral-200 bg-neutral-50/40'
                      : isOverdue
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                            bill.category === 'ukt'
                              ? 'bg-purple-100 text-purple-800'
                              : bill.category === 'practicum'
                              ? 'bg-blue-100 text-blue-800'
                              : bill.category === 'library'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {bill.category.toUpperCase()}
                        </span>
                        <h4 className="text-base font-bold text-neutral-900 mt-1">{bill.title}</h4>
                        <p className="text-xs text-neutral-500">Jatuh Tempo: {bill.dueDate}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-bold font-mono text-neutral-900 block">
                          {formatIDR(bill.amount)}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            bill.isPaid
                              ? 'text-emerald-700'
                              : isOverdue
                              ? 'text-rose-700 font-bold'
                              : 'text-amber-700'
                          }`}
                        >
                          {bill.isPaid ? '✓ Lunas' : isOverdue ? 'Lewat Batas!' : 'Menunggu Bayar'}
                        </span>
                      </div>
                    </div>

                    {bill.notes && <p className="text-xs text-neutral-600">{bill.notes}</p>}
                  </div>

                  {/* Bill Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditBill(bill)}
                        className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Edit Tagihan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCampusBill(bill.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus Tagihan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!bill.isPaid ? (
                      <button
                        onClick={() => payCampusBill(bill.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Bayar & Catat Transaksi</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Lunas tercatat ({bill.paidDate})</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {campusBills.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-neutral-200 p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Receipt className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Belum Ada Tagihan Kampus</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                    Kelola tagihan UKT, biaya modul praktikum, denda perpustakaan, atau iuran kas organisasi agar tidak terlewat jatuh tempo.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateBill}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Tambah Tagihan Kampus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. RENCANA TABUNGAN PROYEK AKADEMIK (SKRIPSI, KKN, MAGANG) */}
      {/* ============================================================== */}
      {activeSubTab === 'academic_goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicGoals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-bold uppercase rounded-md">
                        Proyek {goal.academicType}
                      </span>
                      <h4 className="text-base font-bold text-neutral-900 mt-1">{goal.name}</h4>
                      <p className="text-xs text-neutral-500">Target Tanggal: {goal.targetDate}</p>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-700">
                      {progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                      <span>Terkumpul: {formatIDR(goal.currentAmount)}</span>
                      <span>Target: {formatIDR(goal.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Milestones */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="p-3 bg-neutral-50 rounded-lg space-y-1.5 border border-neutral-100 text-xs">
                      <span className="font-semibold text-neutral-800 block mb-1">Tahapan Biaya:</span>
                      {goal.milestones.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-neutral-600">
                          <span>{m.title}</span>
                          <span className="font-mono text-neutral-800">{formatIDR(m.target)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Goal Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditAcademicGoal(goal)}
                        className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Edit Target Tabungan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSavingGoal(goal.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus Target Tabungan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {academicGoals.length === 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-neutral-400 mx-auto" />
              <h4 className="text-sm font-bold text-neutral-900">Belum Ada Target Tabungan Akademik</h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Siapkan dana cetak skripsi, biaya pendaftaran sidang, akomodasi KKN desa, atau persiapan magang sedini mungkin.
              </p>
              <button
                onClick={handleOpenCreateAcademicGoal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Buat Tabungan Skripsi / KKN
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}

      {/* 1. Modal Tambah / Edit Rencana Semester */}
      {isSemesterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              {editingSemester ? 'Edit Rencana Anggaran Semester' : 'Rencana Anggaran Semester Baru'}
            </h3>
            <form onSubmit={handleSaveSemester} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nama Semester</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Semester 5 (Ganjil)"
                  value={semName}
                  onChange={(e) => setSemName(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={semYear}
                    onChange={(e) => setSemYear(e.target.value)}
                    placeholder="2026/2027"
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Durasi (Bulan)</label>
                  <input
                    type="number"
                    value={semMonths}
                    onChange={(e) => setSemMonths(e.target.value)}
                    min="1"
                    max="12"
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Target UKT (Rp)</label>
                  <input
                    type="number"
                    value={semUKT}
                    onChange={(e) => setSemUKT(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Uang Kos 6 Bulan (Rp)</label>
                  <input
                    type="number"
                    value={semHousing}
                    onChange={(e) => setSemHousing(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Biaya Hidup / Bulan (Rp)</label>
                  <input
                    type="number"
                    value={semLiving}
                    onChange={(e) => setSemLiving(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Modul & Perlengkapan (Rp)</label>
                  <input
                    type="number"
                    value={semSupplies}
                    onChange={(e) => setSemSupplies(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Biaya Lainnya / Cadangan (Rp)</label>
                <input
                  type="number"
                  value={semOther}
                  onChange={(e) => setSemOther(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Fokus magang, matkul praktikum, dll."
                  value={semNotes}
                  onChange={(e) => setSemNotes(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSemesterModalOpen(false);
                    setEditingSemester(null);
                  }}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-xs"
                >
                  {editingSemester ? 'Simpan Perubahan' : 'Simpan Rencana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Tambah / Edit Beasiswa */}
      {isScholarshipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              {editingScholarship ? 'Edit Data Beasiswa' : 'Tambah Data Beasiswa'}
            </h3>
            <form onSubmit={handleSaveScholarship} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nama Beasiswa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KIP Kuliah, Beasiswa Bank Indonesia"
                  value={schName}
                  onChange={(e) => setSchName(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Penyedia / Lembaga</label>
                <input
                  type="text"
                  required
                  placeholder="Kemendikbudristek, Bank Indonesia, Djarum, Pemda"
                  value={schProvider}
                  onChange={(e) => setSchProvider(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Nominal Cair (Rp)</label>
                  <input
                    type="number"
                    value={schAmount}
                    onChange={(e) => setSchAmount(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Frekuensi</label>
                  <select
                    value={schFreq}
                    onChange={(e) => setSchFreq(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="semester">Per Semester</option>
                    <option value="yearly">Tahunan</option>
                    <option value="one_time">Sekali Bayar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Estimasi Tanggal Pencairan</label>
                <input
                  type="date"
                  value={schDueDate}
                  onChange={(e) => setSchDueDate(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Dicairkan ke rekening bank tertentu, syarat IPK, dll."
                  value={schNotes}
                  onChange={(e) => setSchNotes(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsScholarshipModalOpen(false);
                    setEditingScholarship(null);
                  }}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-xs"
                >
                  {editingScholarship ? 'Simpan Perubahan' : 'Simpan Beasiswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Tambah / Edit Tagihan Kampus */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              {editingCampusBill ? 'Edit Tagihan Kampus' : 'Tambah Tagihan Kampus'}
            </h3>
            <form onSubmit={handleSaveBill} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nama Tagihan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: UKT Semester 5, Biaya Lab, Denda Buku"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Kategori</label>
                  <select
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                  >
                    <option value="ukt">UKT / Kuliah</option>
                    <option value="practicum">Praktikum / Lab</option>
                    <option value="library">Perpustakaan</option>
                    <option value="organization">Iuran Kas / Ormawa</option>
                    <option value="meal_card">Kartu Kantin / KTM</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Batas Waktu (Jatuh Tempo)</label>
                <input
                  type="date"
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Informasi rekening atau instruksi pembayaran"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBillModalOpen(false);
                    setEditingCampusBill(null);
                  }}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-xs"
                >
                  {editingCampusBill ? 'Simpan Perubahan' : 'Simpan Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Tambah / Edit Tabungan Akademik */}
      {isAcademicGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              {editingGoal ? 'Edit Target Tabungan Akademik' : 'Target Tabungan Akademik Baru'}
            </h3>
            <form onSubmit={handleSaveAcademicGoal} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Nama Target</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Cetak & Ujian Skripsi"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Jenis Proyek</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                  >
                    <option value="skripsi">Skripsi & Tugas Akhir</option>
                    <option value="kkn">KKN (Kuliah Kerja Nyata)</option>
                    <option value="magang">Persiapan Magang / Kerja</option>
                    <option value="lomba">Lomba & Konferensi Ilmiah</option>
                    <option value="wisuda">Wisuda & Kebaya / Jas</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Target Dana (Rp)</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Target Tercapai</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAcademicGoalModalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-xs"
                >
                  {editingGoal ? 'Simpan Perubahan' : 'Simpan Target Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
