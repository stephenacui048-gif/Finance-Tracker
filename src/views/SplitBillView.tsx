import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  Users,
  Plus,
  QrCode,
  Share2,
  Copy,
  Check,
  Trash2,
  Edit2,
  Receipt,
  UserCheck,
  UserX,
  CreditCard,
  MessageSquare,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { formatIDR, getTodayDateString } from '../utils/formatters';
import { SplitBill, SplitBillMember } from '../types/finance';

export const SplitBillView: React.FC = () => {
  const {
    splitBills,
    addSplitBill,
    updateSplitBill,
    deleteSplitBill,
    toggleSplitBillMemberPaid,
    accounts,
    addTransaction,
  } = useFinance();

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<SplitBill | null>(null);
  const [title, setTitle] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [taxPercent, setTaxPercent] = useState('0');
  const [discountStr, setDiscountStr] = useState('0');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [memberNames, setMemberNames] = useState<string[]>(['Saya', 'Teman 1', 'Teman 2']);
  const [customAmounts, setCustomAmounts] = useState<string[]>(['0', '0', '0']);
  const [qrisBank, setQrisBank] = useState('BCA');
  const [qrisAccountName, setQrisAccountName] = useState('Stefhen');
  const [qrisAccountNumber, setQrisAccountNumber] = useState('089519944429');

  // Copy success notification
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // Active QR view
  const [activeQrBill, setActiveQrBill] = useState<SplitBill | null>(null);

  const handleOpenCreateSplitBill = () => {
    setEditingBill(null);
    setTitle('');
    setTotalAmountStr('');
    setTaxPercent('0');
    setDiscountStr('0');
    setSplitMode('equal');
    setMemberNames(['Saya', 'Teman 1', 'Teman 2']);
    setCustomAmounts(['0', '0', '0']);
    const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
    if (defaultAcc) {
      setQrisBank(defaultAcc.name);
      setQrisAccountNumber(defaultAcc.accountNumber || '');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditSplitBill = (bill: SplitBill) => {
    setEditingBill(bill);
    setTitle(bill.title);
    setTotalAmountStr(bill.totalAmount.toString());
    setTaxPercent((bill.taxPercent || 0).toString());
    setDiscountStr((bill.discount || 0).toString());
    setSplitMode('custom');
    setMemberNames(bill.members.map((m) => m.name));
    setCustomAmounts(bill.members.map((m) => m.amount.toString()));
    setQrisBank(bill.qrisBank || 'BCA');
    setQrisAccountName(bill.qrisAccountName || '');
    setQrisAccountNumber(bill.qrisAccountNumber || '');
    setIsModalOpen(true);
  };

  const handleAddMemberInput = () => {
    setMemberNames((prev) => [...prev, `Teman ${prev.length}`]);
    setCustomAmounts((prev) => [...prev, '0']);
  };

  const handleRemoveMemberInput = (index: number) => {
    if (memberNames.length <= 1) return;
    setMemberNames((prev) => prev.filter((_, i) => i !== index));
    setCustomAmounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSplitBill = (e: React.FormEvent) => {
    e.preventDefault();
    const rawTotal = parseFloat(totalAmountStr) || 0;
    const tax = parseFloat(taxPercent) || 0;
    const discount = parseFloat(discountStr) || 0;

    if (rawTotal <= 0) return;

    const totalWithTax = rawTotal + (rawTotal * tax) / 100 - discount;
    const count = memberNames.length;

    let members: SplitBillMember[] = [];
    if (splitMode === 'equal') {
      const sharePerPerson = Math.round(totalWithTax / count);
      members = memberNames.map((name, idx) => {
        const existingMem = editingBill?.members[idx];
        return {
          id: existingMem?.id || `mem_${Date.now()}_${idx}`,
          name: name.trim() || `Teman ${idx + 1}`,
          amount: sharePerPerson,
          isPaid: existingMem ? existingMem.isPaid : (idx === 0),
        };
      });
    } else {
      members = memberNames.map((name, idx) => {
        const existingMem = editingBill?.members[idx];
        return {
          id: existingMem?.id || `mem_${Date.now()}_${idx}`,
          name: name.trim() || `Teman ${idx + 1}`,
          amount: parseFloat(customAmounts[idx]) || 0,
          isPaid: existingMem ? existingMem.isPaid : (idx === 0),
        };
      });
    }

    if (editingBill) {
      updateSplitBill(editingBill.id, {
        title: title || 'Makan Bareng & Patungan',
        totalAmount: totalWithTax,
        taxPercent: tax,
        discount,
        qrisBank,
        qrisAccountName,
        qrisAccountNumber,
        members,
      });
      setEditingBill(null);
    } else {
      addSplitBill({
        title: title || 'Makan Bareng & Patungan',
        totalAmount: totalWithTax,
        taxPercent: tax,
        discount,
        date: getTodayDateString(),
        qrisBank,
        qrisAccountName,
        qrisAccountNumber,
        members,
      });
    }

    setIsModalOpen(false);
    setTitle('');
    setTotalAmountStr('');
  };

  // Generate WhatsApp ready text
  const generateWhatsAppMessage = (bill: SplitBill) => {
    const unpaidMembers = bill.members.filter((m) => !m.isPaid);
    const paidMembers = bill.members.filter((m) => m.isPaid);

    let text = `🍜 *Split Bill: ${bill.title}*\n`;
    text += `Total Tagihan: *${formatIDR(bill.totalAmount)}*\n\n`;
    text += `*Rincian Tagihan:*\n`;

    bill.members.forEach((m) => {
      text += `• ${m.name}: ${formatIDR(m.amount)} [${m.isPaid ? '✓ LUNAS' : '⏳ BELUM'}]\n`;
    });

    if (bill.qrisAccountNumber) {
      text += `\n*Pembayaran Transfer / E-Wallet:*\n`;
      text += `Bank: ${bill.qrisBank || 'BCA'}\n`;
      text += `No. Rek: *${bill.qrisAccountNumber}*\n`;
      text += `A.N: ${bill.qrisAccountName || 'Saya'}\n`;
    }

    text += `\nMohon konfirmasi jika sudah transfer ya rek, terima kasih! 🙏`;
    return text;
  };

  const copyToClipboard = (bill: SplitBill) => {
    const text = generateWhatsAppMessage(bill);
    navigator.clipboard.writeText(text);
    setCopiedBillId(bill.id);
    setTimeout(() => setCopiedBillId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-semibold backdrop-blur-xs mb-2">
            <Users className="w-4 h-4 text-teal-300" />
            <span>Peer-to-Peer Expense Sharing</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Split Bill Mahasiswa & Generator QRIS
          </h2>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-xl">
            Bagi pengeluaran makan bareng, nongkrong, atau uang kos patungan secara transparan. Buat QR bayar dan kirim teks WhatsApp sekali klik.
          </p>
        </div>

        <button
          onClick={handleOpenCreateSplitBill}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Buat Split Bill Baru</span>
        </button>
      </div>

      {/* Split Bills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {splitBills.map((bill) => {
          const totalPaid = bill.members
            .filter((m) => m.isPaid)
            .reduce((sum, m) => sum + m.amount, 0);
          const percentPaid = Math.round((totalPaid / bill.totalAmount) * 100);
          const isAllPaid = percentPaid >= 100;

          return (
            <div
              key={bill.id}
              className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition-colors"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">{bill.title}</h3>
                    <p className="text-xs text-neutral-500">Tanggal: {bill.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-neutral-900 block">
                      {formatIDR(bill.totalAmount)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isAllPaid ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isAllPaid ? '✓ Semua Lunas' : `Terkumpul ${percentPaid}%`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>

                {/* Members Checklist */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-semibold text-neutral-700">Daftar Anggota Patungan:</p>
                  <div className="space-y-1">
                    {bill.members.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => toggleSplitBillMemberPaid(bill.id, member.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          member.isPaid
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                              member.isPaid
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'border border-neutral-300 bg-white'
                            }`}
                          >
                            {member.isPaid ? '✓' : ''}
                          </span>
                          <span className={member.isPaid ? 'line-through text-neutral-400' : 'font-medium'}>
                            {member.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{formatIDR(member.amount)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white border border-neutral-200">
                            {member.isPaid ? 'Lunas' : 'Belum'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account info pill */}
                {bill.qrisAccountNumber && (
                  <div className="p-2.5 bg-teal-50/60 border border-teal-100 rounded-lg flex items-center justify-between text-xs text-teal-900">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span>
                        {bill.qrisBank} - <strong className="font-mono">{bill.qrisAccountNumber}</strong> ({bill.qrisAccountName})
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveQrBill(bill)}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Lihat QR</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditSplitBill(bill)}
                    className="p-2 text-neutral-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Edit Split Bill"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSplitBill(bill.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Tagihan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveQrBill(bill)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Bayar</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(bill)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    {copiedBillId === bill.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Salin Teks WA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {splitBills.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">Belum Ada Split Bill Aktif</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Catat pengeluaran patungan makan bareng, nongkrong kafe, atau langganan WiFi bersama teman kos secara rapi.
            </p>
          </div>
          <button
            onClick={handleOpenCreateSplitBill}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Buat Split Bill Pertama
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BUAT / EDIT SPLIT BILL */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-neutral-900">
              {editingBill ? 'Edit Tagihan Split Bill' : 'Buat Tagihan Split Bill'}
            </h3>

            <form onSubmit={handleCreateSplitBill} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Judul / Acara Makan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Makan Siang Warmindo, Kopi Nugas, Sewa Lapangan Futsal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="font-semibold text-neutral-700 block mb-1">Total Nota (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="80000"
                    value={totalAmountStr}
                    onChange={(e) => setTotalAmountStr(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Pajak Resto (%)</label>
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Diskon (Rp)</label>
                  <input
                    type="number"
                    value={discountStr}
                    onChange={(e) => setDiscountStr(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Split Mode */}
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Metode Pembagian</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitMode('equal')}
                    className={`p-2 rounded-lg border font-semibold text-center transition-colors ${
                      splitMode === 'equal'
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Bagi Sama Rata
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('custom')}
                    className={`p-2 rounded-lg border font-semibold text-center transition-colors ${
                      splitMode === 'custom'
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Nominal Kustom
                  </button>
                </div>
              </div>

              {/* Members Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-700">Daftar Orang ({memberNames.length} Orang)</label>
                  <button
                    type="button"
                    onClick={handleAddMemberInput}
                    className="text-xs text-teal-700 font-bold hover:underline"
                  >
                    + Tambah Teman
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {memberNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const updated = [...memberNames];
                          updated[idx] = e.target.value;
                          setMemberNames(updated);
                        }}
                        className="flex-1 p-2 border border-neutral-300 rounded-lg text-xs"
                      />
                      {splitMode === 'custom' && (
                        <input
                          type="number"
                          placeholder="Nominal"
                          value={customAmounts[idx]}
                          onChange={(e) => {
                            const updated = [...customAmounts];
                            updated[idx] = e.target.value;
                            setCustomAmounts(updated);
                          }}
                          className="w-24 p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                        />
                      )}
                      {memberNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberInput(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment account details */}
              <div className="p-3 bg-neutral-50 rounded-xl space-y-2 border border-neutral-200">
                <span className="font-semibold text-neutral-800 block">Informasi Transfer Rekening Kamu:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Bank (BCA/GoPay/DANA)"
                    value={qrisBank}
                    onChange={(e) => setQrisBank(e.target.value)}
                    className="p-2 border border-neutral-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Rekening / HP"
                    value={qrisAccountNumber}
                    onChange={(e) => setQrisAccountNumber(e.target.value)}
                    className="p-2 border border-neutral-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Atas Nama Pemilik Rekening"
                  value={qrisAccountName}
                  onChange={(e) => setQrisAccountName(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBill(null);
                  }}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 shadow-xs"
                >
                  {editingBill ? 'Simpan Perubahan' : 'Buat Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: QRIS / QR CODE PREVIEW */}
      {/* ============================================================== */}
      {activeQrBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-base font-bold text-neutral-900">{activeQrBill.title}</h3>
            <p className="text-xs text-neutral-500">Scan QRIS / Transfer Pembayaran Teman</p>

            {/* Simulated QR Code Canvas SVG */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl inline-block mx-auto shadow-inner">
              <svg
                className="w-48 h-48 mx-auto"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* QR Pattern Simulation */}
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="18" y="18" width="9" height="9" fill="#0f172a" />

                <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="73" y="18" width="9" height="9" fill="#0f172a" />

                <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="18" y="73" width="9" height="9" fill="#0f172a" />

                <rect x="42" y="15" width="8" height="16" fill="#0f172a" />
                <rect x="45" y="38" width="12" height="12" fill="#0f172a" />
                <rect x="65" y="45" width="16" height="8" fill="#0f172a" />
                <rect x="40" y="65" width="14" height="18" fill="#0f172a" />
                <rect x="65" y="65" width="22" height="22" fill="#0f172a" />
                <rect x="72" y="72" width="8" height="8" fill="white" />

                <circle cx="50" cy="50" r="10" fill="#0d9488" />
                <text x="50" y="54" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">Rp</text>
              </svg>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-700 space-y-1">
              <p>
                <strong>{activeQrBill.qrisBank}</strong>: <span className="font-mono font-bold text-neutral-900">{activeQrBill.qrisAccountNumber}</span>
              </p>
              <p className="text-[11px] text-neutral-500">A.N. {activeQrBill.qrisAccountName}</p>
            </div>

            <button
              onClick={() => setActiveQrBill(null)}
              className="w-full py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Tutup QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
