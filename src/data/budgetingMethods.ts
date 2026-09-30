import { BudgetingMethodDefinition, BudgetingMethodType, ExpenseCategory, MonthlyBudget } from '../types/finance';

export const BUDGETING_METHODS: BudgetingMethodDefinition[] = [
  {
    id: '50_30_20',
    name: 'Metode 50/30/20 (Standar Seimbang)',
    shortName: '50/30/20',
    tagline: 'Formula klasik paling seimbang & populer untuk mahasiswa',
    description:
      'Membagi seluruh pemasukan menjadi 3 pos besar: 50% untuk kebutuhan mutlak, 30% untuk gaya hidup, dan 20% untuk tabungan & investasi masa depan.',
    philosophy:
      'Keseimbangan antara bertahan hidup hari ini, menikmati masa muda, dan membangun keamanan finansial masa depan.',
    idealFor:
      'Mahasiswa yang menginginkan aturan sederhana, fleksibel, dan mudah dievaluasi setiap akhir bulan.',
    proTip:
      'Jika biaya kos memakan lebih dari 35% uang kirimanmu, geser porsi keinginan menjadi 20% dan kebutuhan menjadi 60%.',
    allocations: [
      {
        name: 'Kebutuhan Pokok (Needs)',
        percentage: 50,
        categories: ['Kos', 'Makanan', 'Listrik/Air', 'Internet/Pulsa', 'Transportasi', 'Pendidikan', 'Kesehatan'],
        description: 'Pengeluaran wajib agar perkuliahan dan hidup sehari-hari berjalan lancar.',
        color: '#059669', // Emerald
      },
      {
        name: 'Keinginan & Hiburan (Wants)',
        percentage: 30,
        categories: ['Nongkrong', 'Shopping', 'Entertainment', 'Subscription', 'Lainnya'],
        description: 'Biaya nongkrong kafe, jajan kekinian, dan langganan hiburan tanpa rasa bersalah.',
        color: '#d97706', // Amber
      },
      {
        name: 'Tabungan & Masa Depan (Savings)',
        percentage: 20,
        categories: ['Tabungan', 'Investasi'],
        description: 'Alokasi wajib untuk dana darurat dan target impian (laptop, sertifikasi).',
        color: '#0284c7', // Sky
      },
    ],
  },
  {
    id: '80_20',
    name: 'Metode 80/20 (Pay Yourself First)',
    shortName: '80/20',
    tagline: 'Tabung dulu 20% di awal, habiskan 80% sisanya dengan tenang',
    description:
      'Begitu uang kiriman atau honor part-time masuk, langsung kunci 20% ke rekening tabungan terpisah. Sisa 80% bebas dipakai untuk kebutuhan hidup dan jajan.',
    philosophy:
      'Kekuatan menabung terletak pada urutan eksekusi: jangan tabung sisa belanja, tapi belanjakan sisa tabungan.',
    idealFor:
      'Mahasiswa yang malas mencatat setiap rupiah secara detail namun ingin tabungannya selalu bertambah pasti setiap bulan.',
    proTip:
      'Langsung transfer 20% di hari kiriman tiba sebelum kamu tergoda jajan di kantin atau online shopping.',
    allocations: [
      {
        name: 'Tabungan Wajib Awal (Pay Yourself First)',
        percentage: 20,
        categories: ['Tabungan', 'Investasi'],
        description: 'Terkunci otomatis di awal bulan untuk dana darurat & target laptop.',
        color: '#0284c7',
      },
      {
        name: 'Biaya Hidup & Discretionary',
        percentage: 80,
        categories: [
          'Kos',
          'Makanan',
          'Listrik/Air',
          'Internet/Pulsa',
          'Transportasi',
          'Pendidikan',
          'Kesehatan',
          'Nongkrong',
          'Shopping',
          'Entertainment',
          'Subscription',
          'Lainnya',
        ],
        description: 'Bebas digunakan untuk semua pos kebutuhan maupun hiburan sampai akhir bulan.',
        color: '#475569',
      },
    ],
  },
  {
    id: 'zero_based',
    name: 'Metode Zero-Based Budgeting (ZBB)',
    shortName: 'Zero-Based',
    tagline: 'Setiap rupiah memiliki tugas spesifik hingga saldo sisa alokasi = Rp 0',
    description:
      'Pemasukan dikurangi seluruh alokasi (kebutuhan, jajan, tabungan, sedekah) harus tepat sama dengan nol sebelum bulan berjalan dimulai.',
    philosophy:
      'Uang yang tidak diberi tugas cenderung menguap tanpa jejak. ZBB memberi kendali mutlak 100% pada mahasiswa.',
    idealFor:
      'Mahasiswa dengan anggaran ketat atau kiriman pas-pasan yang sering merasa "uang cepat habis entah ke mana".',
    proTip:
      'Selalu buat pos cadangan kecil (misal Rp 50.000) untuk pengeluaran tak terduga agar perhitungan tetap pas nol.',
    allocations: [
      {
        name: 'Tempat Tinggal & Kos',
        percentage: 28,
        categories: ['Kos', 'Listrik/Air'],
        description: 'Sewa kamar kos dan tagihan utilitas bulanan.',
        color: '#4338ca',
      },
      {
        name: 'Konsumsi Harian',
        percentage: 30,
        categories: ['Makanan'],
        description: 'Makan pokok 3x sehari di warteg/kantin kampus.',
        color: '#059669',
      },
      {
        name: 'Konektivitas & Kuliah',
        percentage: 12,
        categories: ['Internet/Pulsa', 'Pendidikan', 'Transportasi'],
        description: 'Paket data, fotokopi diktat, dan ongkos KRL/ojol.',
        color: '#0891b2',
      },
      {
        name: 'Kesehatan & Pribadi',
        percentage: 5,
        categories: ['Kesehatan'],
        description: 'Vitamin, obat darurat, dan perawatan tubuh.',
        color: '#16a34a',
      },
      {
        name: 'Gaya Hidup & Kafe',
        percentage: 10,
        categories: ['Nongkrong', 'Shopping', 'Entertainment', 'Subscription'],
        description: 'Kuota nongkrong dan hiburan yang dibatasi ketat.',
        color: '#ea580c',
      },
      {
        name: 'Tabungan Terarah',
        percentage: 15,
        categories: ['Tabungan', 'Investasi'],
        description: 'Alokasi pasti untuk dana cadangan mahasiswa.',
        color: '#0284c7',
      },
    ],
  },
  {
    id: 'jar_system',
    name: 'Metode 6 Jars (T. Harv Eker)',
    shortName: 'Metode 6 Toples',
    tagline: 'Membagi uang ke 6 toples spesifik untuk kemandirian finansial holistik',
    description:
      'Membagi uang masuk ke dalam 6 toples virtual: Kebutuhan (55%), Investasi Masa Depan (10%), Tabungan Impian (10%), Pendidikan/Buku (10%), Bersenang-senang (10%), dan Berbagi/Sosial (5%).',
    philosophy:
      'Manajemen kekayaan bukan hanya tentang berhemat, tetapi juga melatih pikiran berkelimpahan (berbagi) dan upgrade ilmu (edukasi).',
    idealFor:
      'Mahasiswa aktif yang ingin alokasi seimbang untuk biaya hidup, upgrade skill (buku/kursus), donasi sosial, dan hiburan tanpa rasa bersalah.',
    proTip:
      'Uang di toples "PLAY (10%)" wajib dihabiskan tiap bulan untuk menyegarkan pikiran tanpa mengganggu toples lainnya.',
    allocations: [
      {
        name: 'Toples 1: NEC - Kebutuhan Pokok (55%)',
        percentage: 55,
        categories: ['Kos', 'Makanan', 'Listrik/Air', 'Internet/Pulsa', 'Transportasi', 'Kesehatan'],
        description: 'Kebutuhan primer kelangsungan hidup.',
        color: '#059669',
      },
      {
        name: 'Toples 2: FFA - Kebebasan Finansial (10%)',
        percentage: 10,
        categories: ['Investasi'],
        description: 'Bibit modal masa depan atau reksa dana/emas mahasiswa.',
        color: '#2563eb',
      },
      {
        name: 'Toples 3: LTSS - Tabungan Jangka Panjang (10%)',
        percentage: 10,
        categories: ['Tabungan'],
        description: 'Target membeli laptop atau biaya skripsi/wisuda.',
        color: '#0891b2',
      },
      {
        name: 'Toples 4: EDU - Edukasi & Upgrade Diri (10%)',
        percentage: 10,
        categories: ['Pendidikan'],
        description: 'Beli buku, tiket webinar, sertifikasi, atau modul latihan.',
        color: '#7c3aed',
      },
      {
        name: 'Toples 5: PLAY - Bersenang-Senang (10%)',
        percentage: 10,
        categories: ['Nongkrong', 'Shopping', 'Entertainment', 'Subscription'],
        description: 'Reward diri, nongkrong, bioskop, atau jajan kesukaan.',
        color: '#db2777',
      },
      {
        name: 'Toples 6: GIVE - Memberi & Sosial (5%)',
        percentage: 5,
        categories: ['Lainnya'],
        description: 'Zakat, donasi kegiatan kampus, kado ulang tahun sahabat.',
        color: '#ca8a04',
      },
    ],
  },
  {
    id: 'debt_snowball',
    name: 'Metode Debt Snowball (Bola Salju Pelunasan Utang)',
    shortName: 'Debt Snowball',
    tagline: 'Lunasi utang dari saldo terkecil lebih dulu untuk momentum psikologis',
    description:
      'Urutkan seluruh pinjaman dari nominal terkecil ke terbesar. Bayar jumlah minimum pada semua utang, lalu kerahkan sisa dana untuk melunasi utang terkecil hingga tuntas. Setelah lunas, gulirkan uang tersebut ke utang berikutnya layaknya bola salju yang membesar.',
    philosophy:
      'Kemenangan cepat (quick wins) melunasi utang kecil memberikan motivasi dan kepercayaan diri yang sangat kuat bagi mahasiswa.',
    idealFor:
      'Mahasiswa yang memiliki 2 atau lebih pinjaman/talangan (misal buku, kas, teman) dan butuh dorongan semangat cepat.',
    proTip:
      'Begitu talangan terkecil lunas, rayakan dengan ucapan syukur lalu alihkan dana tersebut untuk melunasi utang berikutnya.',
    isDebtFocused: true,
    allocations: [
      {
        name: 'Kebutuhan Minimum Pokok',
        percentage: 60,
        categories: ['Kos', 'Makanan', 'Internet/Pulsa', 'Transportasi', 'Pendidikan'],
        description: 'Kebutuhan mendasar selama masa pelunasan utang.',
        color: '#059669',
      },
      {
        name: 'Fokus Pelunasan Utang Terkecil',
        percentage: 25,
        categories: ['Pembayaran Utang'],
        description: 'Serangan agresif ke utang dengan sisa saldo paling kecil.',
        color: '#dc2626',
      },
      {
        name: 'Gaya Hidup Super Hemat',
        percentage: 10,
        categories: ['Nongkrong', 'Subscription'],
        description: 'Batas jajan ditekan sementara sampai utang lunas.',
        color: '#d97706',
      },
      {
        name: 'Cadangan Darurat Kecil',
        percentage: 5,
        categories: ['Tabungan'],
        description: 'Mencegah berutang baru jika ada keperluan mendesak.',
        color: '#0284c7',
      },
    ],
  },
  {
    id: 'debt_avalanche',
    name: 'Metode Debt Avalanche (Longsoran Efisiensi Biaya Utang)',
    shortName: 'Debt Avalanche',
    tagline: 'Lunasi utang dengan urgensi, denda, atau bunga tertinggi terlebih dahulu',
    description:
      'Fokus melunasi pinjaman yang paling mendesak atau memiliki biaya keterlambatan/bunga terbesar terlebih dahulu sambil membayar minimum utang lainnya. Secara matematis, metode ini menghemat pengeluaran bunga terbanyak.',
    philosophy:
      'Efisiensi matematis murni: mematikan kebocoran uang terbesar secepat mungkin untuk meminimalkan kerugian.',
    idealFor:
      'Mahasiswa yang rasional, memiliki utang berbunga/denda (seperti paylater atau pinjaman darurat), dan ingin menghemat uang sebanyak-banyaknya.',
    proTip:
      'Prioritaskan utang yang jatuh temponya paling dekat atau memiliki denda harian agar tidak menumpuk beban.',
    isDebtFocused: true,
    allocations: [
      {
        name: 'Kebutuhan Minimum Pokok',
        percentage: 60,
        categories: ['Kos', 'Makanan', 'Internet/Pulsa', 'Transportasi', 'Pendidikan'],
        description: 'Kebutuhan esensial bertahan hidup selama masa avalanche.',
        color: '#059669',
      },
      {
        name: 'Fokus Pelunasan Utang Urgensi Tertinggi',
        percentage: 25,
        categories: ['Pembayaran Utang'],
        description: 'Melunasi utang dengan denda/bunga/urgensi paling tinggi.',
        color: '#991b1b',
      },
      {
        name: 'Gaya Hidup & Hiburan',
        percentage: 10,
        categories: ['Nongkrong', 'Subscription'],
        description: 'Pengeluaran gaya hidup minimal.',
        color: '#d97706',
      },
      {
        name: 'Cadangan Darurat',
        percentage: 5,
        categories: ['Tabungan'],
        description: 'Pengaman darurat.',
        color: '#0284c7',
      },
    ],
  },
];

