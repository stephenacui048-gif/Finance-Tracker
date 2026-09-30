import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { SavingGoal } from '../../types/finance';
import { X, Shield } from 'lucide-react';

interface GoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingGoal | null;
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { addSavingGoal, updateSavingGoal } = useFinance();

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('0');
  const [targetDate, setTargetDate] = useState('2027-02-28');
  const [categoryIcon, setCategoryIcon] = useState('laptop');
  const [description, setDescription] = useState('');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmountStr(String(goalToEdit.targetAmount));
      setCurrentAmountStr(String(goalToEdit.currentAmount));
      setTargetDate(goalToEdit.targetDate);
      setCategoryIcon(goalToEdit.categoryIcon || 'laptop');
      setDescription(goalToEdit.description || '');
      setIsEmergencyFund(Boolean(goalToEdit.isEmergencyFund));
    } else {
      setName('');
      setTargetAmountStr('');
      setCurrentAmountStr('0');
      setTargetDate('2027-02-28');
      setCategoryIcon('laptop');
      setDescription('');
      setIsEmergencyFund(false);
    }
    setError('');
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmountStr.replace(/[^0-9]/g, ''));
    const current = parseFloat(currentAmountStr.replace(/[^0-9]/g, '')) || 0;

    if (!name.trim()) {
      setError('Nama target tabungan harus diisi');
      return;
    }

    if (isNaN(target) || target <= 0) {
      setError('Target nominal harus lebih besar dari Rp 0');
      return;
    }

    if (!targetDate) {
      setError('Pilih target tanggal pencapaian');
      return;
    }

    if (goalToEdit) {
      updateSavingGoal(goalToEdit.id, {
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate,
        categoryIcon,
        description: description.trim() || undefined,
        isEmergencyFund,
      });
    } else {
      addSavingGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate,
        categoryIcon,
        description: description.trim() || undefined,
        isEmergencyFund,
      });
    }

    onClose();
  };

  const icons = [
    { id: 'laptop', label: '💻 Laptop/Gadget' },
    { id: 'shield', label: '🛡️ Dana Darurat' },
    { id: 'award', label: '🎓 Pendidikan/Kursus' },
    { id: 'plane', label: '✈️ Liburan/Mudik' },
    { id: 'bike', label: '🛵 Motor/Kendaraan' },
    { id: 'sparkles', label: '✨ Lainnya' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="text-sm font-bold text-neutral-900">
            {goalToEdit ? 'Ubah Target Tabungan' : 'Buat Target Tabungan Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nama Target Tabungan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Laptop Kuliah & Coding"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Target Nominal (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={targetAmountStr}
                onChange={(e) => setTargetAmountStr(e.target.value)}
                placeholder="7500000"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Saldo Awal / Saat Ini (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={currentAmountStr}
                onChange={(e) => setCurrentAmountStr(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Target Tanggal Tercapai <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Ikon / Jenis Kategori
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {icons.map((ic) => (
                <button
                  type="button"
                  key={ic.id}
                  onClick={() => setCategoryIcon(ic.id)}
                  className={`px-2 py-1.5 text-xs text-left rounded-md border transition-all ${
                    categoryIcon === ic.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {ic.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Deskripsi / Motivasi (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Untuk beli sebelum semester 6 dimulai"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <input
              type="checkbox"
              id="isEmergency"
              checked={isEmergencyFund}
              onChange={(e) => setIsEmergencyFund(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isEmergency" className="text-xs text-neutral-800 font-medium cursor-pointer">
              Tandai sebagai Dana Darurat Mahasiswa (Emergency Fund)
            </label>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
              {error}
            </p>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              {goalToEdit ? 'Simpan Perubahan' : 'Buat Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
