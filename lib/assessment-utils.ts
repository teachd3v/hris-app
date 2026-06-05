/**
 * Utility for SDT (Self-Determination Theory) Assessment calculations and profiling.
 */

export interface SDTScores {
  intrinsic: number;
  integrated: number;
  identified: number;
  introjected: number;
  external: number;
  amotivation: number;
  autonomous: number;
  controlled: number;
}

export interface SDTProfile {
  label: string;
  icon: string;
  color: string;
  indicators: string;
  traits: string;
  treatment: string;
  explanation: string;
}

export const SDT_DIMENSIONS = {
  intrinsic: ['b5', 'b9', 'b16', 'b20'],
  integrated: ['b6', 'b11', 'b19', 'b21'],
  identified: ['b2', 'b8', 'b15', 'b22'],
  introjected: ['b7', 'b12', 'b14', 'b23'],
  external: ['b3', 'b10', 'b17', 'b24'],
  amotivation: ['b4', 'b13', 'b18', 'b25'],
};

export function calculateSDTScores(answers: Record<string, any>): SDTScores {
  const getAvg = (keys: string[]) => {
    let total = 0;
    let count = 0;
    keys.forEach(k => {
      if (answers[k]) {
        total += Number(answers[k]);
        count++;
      }
    });
    return count > 0 ? total / count : 0;
  };

  const scores = {
    intrinsic: getAvg(SDT_DIMENSIONS.intrinsic),
    integrated: getAvg(SDT_DIMENSIONS.integrated),
    identified: getAvg(SDT_DIMENSIONS.identified),
    introjected: getAvg(SDT_DIMENSIONS.introjected),
    external: getAvg(SDT_DIMENSIONS.external),
    amotivation: getAvg(SDT_DIMENSIONS.amotivation),
  };

  const autonomous = (scores.identified + scores.integrated + scores.intrinsic) / 3;
  const controlled = (scores.external + scores.introjected) / 2;

  return {
    ...scores,
    autonomous,
    controlled,
  };
}

export function getSDTProfile(scores: SDTScores): SDTProfile {
  const { autonomous, controlled, amotivation } = scores;

  // 1. Profil Krisis / Rentan Burnout (Prioritas Utama jika Amotivasi Tinggi)
  if (amotivation > 4 || (amotivation >= autonomous && amotivation >= controlled && amotivation > 3)) {
    return {
      label: "Profil Krisis / Rentan Burnout",
      icon: "🚨",
      color: "red",
      indicators: "Amotivasi Dominan",
      traits: "Karyawan merasa lelah secara mental, merasa pekerjaannya sia-sia, atau kehilangan makna.",
      treatment: "Segera lakukan One-on-One session. Jangan beri mereka hukuman atau motivasi klise. Cari tahu apa Kebutuhan Dasar (Otonomi, Kompetensi, Keterkaitan) yang tidak terpenuhi di lapangan.",
      explanation: "Karyawan saat ini berada dalam fase kritis di mana dorongan internal maupun eksternal telah mencapai titik nadir. Tingginya skor amotivasi menunjukkan adanya diskoneksi antara tindakan dan hasil, yang sering kali dipicu oleh rasa ketidakberdayaan (learned helplessness) atau kelelahan mental yang kronis. Tanpa intervensi, risiko pelepasan tanggung jawab sepenuhnya atau pengunduran diri secara psikologis sangat tinggi."
    };
  }

  // 2. Profil Realistis / Berimbang (Keduanya Kuat)
  if (autonomous >= 4 && controlled >= 4) {
    return {
      label: "Profil Realistis / Berimbang",
      icon: "⚖️",
      color: "blue",
      indicators: "Otonom & Terkontrol Kuat (>= 4)",
      traits: "Sangat peduli misi, tetapi juga memiliki kebutuhan nyata akan kepastian finansial/kesejahteraan.",
      treatment: "Hargai passion mereka, tetapi jangan eksploitasi kebaikan mereka. Pastikan hak and kesejahteraan finansial mereka terpenuhi dengan adil.",
      explanation: "Merupakan profil yang paling adaptif. Karyawan memiliki integritas tinggi terhadap pekerjaan, namun secara sadar juga menyadari pentingnya regulasi eksternal (seperti remunerasi dan keamanan karir). Terdapat keseimbangan antara 'passion' dan 'pragmatisme', di mana motivasi otonom menjaga kualitas kerja, sementara motivasi terkontrol bertindak sebagai jangkar stabilitas hidup dan keluarga."
    };
  }

  // 3. Sang Visioner / Pendorong Misi (Dominan Otonom)
  if (autonomous >= controlled) {
    return {
      label: "Sang Visioner / Pendorong Misi",
      icon: "🔭",
      color: "emerald",
      indicators: "Otonom Dominan",
      traits: "Bergerak murni karena passion dan keselarasan nilai. Mandiri dan tidak butuh pengawasan ketat.",
      treatment: "Berikan mereka lebih banyak otonomi, kepercayaan, dan proyek-proyek inovatif. Jangan batasi mereka dengan aturan birokrasi yang terlalu kaku.",
      explanation: "Profil ini mencerminkan tingkat internalisasi nilai yang tinggi. Karyawan merasa memiliki (sense of ownership) yang kuat terhadap visi organisasi karena nilai-nilai pribadi mereka bersinergi dengan misi lembaga. Kebutuhan dasar akan otonomi dan kompetensi mereka terpenuhi secara organik, sehingga mereka menjadi motor penggerak inisiatif tanpa membutuhkan stimulus eksternal yang bersifat koersif."
    };
  }

  // 4. Sang Pragmatis / Pekerja Transaksional (Dominan Terkontrol)
  return {
    label: "Sang Pragmatis / Pekerja Transaksional",
    icon: "🎯",
    color: "orange",
    indicators: "Terkontrol Dominan",
    traits: "Bekerja keras karena faktor eksternal (gaji/status). Belum 'membeli' visi lembaga sepenuhnya.",
    treatment: "Pastikan JD dan KPI sangat jelas. HR harus mulai membangun Keterkaitan (Relatedness) agar mereka merasa dihargai secara personal.",
    explanation: "Karyawan beroperasi terutama di bawah kendali regulasi eksternal dan introjeksi. Kinerja mereka cenderung fluktuatif, sangat bergantung pada kehadiran insentif atau tekanan pengawasan. Karena nilai-nilai organisasi belum terinternalisasi secara mendalam, terdapat risiko penurunan performa jika stimulus eksternal dianggap tidak lagi memadai. Fokus pengembangan harus diarahkan pada membangun keterkaitan emosional dengan tim."
  };
}

export function getScoreGradation(score: number): "Rendah" | "Menengah" | "Tinggi" {
  if (score < 3.0) return "Rendah";
  if (score < 5.0) return "Menengah";
  return "Tinggi";
}