/**
 * Intelligent recommendation engine that analyzes student financial health and suggests the best method.
 */
export function getRecommendedBudgetingMethod(
  monthlyIncome: number,
  monthlyExpenses: number,
  activeDebtsCount: number,
  totalDebtAmount: number,
  savingsRate: number,
  overBudgetCount: number
): {
  recommendedMethod: BudgetingMethodDefinition;
  reason: string;
  alternativeMethods: BudgetingMethodDefinition[];
} {
  // 1. If user has significant active debts
  if (activeDebtsCount >= 2 || totalDebtAmount > 300_000) {
    if (activeDebtsCount >= 3) {
      const method = BUDGETING_METHODS.find((m) => m.id === 'debt_snowball')!;
      return {
        recommendedMethod: method,
        reason: `Kamu memiliki ${activeDebtsCount} catatan utang aktif. Metode Debt Snowball sangat cocok untuk melunasi utang saldo terkecil satu per satu agar kamu mendapatkan kemenangan cepat dan dorongan moral.`,
        alternativeMethods: BUDGETING_METHODS.filter((m) => m.id !== 'debt_snowball'),
      };
    } else {
      const method = BUDGETING_METHODS.find((m) => m.id === 'debt_avalanche')!;
      return {
        recommendedMethod: method,
        reason: `Ada tanggungan utang aktif sebesar Rp ${totalDebtAmount.toLocaleString('id-ID')}. Metode Debt Avalanche akan menyelamatkan keuanganmu dari denda atau urgensi tinggi lebih cepat.`,
        alternativeMethods: BUDGETING_METHODS.filter((m) => m.id !== 'debt_avalanche'),
      };
    }
  }

  // 2. If user frequently exceeds budgets or has tight cash flow
  if (overBudgetCount >= 2 || (monthlyIncome > 0 && monthlyExpenses >= monthlyIncome * 0.9)) {
    const method = BUDGETING_METHODS.find((m) => m.id === 'zero_based')!;
    return {
      recommendedMethod: method,
      reason: `Arus kasmu cukup ketat dan ada ${overBudgetCount} kategori melebihi anggaran. Metode Zero-Based Budgeting (ZBB) akan memberi kendali penuh sehingga setiap rupiah uang kiriman memiliki tujuan jelas tanpa ada yang terbuang sia-sia.`,
      alternativeMethods: BUDGETING_METHODS.filter((m) => m.id !== 'zero_based'),
    };
  }

  // 3. If savings rate is low (<10%) or user wants a low-friction "save first" habit
  if (savingsRate < 0.1 && monthlyIncome > 0) {
    const method = BUDGETING_METHODS.find((m) => m.id === '80_20')!;
    return {
      recommendedMethod: method,
      reason: `Tingkat tabunganmu bulan ini masih di bawah 10%. Metode 80/20 (Pay Yourself First) mewajibkanmu memindahkan 20% langsung ke tabungan di hari pertama kiriman tiba, tanpa repot mencatat detail kecil.`,
      alternativeMethods: BUDGETING_METHODS.filter((m) => m.id !== '80_20'),
    };
  }

  // 4. Default: 50/30/20 standard
  const method = BUDGETING_METHODS.find((m) => m.id === '50_30_20')!;
  return {
    recommendedMethod: method,
    reason: `Kondisi keuanganmu relatif stabil. Metode 50/30/20 adalah formula emas yang paling seimbang untuk mahasiswa: 50% kebutuhan kuliah & kos, 30% gaya hidup, dan 20% tabungan masa depan.`,
    alternativeMethods: BUDGETING_METHODS.filter((m) => m.id !== '50_30_20'),
  };
}

/**
 * Generate calculated category budget limits based on chosen method and target monthly income.
 */
export function generateBudgetPresetForMethod(
  methodId: BudgetingMethodType,
  monthlyIncome: number
): MonthlyBudget[] {
  const baseIncome = Math.max(1_500_000, monthlyIncome || 3_000_000);
  const method = BUDGETING_METHODS.find((m) => m.id === methodId) || BUDGETING_METHODS[0];

  const presets: Record<ExpenseCategory, number> = {
    Makanan: 0,
    Kos: 0,
    'Listrik/Air': 0,
    'Internet/Pulsa': 0,
    Transportasi: 0,
    Pendidikan: 0,
    Kesehatan: 0,
    Nongkrong: 0,
    Shopping: 0,
    Subscription: 0,
    Entertainment: 0,
    Tabungan: 0,
    Investasi: 0,
    'Pembayaran Utang': 0,
    Lainnya: 0,
  };

  if (methodId === '50_30_20') {
    const needsPool = baseIncome * 0.5;
    const wantsPool = baseIncome * 0.3;
    const savingsPool = baseIncome * 0.2;

    presets['Kos'] = Math.round(needsPool * 0.45);
    presets['Makanan'] = Math.round(needsPool * 0.35);
    presets['Internet/Pulsa'] = Math.round(needsPool * 0.08);
    presets['Transportasi'] = Math.round(needsPool * 0.06);
    presets['Pendidikan'] = Math.round(needsPool * 0.04);
    presets['Kesehatan'] = Math.round(needsPool * 0.02);

    presets['Nongkrong'] = Math.round(wantsPool * 0.4);
    presets['Shopping'] = Math.round(wantsPool * 0.35);
    presets['Subscription'] = Math.round(wantsPool * 0.1);
    presets['Entertainment'] = Math.round(wantsPool * 0.15);

    presets['Tabungan'] = Math.round(savingsPool * 0.8);
    presets['Investasi'] = Math.round(savingsPool * 0.2);
  } else if (methodId === '80_20') {
    const savingsPool = baseIncome * 0.2;
    const livingPool = baseIncome * 0.8;

    presets['Tabungan'] = Math.round(savingsPool);
    presets['Kos'] = Math.round(livingPool * 0.32);
    presets['Makanan'] = Math.round(livingPool * 0.35);
    presets['Internet/Pulsa'] = Math.round(livingPool * 0.05);
    presets['Transportasi'] = Math.round(livingPool * 0.08);
    presets['Pendidikan'] = Math.round(livingPool * 0.06);
    presets['Nongkrong'] = Math.round(livingPool * 0.08);
    presets['Shopping'] = Math.round(livingPool * 0.06);
  } else if (methodId === 'zero_based') {
    presets['Kos'] = Math.round(baseIncome * 0.26);
    presets['Makanan'] = Math.round(baseIncome * 0.3);
    presets['Listrik/Air'] = Math.round(baseIncome * 0.04);
    presets['Internet/Pulsa'] = Math.round(baseIncome * 0.04);
    presets['Transportasi'] = Math.round(baseIncome * 0.06);
    presets['Pendidikan'] = Math.round(baseIncome * 0.05);
    presets['Kesehatan'] = Math.round(baseIncome * 0.03);
    presets['Nongkrong'] = Math.round(baseIncome * 0.07);
    presets['Shopping'] = Math.round(baseIncome * 0.05);
    presets['Tabungan'] = Math.round(baseIncome * 0.1);
  } else if (methodId === 'jar_system') {
    presets['Kos'] = Math.round(baseIncome * 0.28);
    presets['Makanan'] = Math.round(baseIncome * 0.22);
    presets['Internet/Pulsa'] = Math.round(baseIncome * 0.05);
    presets['Investasi'] = Math.round(baseIncome * 0.1); // FFA
    presets['Tabungan'] = Math.round(baseIncome * 0.1); // LTSS
    presets['Pendidikan'] = Math.round(baseIncome * 0.1); // EDU
    presets['Nongkrong'] = Math.round(baseIncome * 0.06); // PLAY
    presets['Entertainment'] = Math.round(baseIncome * 0.04); // PLAY
    presets['Lainnya'] = Math.round(baseIncome * 0.05); // GIVE
  } else if (methodId === 'debt_snowball' || methodId === 'debt_avalanche') {
    presets['Kos'] = Math.round(baseIncome * 0.28);
    presets['Makanan'] = Math.round(baseIncome * 0.27);
    presets['Internet/Pulsa'] = Math.round(baseIncome * 0.05);
    presets['Pembayaran Utang'] = Math.round(baseIncome * 0.25);
    presets['Tabungan'] = Math.round(baseIncome * 0.05);
    presets['Nongkrong'] = Math.round(baseIncome * 0.05);
    presets['Pendidikan'] = Math.round(baseIncome * 0.05);
  }

  // Convert map to MonthlyBudget array
  return (Object.keys(presets) as ExpenseCategory[])
    .filter((cat) => presets[cat] > 0)
    .map((category) => ({
      category,
      monthlyLimit: Math.round(presets[category] / 5000) * 5000, // round to nearest Rp 5.000 for clean numbers
    }));
}
