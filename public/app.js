const mountAuthTemplate = () => {
  const mount = document.getElementById("loginScreenMount");
  if (!mount) return;
  if (typeof window.AUTH_TEMPLATE !== "string" || !window.AUTH_TEMPLATE.trim()) {
    console.error("Auth template missing: public/auth-template.js");
    mount.innerHTML = `
      <div id="loginScreen" class="login-screen">
        <div class="login-card">
          <h1>AtlanticoFit</h1>
          <p class="helper">Falha ao carregar o ecrã de autenticação. Recarrega a página.</p>
        </div>
      </div>
    `;
    return;
  }
  mount.outerHTML = window.AUTH_TEMPLATE;
};

mountAuthTemplate();
if (typeof lucide !== "undefined") lucide.createIcons();
const API_BASE = window.location.origin + "/api";

// Safe JSON.parse — returns fallback instead of throwing on corrupted storage
const safeParse = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "undefined" || raw === "null") return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch (_) {
    localStorage.removeItem(key); // clear the corrupted entry
    return fallback;
  }
};

const state = {
  // UI-only ephemeral state — health data is NOT persisted to localStorage
  profiles: [],
  tests:    [],
  years:    safeParse("af_years", []),  // anonymised chart data only
  alerts:   [],
  defers:   Number(sessionStorage.getItem("af_defers")) || 0,
  token:    localStorage.getItem("af_token") || sessionStorage.getItem("af_token") || "",
  user:     safeParse("af_user", null) || (() => { try { const r = sessionStorage.getItem("af_user"); return r ? JSON.parse(r) : null; } catch { return null; } })(),
  currentStudentId: Number(sessionStorage.getItem("af_student_id")) || null, // session-only, not persisted cross-tab
  lastBiometrics: null,
  classStudents: [],
  dispensas: [],
};

const bmiTable = {
  F: {
    9: [13.3, 18.7],
    10: [13.7, 19.4],
    11: [14.1, 20.3],
    12: [14.7, 21.3],
    13: [15.2, 22.3],
    14: [15.7, 23.1],
    15: [16.0, 23.8],
    16: [16.3, 24.3],
    17: [16.4, 24.6],
    18: [18.5, 25.0],
  },
  M: {
    9: [13.6, 18.2],
    10: [13.9, 18.8],
    11: [14.2, 19.5],
    12: [14.7, 20.4],
    13: [15.2, 21.3],
    14: [15.7, 22.2],
    15: [16.3, 23.1],
    16: [16.7, 23.9],
    17: [17.1, 24.6],
    18: [18.5, 25.0],
  },
};

const waistTable = {
  F: {
    9: 66.8,
    10: 68.9,
    11: 70.8,
    12: 72.5,
    13: 74.2,
    14: 75.7,
    15: 76.8,
    16: 77.7,
    17: 78.5,
    18: 79.2,
  },
  M: {
    9: 77.1,
    10: 80.1,
    11: 82.6,
    12: 85.1,
    13: 87.0,
    14: 88.9,
    15: 90.5,
    16: 91.8,
    17: 92.7,
    18: 93.4,
  },
};

const testTable = {
  F: {
    9: {
      vai: [17, 35],
      cooper: [11, 21],
      velocidade: [8.3, 7.2],
      milha: ["13:30", "9:00"],
      agilidade: [14.37, 12.15],
      abd: [3, 30],
      bracos: [1, 12],
      senta: [23.0, 31.4],
    },
    10: {
      vai: [17, 35],
      cooper: [11, 21],
      velocidade: [8.3, 7.2],
      milha: ["13:30", "9:00"],
      agilidade: [14.37, 12.15],
      abd: [3, 30],
      bracos: [1, 12],
      senta: [23.0, 31.4],
    },
    11: {
      vai: [17, 35],
      cooper: [11, 21],
      velocidade: [8.3, 7.2],
      milha: ["13:30", "9:00"],
      agilidade: [14.37, 12.15],
      abd: [3, 30],
      bracos: [1, 12],
      senta: [23.0, 31.4],
    },
    12: {
      vai: [22, 41],
      cooper: [13, 23],
      velocidade: [8.0, 7.1],
      milha: ["13:00", "8:30"],
      agilidade: [14.05, 12.0],
      abd: [4, 40],
      bracos: [2, 12],
      senta: [23.0, 33.3],
    },
    13: {
      vai: [22, 41],
      cooper: [13, 23],
      velocidade: [8.0, 7.1],
      milha: ["13:00", "8:30"],
      agilidade: [14.05, 12.0],
      abd: [4, 40],
      bracos: [2, 12],
      senta: [23.0, 33.3],
    },
    14: {
      vai: [27, 44],
      cooper: [15, 25],
      velocidade: [7.9, 6.4],
      milha: ["12:30", "8:00"],
      agilidade: [13.84, 11.83],
      abd: [5, 45],
      bracos: [2, 13],
      senta: [28.0, 35.3],
    },
    15: {
      vai: [27, 44],
      cooper: [15, 25],
      velocidade: [7.9, 6.4],
      milha: ["12:30", "8:00"],
      agilidade: [13.84, 11.83],
      abd: [5, 45],
      bracos: [2, 13],
      senta: [28.0, 35.3],
    },
    16: {
      vai: [27, 55],
      cooper: [13, 29],
      velocidade: [8.6, 6.4],
      milha: ["12:00", "7:30"],
      agilidade: [14.2, 11.2],
      abd: [3, 65],
      bracos: [1, 19],
      senta: [25.5, 36.0],
    },
    17: {
      vai: [27, 55],
      cooper: [13, 29],
      velocidade: [8.6, 6.4],
      milha: ["12:00", "7:30"],
      agilidade: [14.2, 11.2],
      abd: [3, 65],
      bracos: [1, 19],
      senta: [25.5, 36.0],
    },
    18: {
      vai: [27, 55],
      cooper: [13, 29],
      velocidade: [8.6, 6.4],
      milha: ["12:00", "7:30"],
      agilidade: [14.2, 11.2],
      abd: [3, 65],
      bracos: [1, 19],
      senta: [25.5, 36.0],
    },
  },
  M: {
    9: {
      vai: [17, 47],
      cooper: [13, 18],
      velocidade: [7.9, 7.1],
      milha: ["13:00", "8:20"],
      agilidade: [13.55, 12.03],
      abd: [5, 34],
      bracos: [3, 16],
      senta: [20.3, 28.9],
    },
    10: {
      vai: [28, 59],
      cooper: [15, 19],
      velocidade: [7.3, 6.6],
      milha: ["12:00", "8:00"],
      agilidade: [12.92, 11.47],
      abd: [6, 46],
      bracos: [6, 17],
      senta: [20.3, 29.2],
    },
    11: {
      vai: [42, 76],
      cooper: [17, 21],
      velocidade: [6.9, 6.1],
      milha: ["11:00", "7:00"],
      agilidade: [12.43, 10.96],
      abd: [8, 55],
      bracos: [8, 20],
      senta: [20.3, 31.9],
    },
    12: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.50, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    13: {
      vai: [47, 82],
      cooper: [19, 23],
      velocidade: [6.5, 5.7],
      milha: ["10:00", "6:15"],
      agilidade: [11.20, 10.00],
      abd: [12, 55],
      bracos: [12, 27],
      senta: [18.5, 33.0],
    },
    14: {
      vai: [47, 82],
      cooper: [20, 24],
      velocidade: [6.4, 5.6],
      milha: ["9:30", "6:00"],
      agilidade: [11.00, 9.80],
      abd: [14, 55],
      bracos: [14, 30],
      senta: [16.5, 33.0],
    },
    15: {
      vai: [47, 82],
      cooper: [20, 25],
      velocidade: [6.3, 5.5],
      milha: ["9:00", "5:45"],
      agilidade: [10.90, 9.70],
      abd: [16, 55],
      bracos: [16, 35],
      senta: [16.5, 33.0],
    },
    16: {
      vai: [47, 82],
      cooper: [21, 25],
      velocidade: [6.2, 5.4],
      milha: ["9:00", "5:30"],
      agilidade: [10.80, 9.60],
      abd: [18, 55],
      bracos: [18, 35],
      senta: [15.0, 33.0],
    },
    17: {
      vai: [47, 82],
      cooper: [21, 25],
      velocidade: [6.1, 5.4],
      milha: ["8:30", "5:30"],
      agilidade: [10.70, 9.50],
      abd: [18, 55],
      bracos: [18, 35],
      senta: [15.0, 33.0],
    },
    18: {
      vai: [47, 82],
      cooper: [21, 25],
      velocidade: [6.0, 5.3],
      milha: ["8:30", "5:15"],
      agilidade: [10.60, 9.40],
      abd: [18, 55],
      bracos: [18, 35],
      senta: [14.0, 33.0],
    },
  },
};

const testOptions = [
  { id: "vai", label: "Vai e Vem", unit: "percursos", better: "high", category: "Capacidade Aeróbia" },
  { id: "cooper", label: "Cooper", unit: "voltas", better: "high", category: "Capacidade Aeróbia" },
  { id: "milha", label: "Milha 1609m", unit: "mm:ss", better: "low", category: "Capacidade Aeróbia" },
  { id: "velocidade", label: "Velocidade 40m", unit: "s", better: "low", category: "Velocidade e Agilidade" },
  { id: "agilidade", label: "Agilidade 4×10m", unit: "s", better: "low", category: "Velocidade e Agilidade" },
  { id: "abd", label: "Abdominais", unit: "reps", better: "high", category: "Força Muscular" },
  { id: "bracos", label: "Extensões de braços", unit: "reps", better: "high", category: "Força Muscular" },
  { id: "senta", label: "Senta e alcança", unit: "cm", better: "high", category: "Flexibilidade" },
];

const elements = {
  topbarStats: document.getElementById("topbarStats"),
  statStudentsWrap: document.getElementById("statStudentsWrap"),
  statStudents: document.getElementById("statStudents"),
  statRecords: document.getElementById("statRecords"),
  statAlertsWrap: document.getElementById("statAlertsWrap"),
  statAlerts: document.getElementById("statAlerts"),
  roleSelect: document.getElementById("roleSelect"),
  userEmail: document.getElementById("userEmail"),
  userPassword: document.getElementById("userPassword"),
  rememberMe: document.getElementById("rememberMe"),
  togglePassword: document.getElementById("togglePassword"),
  consentRgpd: document.getElementById("consentRgpd"),
  consentShare: document.getElementById("consentShare"),
  registerUser: document.getElementById("registerUser"),
  loginUser: document.getElementById("loginUser"),
  logoutUserBtn: document.getElementById("logoutUserBtn"),
  profileBtn: document.getElementById("profileBtn"),
  topbarInitials: document.getElementById("topbarInitials"),
  topbarEmail: document.getElementById("topbarEmail"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileEmail: document.getElementById("profileEmail"),
  profileRoleBadge: document.getElementById("profileRoleBadge"),
  saveAccess: document.getElementById("saveAccess"),
  accessStatus: document.getElementById("accessStatus"),
  studentName: document.getElementById("studentName"),
  studentSex: document.getElementById("studentSex"),
  studentBirthDate: document.getElementById("studentBirthDate"),
  studentHeight: document.getElementById("studentHeight"),
  studentWeight: document.getElementById("studentWeight"),
  studentFat: document.getElementById("studentFat"),
  studentWaist: document.getElementById("studentWaist"),
  schoolYear: document.getElementById("schoolYear"),
  calcImc: document.getElementById("calcImc"),
  saveStudent: document.getElementById("saveStudent"),
  saveBiometrics: document.getElementById("saveBiometrics"),
  imcValue: document.getElementById("imcValue"),
  imcZone: document.getElementById("imcZone"),
  imcNote: document.getElementById("imcNote"),
  waistZone: document.getElementById("waistZone"),
  waistNote: document.getElementById("waistNote"),
  addTestRow: document.getElementById("addTestRow"),
  testsTable: document.getElementById("testsTable"),
  saveTests: document.getElementById("saveTests"),
  reportText: document.getElementById("reportText"),
  reportEmail: document.getElementById("reportEmail"),
  generateReport: document.getElementById("generateReport"),
  sendReport: document.getElementById("sendReport"),
  addYear: document.getElementById("addYear"),
  chartYear: document.getElementById("chartYear"),
  chartClassImc: document.getElementById("chartClassImc"),
  qActivity: document.getElementById("qActivity"),
  qSleep: document.getElementById("qSleep"),
  qSport: document.getElementById("qSport"),
  qStress: document.getElementById("qStress"),
  qFood: document.getElementById("qFood"),
  qMood: document.getElementById("qMood"),
  qEnergy: document.getElementById("qEnergy"),
  qScreen: document.getElementById("qScreen"),
  qHydration: document.getElementById("qHydration"),
  questProgressBar: document.getElementById("questProgressBar"),
  questProgressLabel: document.getElementById("questProgressLabel"),
  questInitialStatus: document.getElementById("questInitialStatus"),
  questRoutineStatus: document.getElementById("questRoutineStatus"),
  submitInitial: document.getElementById("submitInitial"),
  deferInitial: document.getElementById("deferInitial"),
  deferStatus: document.getElementById("deferStatus"),
  submitRoutine: document.getElementById("submitRoutine"),
  sosPsych: document.getElementById("sosPsych"),
  sosPsychEmail: document.getElementById("sosPsychEmail"),
  sosTeacher: document.getElementById("sosTeacher"),
  sosTeacherEmail: document.getElementById("sosTeacherEmail"),
  triggerSos: document.getElementById("triggerSos"),
  sosResult: document.getElementById("sosResult"),
  protocolsModal: document.getElementById("protocolsModal"),
  viewProtocols: document.getElementById("viewProtocols"),
  closeProtocols: document.getElementById("closeProtocols"),
  startOnboarding: document.getElementById("startOnboarding"),
  // New shell elements
  loadingScreen: document.getElementById("loadingScreen"),
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  topbarUser: document.getElementById("topbarUser"),
  bottomnav: document.getElementById("bottomnav"),
  toastEl: document.getElementById("toast"),
  bioStatus: document.getElementById("bioStatus"),
  dispensaRecipient: document.getElementById("dispensaStudentId"),
  dispensaReason: document.getElementById("dispensaReason"),
  dispensaStartDate: document.getElementById("dispensaStartDate"),
  dispensaEndDate: document.getElementById("dispensaEndDate"),
  dispensaMedical: document.getElementById("dispensaMedical"),
  registerDispensa: document.getElementById("registerDispensa"),
  dispensaStatus: document.getElementById("dispensaStatus"),
  dispensasCard: document.getElementById("dispensasCard"),
  turmaCard: document.getElementById("turmaCard"),
  turmaYear: document.getElementById("turmaYear"),
  loadTurma: document.getElementById("loadTurma"),
  turmaTable: document.getElementById("turmaTable"),
  turmaStatus: document.getElementById("turmaStatus"),
};

let studentChart = null;
let classChart = null;

// Helper: calculate integer age from a YYYY-MM-DD birth date string
const calcAgeFromBirthDate = (birthDateStr) => {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr + "T00:00:00");
  if (isNaN(birth)) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const toSeconds = (value) => {
  const parts = value.split(":");
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
    return minutes * 60 + seconds;
  }
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const apiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erro" }));
    throw new Error(error.error || "Erro de API");
  }
  return response.json();
};

// --- Toast ------------------------------------------------------------------
let _toastTimer = null;
const toast = (msg, type = "") => {
  const el = elements.toastEl;
  if (!el) return;
  el.textContent = msg;
  el.className = "toast" + (type ? " " + type : "");
  el.classList.remove("hidden");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add("hidden"), 3500);
};

const updateAccessStatus = (text) => {
  toast(text);
  if (elements.bioStatus) elements.bioStatus.textContent = text;
  if (elements.accessStatus) elements.accessStatus.textContent = text;
};

const formatZone = (label, ok) => (ok ? `Zona Saudável (${label})` : "Zona de Melhoria");

const getAgeKey = (age) => {
  if (!age) return null;
  if (age >= 18) return 18;
  return age;
};

const calculateImc = () => {
  const age = calcAgeFromBirthDate(elements.studentBirthDate?.value);
  const height = Number(elements.studentHeight.value);
  const weight = Number(elements.studentWeight.value);
  const waist = Number(elements.studentWaist.value);
  const sex = elements.studentSex.value;
  const ageKey = getAgeKey(age);

  if (!ageKey || !height || !weight || !sex) {
    elements.imcNote.textContent = "Preencha idade, sexo, altura e peso.";
    return;
  }
  if (!bmiTable[sex]?.[ageKey]) {
    elements.imcNote.textContent = "Sexo ou idade sem referência de avaliação.";
    return;
  }

  const imc = weight / (height * height);
  const [min, max] = bmiTable[sex][ageKey];
  const inZone = imc >= min && imc <= max;
  let waistOk = null;

  elements.imcValue.textContent = imc.toFixed(1);
  elements.imcZone.textContent = inZone ? "Zona Saudável" : "Zona de Melhoria";
  elements.imcZone.className = inZone ? "zone--ok" : "zone--needs";
  if (elements.imcNote) elements.imcNote.textContent = inZone
    ? "IMC dentro da Zona Saudável."
    : `IMC fora da Zona Saudável (${min}–${max}). Risco cardiovascular aumentado.`;

  // Reveal result card on first successful calculation
  const resultEl = document.getElementById("imcResult");
  if (resultEl) resultEl.classList.remove("hidden");

  if (waist) {
    const maxWaist = waistTable[sex][ageKey];
    waistOk = waist <= maxWaist;
    elements.waistZone.textContent = waistOk ? "Zona Saudável" : "Zona de Melhoria";
    elements.waistZone.className = waistOk ? "zone--ok" : "zone--needs";
    elements.waistNote.textContent = waistOk
      ? "Perímetro dentro da Zona Saudável."
      : `Perímetro elevado (limite: ${maxWaist} cm). Associado a risco cardiometabólico.`;
  } else {
    elements.waistZone.textContent = "-";
    elements.waistZone.className = "";
    elements.waistNote.textContent = "";
  }

  state.lastBiometrics = {
    height,
    weight,
    fat: Number(elements.studentFat.value) || null,
    waist: waist || null,
    imc: Number(imc.toFixed(1)),
    imcZone: inZone ? "Zona Saudável" : "Zona de Melhoria",
    waistZone: waistOk === null ? null : waistOk ? "Zona Saudável" : "Zona de Melhoria",
  };
};

const buildTestRow = () => {
  const row = document.createElement("div");
  row.className = "table__row";

  const testSelect = document.createElement("select");
  const byCategory = testOptions.reduce((acc, option) => {
    const key = option.category || "Outros";
    if (!acc[key]) acc[key] = [];
    acc[key].push(option);
    return acc;
  }, {});
  Object.entries(byCategory).forEach(([category, options]) => {
    const group = document.createElement("optgroup");
    group.label = category;
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.id;
      option.textContent = opt.label;
      group.appendChild(option);
    });
    testSelect.appendChild(group);
  });

  const resultInput = document.createElement("input");
  resultInput.placeholder = "Resultado";

  const unitInput = document.createElement("input");
  unitInput.placeholder = "Unidade";

  const zoneSpan = document.createElement("span");
  zoneSpan.className = "zone-badge zone-badge--na";
  zoneSpan.textContent = "-";

  row.appendChild(testSelect);
  row.appendChild(resultInput);
  row.appendChild(unitInput);
  row.appendChild(zoneSpan);

  const updateZone = () => {
    const age = calcAgeFromBirthDate(elements.studentBirthDate?.value);
    const sex = elements.studentSex.value;
    const ageKey = getAgeKey(age);
    const testId = testSelect.value;
    if (!ageKey) return;

    const valueRaw = resultInput.value.trim();
    if (!valueRaw) { zoneSpan.textContent = "-"; zoneSpan.className = "zone-badge zone-badge--na"; return; }

    const testData = testTable[sex]?.[ageKey]?.[testId];
    if (!testData) { zoneSpan.textContent = "N/D"; zoneSpan.className = "zone-badge zone-badge--na"; return; }

    const testInfo = testOptions.find((opt) => opt.id === testId);
    let ok = false;

    if (testInfo.better === "high") {
      const min = testData[0];
      ok = Number(valueRaw) >= min;
    } else {
      const maxTime = testData[0];
      const value = toSeconds(valueRaw);
      const maxSeconds = toSeconds(maxTime);
      ok = value !== null && maxSeconds !== null && value <= maxSeconds;
    }

    zoneSpan.textContent = ok ? "Zona Saudável" : "Zona de Melhoria";
    zoneSpan.className = ok ? "zone-badge zone-badge--ok" : "zone-badge zone-badge--needs";
    unitInput.value = testInfo.unit;
  };

  testSelect.addEventListener("change", updateZone);
  resultInput.addEventListener("input", updateZone);

  return row;
};

const renderTests = () => {
  elements.testsTable.querySelectorAll(".table__row:not(.table__header)").forEach((row) => row.remove());
  if (state.tests.length === 0) {
    elements.testsTable.appendChild(buildTestRow());
    return;
  }

  state.tests.forEach((test) => {
    const row = buildTestRow();
    const select = row.querySelector("select");
    const inputs = row.querySelectorAll("input");
    select.value = test.id;
    inputs[0].value = test.value;
    inputs[1].value = test.unit;
    elements.testsTable.appendChild(row);
    inputs[0].dispatchEvent(new Event("input"));
  });
};

const saveTests = () => {
  const rows = elements.testsTable.querySelectorAll(".table__row:not(.table__header)");
  const collected = [];
  rows.forEach((row) => {
    const select = row.querySelector("select");
    const inputs = row.querySelectorAll("input");
    const zone = row.querySelector("span")?.textContent || "-";
    if (!inputs[0].value) return;
    collected.push({
      id: select.value,
      value: inputs[0].value,
      unit: inputs[1].value,
      zone,
    });
  });
  state.tests = collected;
  // Health data is NOT persisted to localStorage — kept in memory only
  updateStats();
  if (state.token && state.currentStudentId && collected.length > 0) {
    apiFetch(`/students/${state.currentStudentId}/tests`, {
      method: "POST",
      body: JSON.stringify({ tests: collected }),
    }).catch((err) => updateAccessStatus(err.message));
  }
};

const updateStats = () => {
  elements.statRecords.textContent = state.tests.length;
};

const hasPermission = (permission) => {
  return Array.isArray(state.user?.permissions) && state.user.permissions.includes(permission);
};

const setTopbarVisibility = ({ students, alerts }) => {
  if (elements.statStudentsWrap) elements.statStudentsWrap.classList.toggle("hidden", !students);
  if (elements.statAlertsWrap) elements.statAlertsWrap.classList.toggle("hidden", !alerts);
  if (elements.topbarStats) elements.topbarStats.classList.toggle("hidden", !students && !alerts);
};

const setTopbarStats = ({ students, alerts }) => {
  if (elements.statStudents) elements.statStudents.textContent = String(students ?? 0);
  if (elements.statAlerts) elements.statAlerts.textContent = String(alerts ?? 0);
};

const hydrateSessionUser = async () => {
  if (!state.token) return;
  try {
    const me = await apiFetch("/users/me");
    if (!me) return;
    state.user = me;
    localStorage.setItem("af_user", JSON.stringify(me));
    const initials = (me.email || "?").charAt(0).toUpperCase();
    if (elements.topbarInitials) elements.topbarInitials.textContent = initials;
    if (elements.topbarEmail) elements.topbarEmail.textContent = me.email || "";
  } catch (_) {}
};

const refreshTopbarStats = async () => {
  if (!state.token || !state.user) {
    setTopbarVisibility({ students: false, alerts: false });
    setTopbarStats({ students: 0, alerts: 0 });
    return;
  }

  const role = state.user?.role;
  const canListStudents = hasPermission("list_students") && role !== "aluno" && role !== "pais";
  const canReadSos = hasPermission("read_sos") && (role === "professor" || role === "psicologo");
  setTopbarVisibility({ students: canListStudents, alerts: canReadSos });

  if (!canListStudents) {
    setTopbarStats({ students: 0, alerts: 0 });
    return;
  }

  try {
    // Single aggregated request — replaces the previous N+1 pattern
    const summary = await apiFetch("/stats/summary");
    setTopbarStats({
      students: summary.studentCount ?? 0,
      alerts: summary.openSosCount ?? 0,
    });
  } catch (_) {
    setTopbarStats({ students: 0, alerts: 0 });
  }
};

const saveProfile = () => {
  const payload = {
    role: elements.roleSelect.value,
    consent_rgpd: elements.consentRgpd.checked,
    consent_share: elements.consentShare.checked,
  };
  if (!state.token) {
    updateAccessStatus("Sem sess\u00e3o ativa. Faz login primeiro.");
    return;
  }
  apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  })
    .then((user) => {
      state.user = user;
      localStorage.setItem("af_user", JSON.stringify(user));
      updateAccessStatus("Perfil guardado com sucesso.");
    })
    .catch((err) => updateAccessStatus(err.message));
};

const registerUser = () => {
  const email = elements.userEmail.value.trim();
  const password = elements.userPassword.value.trim();
  const role = elements.roleSelect.value;
  if (!email || !password) {
    toast("Email e palavra-passe s\u00e3o obrigat\u00f3rios.", "error");
    return;
  }
  if (!role) {
    toast("Seleciona o perfil da conta para registo.", "error");
    return;
  }
  showLoading();
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email, password, role,
      consent_rgpd: elements.consentRgpd?.checked || false,
      consent_share: elements.consentShare?.checked || false,
    }),
  })
    .then((data) => {
      if (!data?.token || !data?.user) {
        hideLoading();
        toast("Resposta do servidor inválida. Tenta outra vez.", "error");
        return;
      }
      state.token = data.token;
      state.user = data.user;
      // For new registrations always use sessionStorage — no persistent disk storage
      // until the user explicitly logs in with "Lembrar-me" checked.
      sessionStorage.setItem("af_token", state.token);
      sessionStorage.setItem("af_user", JSON.stringify(state.user));
      localStorage.removeItem("af_token");
      localStorage.removeItem("af_user");
      showApp(state.user);
      toast(`Bem-vindo/a! Conta criada: ${data.user.email}`, "success");
    })
    .catch((err) => {
      hideLoading();
      toast(err.message, "error");
    });
};

const loginUser = () => {
  const email = elements.userEmail.value.trim();
  const password = elements.userPassword.value.trim();
  if (!email || !password) {
    toast("Email e palavra-passe s\u00e3o obrigat\u00f3rios.", "error");
    return;
  }
  showLoading();
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
    .then((data) => {
      if (!data?.token || !data?.user) {
        hideLoading();
        toast("Resposta do servidor inválida. Tenta outra vez.", "error");
        return;
      }
      const registerFields = document.getElementById("registerFields");
      const showRegisterBtn = document.getElementById("showRegister");
      if (registerFields) registerFields.classList.add("hidden");
      if (showRegisterBtn) showRegisterBtn.textContent = "Criar conta";
      if (elements.roleSelect) elements.roleSelect.value = "";

      state.token = data.token;
      state.user = data.user;
      const remember = document.getElementById("rememberMe")?.checked ?? true;
      const store = remember ? localStorage : sessionStorage;
      const clearStore = remember ? sessionStorage : localStorage;
      store.setItem("af_token", state.token);
      store.setItem("af_user", JSON.stringify(state.user));
      clearStore.removeItem("af_token");
      clearStore.removeItem("af_user");
      showApp(state.user);
      toast(`Bem-vindo/a, ${data.user.email}`, "success");
    })
    .catch((err) => {
      hideLoading();
      toast(err.message, "error");
    });
};

const ROLE_LABELS = { aluno: "Aluno", professor: "Professor", psicologo: "Psicólogo", pais: "Pais / E.E." };

const populateProfileTab = () => {
  const user = state.user;
  if (!user) return;
  const initials = (user.email || "?").charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[user.role] || user.role || "—";
  if (elements.profileEmail) elements.profileEmail.textContent = user.email || "—";
  if (elements.profileRoleBadge) {
    elements.profileRoleBadge.textContent = roleLabel;
    elements.profileRoleBadge.dataset.role = user.role || "";
  }
  if (elements.profileAvatar) elements.profileAvatar.textContent = initials;
  if (elements.topbarInitials) elements.topbarInitials.textContent = initials;
  if (elements.topbarEmail) elements.topbarEmail.textContent = user.email || "";

  // Stats card
  const statsGrid = document.getElementById("profileStatsGrid");
  if (statsGrid) {
    const statStudents = state.classStudents?.length ?? Number(elements.statStudents?.textContent ?? 0);
    const statAlerts = Number(elements.statAlerts?.textContent ?? 0);
    const statRecordsVal = state.tests?.length ?? 0;
    const items = [];
    if (user.role === "professor") {
      const classCount = state.classStudents?.length ?? 0;
      items.push({ value: classCount > 0 ? String(classCount) : "—", label: "Turma (sessão)" });
      items.push({ value: String(state.tests.length), label: "Testes registados" });
    }
    if (user.role === "psicologo") {
      items.push({ value: "✓", label: "Sessão ativa" });
    }
    if (user.role === "aluno") {
      items.push({ value: String(statRecordsVal), label: "Testes" });
      items.push({ value: sessionStorage.getItem("af_initial") === "done" ? "✓" : "–", label: "Quest. Inicial" });
    }
    if (user.role === "pais") {
      items.push({ value: "✓", label: "Ligado" });
    }
    items.push({ value: new Date().toLocaleDateString("pt-PT"), label: "Hoje" });
    statsGrid.innerHTML = items.map(it =>
      `<div class="profile-stat-item"><span class="profile-stat-item__value">${it.value}</span><span class="profile-stat-item__label">${it.label}</span></div>`
    ).join("");
  }

  // Sync dark mode toggle
  const dmToggle = document.getElementById("darkModeToggle");
  if (dmToggle) {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    dmToggle.classList.toggle("on", isDark);
  }
  // Sync language pills
  const langBtns = document.querySelectorAll("#langPillWrap .pill-select__btn");
  langBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
};

const logoutUser = () => {
  state.token = "";
  state.user = null;
  localStorage.removeItem("af_token");
  localStorage.removeItem("af_user");
  sessionStorage.removeItem("af_token");
  sessionStorage.removeItem("af_user");
  showLogin();
};

const saveStudent = () => {
  if (!state.token) {
    updateAccessStatus("Sem sessão ativa. Faz login primeiro.");
    return;
  }
  const name = elements.studentName.value.trim();
  const sex = elements.studentSex.value;
  const birthDate = elements.studentBirthDate?.value || null;
  const age = calcAgeFromBirthDate(birthDate);
  const schoolYear = elements.schoolYear.value.trim();
  if (!name || !sex || (!birthDate && !age)) {
    updateAccessStatus("Preenche nome, sexo e data de nascimento do aluno.");
    return;
  }
  apiFetch("/students", {
    method: "POST",
    body: JSON.stringify({ name, sex, birthDate, age, schoolYear }),
  })
    .then((student) => {
      state.currentStudentId = student.id;
      sessionStorage.setItem("af_student_id", String(student.id)); // session-only
      updateAccessStatus(`Aluno guardado: ${student.name}`);
      refreshTopbarStats();
    })
    .catch((err) => updateAccessStatus(err.message));
};

const saveBiometrics = () => {
  if (!state.token || !state.currentStudentId) {
    updateAccessStatus("Guarda o aluno antes da biometria.");
    return;
  }
  if (!state.lastBiometrics) {
    calculateImc();
  }
  if (!state.lastBiometrics) return;

  apiFetch(`/students/${state.currentStudentId}/biometrics`, {
    method: "POST",
    body: JSON.stringify(state.lastBiometrics),
  })
    .then(() => updateAccessStatus("Biometria guardada."))
    .catch((err) => updateAccessStatus(err.message));
};

const buildTextReport = () => {
  const name = elements.studentName.value || "Aluno";
  const birthDate = elements.studentBirthDate?.value || null;
  const birthLabel = birthDate ? new Date(birthDate + "T00:00:00").toLocaleDateString("pt-PT") : "-";
  const age = calcAgeFromBirthDate(birthDate);
  const sex = elements.studentSex.value === "F" ? "Feminino" : elements.studentSex.value === "M" ? "Masculino" : "Não definido";
  const year = elements.schoolYear.value || "-";
  const imc = elements.imcValue.textContent || "-";
  const imcZone = elements.imcZone.textContent || "-";
  const waistRaw = elements.studentWaist.value;
  const waistZoneText = elements.waistZone.textContent || "-";
  const waistVal = waistRaw ? `${waistRaw} cm — ${waistZoneText}` : "Não registado";

  const rows = elements.testsTable.querySelectorAll(".table__row:not(.table__header)");
  const testsByCategory = {};
  rows.forEach((row) => {
    const select = row.querySelector("select");
    const inputs = row.querySelectorAll("input");
    const badge = row.querySelector(".zone-badge");
    if (!inputs[0]?.value) return;
    const selected = testOptions.find((t) => t.id === select?.value);
    const label = selected?.label || select?.value || "-";
    const category = selected?.category || "Outros";
    if (!testsByCategory[category]) testsByCategory[category] = [];
    testsByCategory[category].push(`  ${label}: ${inputs[0].value} ${inputs[1].value} — ${badge?.textContent || "-"}`);
  });
  const testSections = Object.entries(testsByCategory).map(([category, lines]) => `${category}\n${lines.join("\n")}`);

  const imcAdvisory = imcZone === "Zona Saudável" || imcZone === "Zona Saudavel"
    ? "O IMC do seu educando encontra-se dentro da Zona Saudável para a sua idade e sexo."
    : "ATENÇÃO: Um IMC elevado está associado a um risco cardiovascular elevado, assim como a problemas metabólicos e osteoarticulares. Recomendamos uma consulta com o médico de família.";
  const waistAdvisory = !waistRaw ? ""
    : (waistZoneText === "Zona Saudável" || waistZoneText === "Zona Saudavel")
      ? "O perímetro da cintura encontra-se dentro dos valores de referência saudáveis."
      : "ATENÇÃO: O Perímetro da Cintura relaciona-se com a gordura abdominal. Um perímetro elevado é considerado um fator de risco de doenças cardiometabólicas e respiratórias.";

  const now = new Date().toLocaleDateString("pt-PT");
  return (
`===========================================
RELATÓRIO HEALTHYTECH ATLA’NTICO — ${now}
Colégio Atlântico
Educação Física — Avaliação Física
===========================================

Aluno: ${name}
Data de Nasc.: ${birthLabel}  |  Sexo: ${sex}  |  Ano letivo: ${year}

--- COMPOSIÇÃO CORPORAL ---
IMC: ${imc} kg/m²  —  ${imcZone}
Perímetro da cintura: ${waistVal}

--- BATERIA DE TESTES FÍSICOS ---
${testSections.length ? testSections.join("\n\n") : "Sem testes registados."}

--- INFORMAÇÃO PARA O ENCARREGADO DE EDUCAÇÃO ---
${imcAdvisory}
${waistAdvisory ? "\n" + waistAdvisory : ""}

Consulte o/a professor/a de Educação Física para mais informações.
As Zonas de Aptidão Física (ZAF) são calculadas de acordo com os
critérios de avaliação da aptidão física para a idade e sexo do(a) aluno(a).
===========================================`);
};

const updateReport = () => buildTextReport(); // legacy shim — kept for compat


const sendReport = () => {
  const content = buildTextReport();
  const email = elements.reportEmail.value.trim() || elements.userEmail.value.trim() || "";
  if (!email) {
    updateAccessStatus("Insere o email do destinatário no campo Email do relatório.");
    return;
  }
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/reports/email`, {
      method: "POST",
      body: JSON.stringify({ content, email }),
    })
      .then(() => {
        updateAccessStatus("Relatório enviado por email.");
        const s = document.getElementById("reportStatus");
        if (s) { s.textContent = "Relatório enviado por email."; }
      })
      .catch((err) => updateAccessStatus("Erro: " + err.message));
  } else {
    const subject = encodeURIComponent("Relatório HealthyTech Atlântico");
    const body = encodeURIComponent(content);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }
};

/* ═══════════════════════════════════════════════════
   GENERATE PDF — jsPDF branded report
═══════════════════════════════════════════════════ */
const generatePDF = () => {
  if (!window.jspdf) {
    toast("Biblioteca PDF não carregada. Atualiza a página.", "error");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Collect data ────────────────────────────────────────────────────────
  const name = elements.studentName.value || "Aluno";
  const birthDateStr = elements.studentBirthDate?.value || null;
  const birthLabel = birthDateStr
    ? new Date(birthDateStr + "T00:00:00").toLocaleDateString("pt-PT")
    : "—";
  const age = calcAgeFromBirthDate(birthDateStr);
  const sex = elements.studentSex.value === "F" ? "Feminino"
    : elements.studentSex.value === "M" ? "Masculino" : "—";
  const year = elements.schoolYear.value || "—";
  const imc = elements.imcValue.textContent || "—";
  const imcZone = elements.imcZone.textContent || "—";
  const waistRaw = elements.studentWaist.value;
  const waistZoneText = elements.waistZone.textContent || "—";
  const waistVal = waistRaw ? `${waistRaw} cm` : "Não registado";

  const testRows = elements.testsTable.querySelectorAll(".table__row:not(.table__header)");
  const tests = [];
  testRows.forEach((row) => {
    const sel = row.querySelector("select");
    const inputs = row.querySelectorAll("input");
    const badge = row.querySelector(".zone-badge");
    if (!inputs[0]?.value) return;
    const found = testOptions.find((t) => t.id === sel?.value);
    tests.push({
      label: (found?.label || sel?.value || "—").substring(0, 44),
      result: inputs[0].value,
      unit: inputs[1]?.value || "",
      zone: badge?.textContent || "—",
    });
  });

  const imcOk = imcZone === "Zona Saudável" || imcZone === "Zona Saudavel";
  const imcAdvisory = imcOk
    ? "O IMC do seu educando encontra-se dentro da Zona Saudável para a sua idade e sexo."
    : "ATENÇÃO: Um IMC elevado está associado a um risco cardiovascular elevado, assim como a problemas metabólicos e osteoarticulares. Recomendamos uma consulta com o médico de família.";
  const waistOk = waistZoneText === "Zona Saudável" || waistZoneText === "Zona Saudavel";
  const waistAdvisory = !waistRaw ? null
    : waistOk
      ? "O perímetro da cintura encontra-se dentro dos valores de referência saudáveis."
      : "ATENÇÃO: O Perímetro da Cintura elevado é considerado um fator de risco de doenças cardiometabólicas e respiratórias.";

  const now = new Date().toLocaleDateString("pt-PT");
  const W = 210, H = 297, M = 16;
  const NAVY    = [20,  48,  76];   // #14304C
  const NAVY2   = [26,  63, 99];    // #1a3f63
  const GOLD    = [194, 151, 13];   // #c2970d
  const GOLD_LT = [253, 244, 220];  // #fdf4dc
  const INK   = [26, 47, 55];
  const MUTED = [100, 120, 130];
  const GREEN = [22, 160, 80];
  const CORAL = [220, 80, 60];
  const WHITE = [255, 255, 255];

  // ── Helper: section header ───────────────────────────────────────────────
  const sectionHeader = (label, y) => {
    doc.setFillColor(...GOLD_LT);
    doc.rect(M, y - 5, W - 2 * M, 9, "F");
    doc.setFillColor(...GOLD);
    doc.rect(M, y - 5, 3, 9, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label.toUpperCase(), M + 6, y + 1.5);
    return y + 11;
  };

  // ── Helper: field pair ───────────────────────────────────────────────────
  const field = (label, value, x, y) => {
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label, x, y);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(value), x, y + 5.5);
  };

  // ── Helper: zone badge ───────────────────────────────────────────────────
  const zoneBadge = (zone, x, y) => {
    const ok = zone === "Zona Saudável" || zone === "Zona Saudavel" || zone.toLowerCase().includes("saud");
    const col = ok ? GREEN : CORAL;
    doc.setFillColor(...col);
    const label = ok ? "Zona Saudável" : "Zona de Melhoria";
    const tw = doc.getTextWidth(label) + 6;
    doc.roundedRect(x, y - 3.5, tw, 6, 1.5, 1.5, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(label, x + 3, y + 0.5);
    return x + tw + 4;
  };

  // ── Helper: check page overflow (add new page if needed) ────────────────
  const checkPage = (y, need = 20) => {
    if (y + need > H - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  };

  // ═══════════════════════════════════════════════════════════════════ HEADER
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, "F");

  // Gold accent stripe
  doc.setFillColor(...GOLD);
  doc.rect(0, 30, W, 4, "F");
  doc.setFillColor(...NAVY2);
  doc.rect(0, 34, W, 4, "F");

  // School logo (top-right)
  if (_logoImg && _logoImg.complete && _logoImg.naturalWidth > 0) {
    try {
      doc.addImage(_logoImg, "JPEG", W - M - 26, 2, 26, 26, undefined, "FAST");
    } catch (e) { /* skip if logo unavailable */ }
  }

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("HealthyTech Atlântico", M, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Colégio Atlântico  •  Educação Física  •  Avaliação Física", M, 22);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(`Relatório emitido a ${now}`, M, 34);
  doc.text(`Ano letivo: ${year}`, W - M, 34, { align: "right" });

  let y = 48;

  // ═══════════════════════════ DADOS DO ALUNO ═══════════════════════════════
  y = sectionHeader("Dados do Aluno", y);
  field("Nome", name, M, y);
  field("Sexo", sex, M + 70, y);
  field("Data de Nascimento", birthLabel, M + 115, y);
  y += 14;
  if (age) field("Idade", `${age} anos`, M, y);
  y += 14;

  // ════════════════════════ COMPOSIÇÃO CORPORAL ══════════════════════════════
  y = checkPage(y, 28);
  y = sectionHeader("Composição Corporal", y);

  field("IMC", `${imc} kg/m²`, M, y);
  if (imcZone !== "—") zoneBadge(imcZone, M + 38, y + 2);

  if (waistRaw) {
    field("Perímetro da Cintura", waistVal, M + 90, y);
    if (waistZoneText !== "—") zoneBadge(waistZoneText, M + 130, y + 2);
  }
  y += 16;

  // ════════════════════════ BATERIA DE TESTES ════════════════════════════════
  if (tests.length > 0) {
    y = checkPage(y, 30);
    y = sectionHeader("Bateria de Testes Físicos", y);

    // Table header row
    doc.setFillColor(...NAVY);
    doc.rect(M, y - 2, W - 2 * M, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Teste", M + 2, y + 3.5);
    doc.text("Resultado", M + 96, y + 3.5);
    doc.text("Unidade", M + 126, y + 3.5);
    doc.text("ZAF", M + 155, y + 3.5);
    y += 10;

    tests.forEach((t, i) => {
      y = checkPage(y, 12);
      if (i % 2 === 0) {
        doc.setFillColor(248, 252, 253);
        doc.rect(M, y - 3, W - 2 * M, 8, "F");
      }
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(t.label, M + 2, y + 2);
      doc.text(String(t.result), M + 96, y + 2);
      doc.text(String(t.unit), M + 126, y + 2);

      const zOk = t.zone === "Zona Saudável" || t.zone.includes("Saud");
      doc.setFillColor(...(zOk ? GREEN : CORAL));
      const zLabel = zOk ? "Saudável" : "Melhoria";
      doc.roundedRect(M + 152, y - 2, 30, 6, 1.5, 1.5, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(zLabel, M + 153.5, y + 2.5);
      y += 9;
    });
    y += 4;
  }

  // ══════════════════════ INFORMAÇÃO PARA EE ════════════════════════════════
  y = checkPage(y, 24);
  y = sectionHeader("Informação para o Encarregado de Educação", y);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const advLines = doc.splitTextToSize(imcAdvisory, W - 2 * M - 4);
  doc.text(advLines, M + 2, y + 1);
  y += advLines.length * 5.5 + 4;

  if (waistAdvisory) {
    y = checkPage(y, 16);
    const wLines = doc.splitTextToSize(waistAdvisory, W - 2 * M - 4);
    doc.text(wLines, M + 2, y + 1);
    y += wLines.length * 5.5 + 4;
  }

  // Disclaimer
  y = checkPage(y, 14);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  const disc = "As Zonas de Aptidão Física (ZAF) são calculadas de acordo com os critérios de avaliação da aptidão física para a idade e sexo do(a) aluno(a). Consulte o(a) professor(a) de Educação Física para mais informações.";
  const dLines = doc.splitTextToSize(disc, W - 2 * M);
  doc.text(dLines, M, y + 2);

  // ═══════════════════════════ FOOTER ══════════════════════════════════════
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, H - 14, W, 14, "F");
    doc.setFillColor(...GOLD);
    doc.rect(0, H - 14, W, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("HealthyTech Atlântico  •  Colégio Atlântico  •  Gerado automaticamente", M, H - 5);
    doc.text(`${now}  |  Pág. ${p}/${pages}`, W - M, H - 5, { align: "right" });
  }

  // Download
  const safeName = (name || "aluno").replace(/\s+/g, "_").toLowerCase();
  doc.save(`relatorio_${safeName}_${now.replace(/\//g, "-")}.pdf`);
};

const updateCharts = (historyRows = null) => {
  // Use API history if provided, otherwise fall back to manual state.years
  const hasHistory = historyRows && historyRows.length > 0;
  const labels = hasHistory
    ? historyRows.map((r) => new Date(r.recorded_at).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" }))
    : state.years.map((y) => y.year);
  const imcValues = hasHistory
    ? historyRows.map((r) => Number(r.imc))
    : state.years.map((y) => y.imc);
  const classImcValues = state.years.map((y) => y.classImc);

  if (studentChart) studentChart.destroy();
  if (classChart) classChart.destroy();

  const ctxStudent = document.getElementById("studentChart");
  const ctxClass = document.getElementById("classChart");

  studentChart = new Chart(ctxStudent, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "IMC do aluno",
          data: imcValues,
          borderColor: "#0f6c78",
          backgroundColor: "rgba(15, 108, 120, 0.15)",
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } },
    },
  });

  classChart = new Chart(ctxClass, {
    type: "bar",
    data: {
      labels: state.years.map((y) => y.year),
      datasets: [
        {
          label: "IMC médio da turma",
          data: state.years.map((y) => y.classImc),
          backgroundColor: "rgba(242, 108, 79, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
    },
  });
};

const loadBiometricsHistory = async () => {
  const studentId = state.currentStudentId;
  if (!studentId || !state.token) {
    updateCharts();
    return;
  }
  try {
    const rows = await apiFetch(`/students/${studentId}/biometrics`);
    if (Array.isArray(rows) && rows.length > 0) {
      // Show most-recent last for a chronological trend
      updateCharts([...rows].reverse());
      const statusEl = document.getElementById("chartHistoryStatus");
      if (statusEl) statusEl.textContent = `${rows.length} registos biométricos carregados.`;
    } else {
      updateCharts();
    }
  } catch (_) {
    updateCharts();
  }
};

const addYear = () => {
  const year = elements.chartYear.value.trim();
  const classImc = Number(elements.chartClassImc.value);
  const imc = Number(elements.imcValue.textContent);
  if (!year || Number.isNaN(classImc) || Number.isNaN(imc)) return;

  state.years.push({ year, imc, classImc });
  localStorage.setItem("af_years", JSON.stringify(state.years));
  updateCharts();
};

const QUESTIONNAIRE_DRAFT_KEY = "af_questionnaire_draft";
const initialQuestionFields = ["qActivity", "qSleep", "qSport"];
const routineQuestionFields = ["qStress", "qFood", "qMood", "qEnergy", "qScreen", "qHydration"];

const loadQuestionnaireDraft = () => {
  const draftRaw = sessionStorage.getItem(QUESTIONNAIRE_DRAFT_KEY);
  if (!draftRaw) return;
  try {
    const draft = JSON.parse(draftRaw);
    [...initialQuestionFields, ...routineQuestionFields].forEach((fieldId) => {
      const input = elements[fieldId];
      if (!input) return;
      if (typeof draft[fieldId] === "string" || typeof draft[fieldId] === "number") {
        input.value = String(draft[fieldId]);
      }
    });
  } catch (_) {}
};

const saveQuestionnaireDraft = () => {
  const draft = {};
  [...initialQuestionFields, ...routineQuestionFields].forEach((fieldId) => {
    draft[fieldId] = elements[fieldId]?.value || "";
  });
  sessionStorage.setItem(QUESTIONNAIRE_DRAFT_KEY, JSON.stringify(draft));
};

const countFilledFields = (fieldIds) => {
  return fieldIds.reduce((count, fieldId) => {
    const value = elements[fieldId]?.value;
    return count + (value !== undefined && String(value).trim() !== "" ? 1 : 0);
  }, 0);
};

const updateQuestionnaireProgress = () => {
  const totalFields = initialQuestionFields.length + routineQuestionFields.length;
  if (!totalFields) return;
  const completed = countFilledFields(initialQuestionFields) + countFilledFields(routineQuestionFields);
  const percent = Math.round((completed / totalFields) * 100);

  if (elements.questProgressBar) {
    elements.questProgressBar.style.width = `${percent}%`;
  }
  if (elements.questProgressLabel) {
    elements.questProgressLabel.textContent = `${percent}% conclu\u00eddo (${completed}/${totalFields})`;
  }
};

const validateQuestionnaireStep = (fieldIds, statusElement, missingText) => {
  const missing = fieldIds.filter((id) => {
    const value = elements[id]?.value;
    return value === undefined || String(value).trim() === "";
  });
  if (missing.length > 0) {
    if (statusElement) statusElement.textContent = missingText;
    return false;
  }
  if (statusElement) statusElement.textContent = "";
  return true;
};

const submitInitial = () => {
  const valid = validateQuestionnaireStep(
    initialQuestionFields,
    elements.questInitialStatus,
    "Preenche os 3 campos do questionário inicial."
  );
  if (!valid) return;
  sessionStorage.setItem("af_initial", "done"); // session-only flag
  elements.deferStatus.textContent = `Questionário inicial completo. ${state.defers} adiamentos usados.`;
  if (elements.questInitialStatus) {
    elements.questInitialStatus.textContent = "Questionário inicial submetido com sucesso.";
  }
  saveQuestionnaireDraft();
  updateQuestionnaireProgress();
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/questionnaires`, {
      method: "POST",
      body: JSON.stringify({
        type: "initial",
        payload: {
          activity: elements.qActivity.value,
          sleep: elements.qSleep.value,
          sport: elements.qSport.value,
        },
        deferredCount: state.defers,
      }),
    }).catch((err) => updateAccessStatus(err.message));
  }
};

const deferInitial = () => {
  if (state.defers >= 3) {
    elements.deferStatus.textContent = "Limite de adiamentos atingido.";
    return;
  }
  state.defers += 1;
  sessionStorage.setItem("af_defers", state.defers.toString());
  elements.deferStatus.textContent = `${state.defers} adiamentos usados.`;
};

const submitRoutine = () => {
  const valid = validateQuestionnaireStep(
    routineQuestionFields,
    elements.questRoutineStatus,
    "Completa o questionário de rotina antes de submeter."
  );
  if (!valid) return;
  sessionStorage.setItem("af_routine", new Date().toISOString());
  if (elements.questRoutineStatus) {
    elements.questRoutineStatus.textContent = "Questionário de rotina submetido com sucesso.";
  }
  saveQuestionnaireDraft();
  updateQuestionnaireProgress();
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/questionnaires`, {
      method: "POST",
      body: JSON.stringify({
        type: "routine",
        payload: {
          stress: elements.qStress.value,
          food: elements.qFood.value,
          mood: elements.qMood.value,
          energy: elements.qEnergy.value,
          screen: elements.qScreen.value,
          hydration: elements.qHydration.value,
        },
        deferredCount: state.defers,
      }),
    }).catch((err) => updateAccessStatus(err.message));
  }
};

const triggerSos = () => {
  const psych = elements.sosPsych.value.trim();
  const teacher = elements.sosTeacher.value.trim();
  const psychEmail = elements.sosPsychEmail?.value.trim() || "";
  const teacherEmail = elements.sosTeacherEmail?.value.trim() || "";
  if (!psych || !teacher) {
    toast(i18n("sos_fill"), "error");
    return;
  }

  // Show confirmation modal before sending — prevent accidental trigger
  const modal = document.getElementById("sosConfirmModal");
  const recipientsEl = document.getElementById("sosConfirmRecipients");
  if (recipientsEl) {
    recipientsEl.innerHTML = `<strong>Psicólogo:</strong> ${psych}${psychEmail ? ` (${psychEmail})` : ""}<br><strong>Professor:</strong> ${teacher}${teacherEmail ? ` (${teacherEmail})` : ""}`;
  }
  if (modal) modal.classList.remove("hidden");

  const confirmBtn = document.getElementById("sosConfirmYes");
  const cancelBtn = document.getElementById("sosConfirmNo");

  const closeModal = () => {
    if (modal) modal.classList.add("hidden");
    confirmBtn?.removeEventListener("click", onConfirm);
    cancelBtn?.removeEventListener("click", closeModal);
  };

  const onConfirm = () => {
    closeModal();
    _doTriggerSos({ psych, teacher, psychEmail, teacherEmail });
  };

  confirmBtn?.addEventListener("click", onConfirm, { once: true });
  cancelBtn?.addEventListener("click", closeModal, { once: true });
};

const _doTriggerSos = ({ psych, teacher, psychEmail, teacherEmail }) => {
  if (elements.sosResult) {
    elements.sosResult.innerHTML = `<span class="zone-badge zone-badge--ok">✓ SOS ativado</span> Psicólogo: <strong>${psych}</strong>, Professor: <strong>${teacher}</strong>.`;
  }
  toast(i18n("sos_sent"), "success");
  refreshTopbarStats();
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/sos`, {
      method: "POST",
      body: JSON.stringify({ psych, teacher, psychEmail, teacherEmail }),
    })
      .then((data) => {
        if (data.emailsSent?.length > 0) {
          toast(`📧 Email enviado: ${data.emailsSent.join(", ")}`, "success");
        }
      })
      .catch((err) => toast(err.message, "error"));
  }
};

const populateDispensaStudents = async () => {
  const select = elements.dispensaRecipient;
  if (!select || select.tagName !== "SELECT") return;
  if (!state.token) return;
  try {
    const result = await apiFetch("/students?limit=200");
    const students = result?.data ?? (Array.isArray(result) ? result : []);
    select.innerHTML = students.length
      ? students.map((s) => `<option value="${s.id}">${s.name}${s.school_year ? " — " + s.school_year : ""}</option>`).join("")
      : `<option value="">Sem alunos registados</option>`;
    // Reinit/sync custom select UI after options change
    initCustomSelect(select);
  } catch (_) {}
};

const registerDispensa = async () => {
  const recipientId = Number(elements.dispensaRecipient.value);
  const reason = elements.dispensaReason.value.trim();
  const startDate = elements.dispensaStartDate.value;
  const endDate = elements.dispensaEndDate.value;
  const hasMedical = elements.dispensaMedical.checked;

  if (!recipientId || !reason || !startDate || !endDate) {
    elements.dispensaStatus.textContent = "Erro: Preencha todos os campos.";
    return;
  }
  if (!state.token) {
    elements.dispensaStatus.textContent = "Erro: N�o autenticado.";
    return;
  }
  try {
    elements.dispensaStatus.textContent = "A registar...";
    const data = await apiFetch(`/students/${recipientId}/dispensas`, {
      method: "POST",
      body: JSON.stringify({ reason, startDate, endDate, hasMedicalCertificate: hasMedical }),
    });
    elements.dispensaStatus.textContent = `Dispensa registada (ID: ${data.id}) para aluno ${recipientId}.`;
    elements.dispensaReason.value = "";
    elements.dispensaStartDate.value = "";
    elements.dispensaEndDate.value = "";
    elements.dispensaMedical.checked = false;
    state.dispensas.push(data);
  } catch (error) {
    elements.dispensaStatus.textContent = `Erro: ${error.message}`;
  }
};

// --- Turma (class) view ---------------------------------------------------
let turmaChart = null;
let _turmaStudents = []; // stored for CSV export
let _logoImg = null; // preloaded school logo for PDF

const preloadLogo = () => {
  _logoImg = new Image();
  _logoImg.crossOrigin = "anonymous";
  _logoImg.src = "/assets/logos/Logo1.jpg";
};

/* ── R11: Turma KPI metrics ──────────────────────────────────────────────── */
const renderTurmaMetrics = (students) => {
  const el = document.getElementById("turmaMetrics");
  if (!el) return;
  if (!students.length) { el.classList.add("hidden"); return; }

  const total = students.length;
  const withImc = students.filter((s) => s.imc_zone);
  const saudavel = withImc.filter((s) => s.imc_zone === "Zona Saudável" || s.imc_zone === "Zona Saudavel").length;
  const pctSaud = withImc.length ? Math.round((saudavel / withImc.length) * 100) : null;
  const imcValues = students.filter((s) => s.imc).map((s) => Number(s.imc));
  const avgImc = imcValues.length
    ? (imcValues.reduce((a, b) => a + b, 0) / imcValues.length).toFixed(1)
    : null;
  const withTests = students.filter((s) => Number(s.num_tests) > 0).length;
  const pctTests = Math.round((withTests / total) * 100);

  const saudClass = pctSaud !== null ? (pctSaud >= 60 ? "kpi-card--green" : "kpi-card--coral") : "";

  el.innerHTML = `
    <div class="turma-kpi-grid">
      <div class="kpi-card">
        <span class="kpi-card__value">${total}</span>
        <span class="kpi-card__label">Alunos</span>
      </div>
      <div class="kpi-card ${saudClass}">
        <span class="kpi-card__value">${pctSaud !== null ? pctSaud + "%" : "—"}</span>
        <span class="kpi-card__label">Zona Saudável IMC</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card__value">${avgImc ?? "—"}</span>
        <span class="kpi-card__label">IMC médio</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card__value">${pctTests}%</span>
        <span class="kpi-card__label">Com testes</span>
      </div>
    </div>`;
  el.classList.remove("hidden");
};

/* ── R14: CSV export ─────────────────────────────────────────────────────── */
const exportTurmaCSV = () => {
  if (!_turmaStudents.length) { toast("Carrega a turma primeiro.", "error"); return; }
  const header = ["Nome", "Sexo", "Idade", "Ano Letivo", "IMC", "ZAF IMC", "Cintura (cm)", "ZAF Cintura", "N.º Testes"];
  const rows = _turmaStudents.map((s) => [
    `"${(s.name || "").replace(/"/g, '""')}"`,
    s.sex === "F" ? "Feminino" : "Masculino",
    s.age ?? "",
    s.school_year ?? "",
    s.imc ?? "",
    s.imc_zone ?? "",
    s.waist_cm ?? "",
    s.waist_zone ?? "",
    s.num_tests ?? 0,
  ]);
  const csv = [header.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (elements.turmaYear?.value || "turma").replace(/[/\\?%*:|"<>]/g, "-");
  const today = new Date().toLocaleDateString("pt-PT").replace(/\//g, "-");
  a.download = `turma_${safeName}_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("CSV exportado.", "success");
};

/* ── R13: School dashboard ───────────────────────────────────────────────── */
const loadDashboard = async () => {
  const status = document.getElementById("dashboardStatus");
  const grid = document.getElementById("dashboardGrid");
  if (!grid) return;
  if (!state.token) { if (status) status.textContent = "Sem sessão ativa."; return; }

  if (status) status.textContent = "A carregar anos letivos…";
  grid.innerHTML = "";

  try {
    const years = await apiFetch("/classes");
    if (!Array.isArray(years) || !years.length) {
      if (status) status.textContent = "Nenhum dado disponível.";
      return;
    }

    if (status) status.textContent = `A carregar ${years.length} ano(s) letivo(s)…`;

    const results = await Promise.all(
      years.map((year) =>
        apiFetch(`/classes/report?year=${encodeURIComponent(year)}`)
          .then((students) => ({ year, students: Array.isArray(students) ? students : [] }))
          .catch(() => ({ year, students: [] }))
      )
    );

    if (status) status.textContent = "";

    grid.innerHTML = results.map(({ year, students }) => {
      const total = students.length;
      const withImc = students.filter((s) => s.imc_zone);
      const saudavel = withImc.filter((s) => s.imc_zone === "Zona Saudável" || s.imc_zone === "Zona Saudavel").length;
      const pctSaud = withImc.length ? Math.round((saudavel / withImc.length) * 100) : null;
      const imcVals = students.filter((s) => s.imc).map((s) => Number(s.imc));
      const avgImc = imcVals.length
        ? (imcVals.reduce((a, b) => a + b, 0) / imcVals.length).toFixed(1)
        : "—";
      const withTests = students.filter((s) => Number(s.num_tests) > 0).length;
      const badgeClass = pctSaud !== null ? (pctSaud >= 60 ? "zone-badge--ok" : "zone-badge--needs") : "zone-badge--na";
      const badgeLabel = pctSaud !== null ? `${pctSaud}% saudável` : "Sem biometrias";

      return `<div class="dashboard-year-card card">
        <div class="dashboard-year-card__header">
          <span class="dashboard-year-card__year">${year}</span>
          <span class="zone-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="dashboard-year-card__stats">
          <div class="kpi-card kpi-card--sm">
            <span class="kpi-card__value">${total}</span>
            <span class="kpi-card__label">Alunos</span>
          </div>
          <div class="kpi-card kpi-card--sm">
            <span class="kpi-card__value">${avgImc}</span>
            <span class="kpi-card__label">IMC médio</span>
          </div>
          <div class="kpi-card kpi-card--sm">
            <span class="kpi-card__value">${withTests}</span>
            <span class="kpi-card__label">Com testes</span>
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" onclick="loadTurmaFromDashboard('${year.replace(/'/g, "\\'")}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:4px">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>Ver turma
        </button>
      </div>`;
    }).join("");
  } catch (err) {
    if (status) status.textContent = "Erro: " + err.message;
  }
};

// Exposed globally for inline onclick in dashboard cards
window.loadTurmaFromDashboard = (year) => {
  showTab("turma");
  const sel = elements.turmaYear;
  if (sel) {
    sel.value = year;
    // sync custom select trigger text
    sel.nextElementSibling?._rebuildCustomSelect?.();
  }
  loadTurmaView();
};

/* ── R8: Student quick-select picker ─────────────────────────────────────── */
let _pickerStudents = [];

const initStudentPicker = () => {
  const card = document.getElementById("studentPickerCard");
  if (!card) return;
  const role = state.user?.role;
  // Only professors and psicólogos have the picker
  if (role !== "professor" && role !== "psicologo") {
    card.classList.add("hidden");
    return;
  }
  card.classList.remove("hidden");

  const toggleBtn = document.getElementById("toggleStudentPicker");
  const searchInput = document.getElementById("studentPickerSearch");
  toggleBtn?.addEventListener("click", () => {
    const body = document.getElementById("studentPickerBody");
    const isOpen = !body.classList.contains("hidden");
    body.classList.toggle("hidden", isOpen);
    card.classList.toggle("student-picker-card--open", !isOpen);
    if (!isOpen) {
      // Opened — load if not yet loaded
      if (!_pickerStudents.length) loadStudentPicker();
      else filterStudentPicker();
      searchInput?.focus();
    }
  });

  searchInput?.addEventListener("input", filterStudentPicker);
  loadStudentPicker();
};

const loadStudentPicker = async () => {
  try {
    const res = await apiFetch("/students?limit=500");
    _pickerStudents = res?.data ?? (Array.isArray(res) ? res : []);
    filterStudentPicker();
  } catch (_) {}
};

const filterStudentPicker = () => {
  const q = (document.getElementById("studentPickerSearch")?.value || "").toLowerCase().trim();
  const listEl = document.getElementById("studentPickerList");
  if (!listEl) return;

  const filtered = q
    ? _pickerStudents.filter((s) => (s.name || "").toLowerCase().includes(q))
    : _pickerStudents;

  if (!filtered.length) {
    listEl.innerHTML = `<p class="helper" style="padding:8px 0">${q ? "Nenhum resultado para \"" + q + "\"." : "Nenhum aluno registado."}</p>`;
    return;
  }

  listEl.innerHTML = filtered.slice(0, 25).map((s) =>
    `<button type="button" class="student-picker__item" data-id="${s.id}">
      <span class="student-picker__item-name">${s.name}</span>
      <span class="student-picker__item-meta">${s.sex === "F" ? "Feminino" : "Masculino"} · ${s.school_year || "—"}</span>
    </button>`
  ).join("");

  listEl.querySelectorAll(".student-picker__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const student = _pickerStudents.find((s) => String(s.id) === btn.dataset.id);
      if (student) loadStudentIntoForm(student);
    });
  });
};

const loadStudentIntoForm = (student) => {
  if (elements.studentName) elements.studentName.value = student.name || "";

  // Sync sex: set underlying select value + sync pill buttons
  const sexSel = document.getElementById("studentSex");
  if (sexSel) {
    sexSel.value = student.sex || "";
    sexSel._syncPills?.();
  }

  // Birth date
  if (elements.studentBirthDate) {
    elements.studentBirthDate.value = student.birth_date
      ? student.birth_date.split("T")[0]
      : "";
  }

  // School year select + sync custom select UI
  const yearSel = document.getElementById("schoolYear");
  if (yearSel) {
    yearSel.value = student.school_year || "";
    yearSel.nextElementSibling?._rebuildCustomSelect?.();
  }

  // Update state
  state.currentStudentId = student.id;
  sessionStorage.setItem("af_student_id", String(student.id));

  // Close picker
  const body = document.getElementById("studentPickerBody");
  if (body) body.classList.add("hidden");
  const card = document.getElementById("studentPickerCard");
  if (card) card.classList.remove("student-picker-card--open");

  updateAccessStatus(`Aluno carregado: ${student.name}`);

  // Refresh IMC if biometrics are cached (reset to let user re-calculate)
  const imcResult = document.getElementById("imcResult");
  if (imcResult) imcResult.classList.add("hidden");
};



const loadTurmaView = async () => {
  // native select value is always kept in sync by the custom-select component
  const year = (elements.turmaYear?.value || "").trim();
  if (!year) {
    if (elements.turmaStatus) elements.turmaStatus.textContent = "Seleciona um ano letivo primeiro.";
    toast("Seleciona um ano letivo.", "error");
    return;
  }
  if (!state.token) {
    if (elements.turmaStatus) elements.turmaStatus.textContent = "Sem sessao ativa.";
    return;
  }
  try {
    if (elements.turmaStatus) elements.turmaStatus.textContent = "A carregar...";
    const students = await apiFetch("/classes/report?year=" + encodeURIComponent(year));
    _turmaStudents = Array.isArray(students) ? students : [];
    renderTurmaTable(_turmaStudents);
    renderTurmaMetrics(_turmaStudents);
    renderTurmaChart(_turmaStudents);
    if (elements.turmaStatus) elements.turmaStatus.textContent = _turmaStudents.length + " aluno(s) encontrado(s).";
    const exportRow = document.getElementById("turmaExportRow");
    if (exportRow) exportRow.style.display = _turmaStudents.length ? "flex" : "none";
    if (_turmaStudents.length > 0) toast("Turma carregada: " + _turmaStudents.length + " aluno(s).", "success");
  } catch (err) {
    if (elements.turmaStatus) elements.turmaStatus.textContent = "Erro: " + err.message;
    toast("Erro ao carregar turma: " + err.message, "error");
  }
};
const renderTurmaTable = (students) => {
  if (!elements.turmaTable) return;
  if (students.length === 0) {
    elements.turmaTable.innerHTML = "<p class='helper'>Nenhum aluno encontrado para este ano/turma.</p>";
    return;
  }
  let html = `<div class="table"><div class="table__row table__header turma-header"><span>Nome</span><span>Sexo</span><span>Idade</span><span>IMC</span><span>ZAF IMC</span><span>Cintura ZAF</span><span>Testes</span></div>`;
  students.forEach((s) => {
    const imcOk = s.imc_zone === "Zona Saudavel" || s.imc_zone === "Zona Saud�vel";
    const waistOk = s.waist_zone === "Zona Saudavel" || s.waist_zone === "Zona Saud�vel";
    html += `<div class="table__row turma-row">
      <span>${s.name}</span>
      <span>${s.sex === "F" ? "Feminino" : "Masculino"}</span>
      <span>${s.age}</span>
      <span>${s.imc ?? "-"}</span>
      <span class="zone-badge ${imcOk ? "zone-badge--ok" : s.imc_zone ? "zone-badge--needs" : "zone-badge--na"}">${s.imc_zone ?? "-"}</span>
      <span class="zone-badge ${waistOk ? "zone-badge--ok" : s.waist_zone ? "zone-badge--needs" : "zone-badge--na"}">${s.waist_zone ?? "-"}</span>
      <span>${s.num_tests ?? 0}</span>
    </div>`;
  });
  html += "</div>";
  elements.turmaTable.innerHTML = html;
};

const renderTurmaChart = (students) => {
  const canvas = document.getElementById("turmaChart");
  if (!canvas) return;
  const saudavel = students.filter((s) => s.imc_zone === "Zona Saudavel" || s.imc_zone === "Zona Saud�vel").length;
  const melhoria = students.filter((s) => s.imc_zone && s.imc_zone !== "Zona Saudavel" && s.imc_zone !== "Zona Saud�vel").length;
  const semDados = students.length - saudavel - melhoria;
  if (turmaChart) turmaChart.destroy();
  turmaChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Zona Saud�vel", "Zona de Melhoria", "Sem dados"],
      datasets: [{ data: [saudavel, melhoria, semDados], backgroundColor: ["rgba(15,160,80,0.75)", "rgba(242,108,79,0.75)", "rgba(74,95,104,0.3)"] }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" }, title: { display: true, text: "Distribuição ZAF IMC — Turma" } },
    },
  });
};

// --- Navigation --------------------------------------------------------------
const NAV_TABS = {
  aluno:     ["bio", "tests", "quest", "sos", "reports", "protocols"],
  professor: ["bio", "tests", "turma", "dispensas", "reports", "charts", "dashboard", "protocols"],
  psicologo: ["sos", "reports", "protocols"],
  pais:      ["reports", "protocols"],
};

const TAB_META = {
  bio:       { label: "Biometria",    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>` },
  tests:     { label: "Testes",       icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
  quest:     { label: "Questionários", icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>` },
  sos:       { label: "SOS",          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`, cls: "bottomnav__item--sos" },
  reports:   { label: "Relatório",    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>` },
  charts:    { label: "Análise",      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  dashboard: { label: "Dashboard",    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>` },
  turma:     { label: "Turma",        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>` },
  dispensas: { label: "Dispensas",    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>` },
  protocols: { label: "Protocolos",   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>` },
  perfil:    { label: "Perfil",        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>` },
};

const updateNavIndicator = (tabId) => {
  const indicator = document.getElementById("navIndicator");
  if (!indicator) return;
  const activeBtn = elements.bottomnav?.querySelector(`[data-tab="${tabId}"]`);
  if (!activeBtn) return;
  const btnRect = activeBtn.getBoundingClientRect();
  const navRect = elements.bottomnav.getBoundingClientRect();
  indicator.style.left = (btnRect.left - navRect.left) + "px";
  indicator.style.width = btnRect.width + "px";
  // SOS tab uses coral color
  indicator.style.background = activeBtn.classList.contains("bottomnav__item--sos") ? "var(--coral)" : "var(--sea)";
};

const showTab = (tabId) => {
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  const panel = document.getElementById("tab-" + tabId);
  if (panel) {
    panel.classList.remove("hidden");
    // restart tab-in animation on every switch
    panel.style.animation = "none";
    void panel.offsetHeight; // reflow
    panel.style.animation = "";
  }
  document.querySelectorAll(".bottomnav__item").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabId);
  });
  // Animate sliding indicator (mobile)
  requestAnimationFrame(() => updateNavIndicator(tabId));
  if (tabId === "charts") loadBiometricsHistory();
  if (tabId === "dispensas") populateDispensaStudents();
  if (tabId === "perfil") populateProfileTab();
  if (tabId === "dashboard") loadDashboard();
  if (tabId === "sos") {
    const role = state.user?.role;
    const isStaff = role === "professor" || role === "psicologo";
    document.getElementById("sosTriggerSection")?.classList.toggle("hidden", isStaff);
    document.getElementById("sosStaffSection")?.classList.toggle("hidden", !isStaff);
    if (isStaff) loadSosAlerts();
  }
};

const loadSosAlerts = async () => {
  const container = document.getElementById("sosAlertsList");
  if (!container) return;
  container.innerHTML = '<div class="card"><p class="helper">A carregar alertas...</p></div>';
  try {
    // Single query — no N+1
    const allAlerts = await apiFetch("/stats/sos-alerts");
    if (!Array.isArray(allAlerts) || allAlerts.length === 0) {
      container.innerHTML = '<div class="card"><p class="helper">Nenhum alerta recebido.</p></div>';
      return;
    }
    container.innerHTML = allAlerts.map((a) => `
      <div class="card sos-alert-card${a.resolved ? " sos-alert-card--resolved" : ""}" data-alert-id="${a.id}">
        <div class="sos-alert-card__header">
          <span class="zone-badge ${a.resolved ? "zone-badge--ok" : "zone-badge--alert"}">${a.resolved ? "Resolvido" : "Ativo"}</span>
          <span class="sos-alert-card__date">${new Date(a.created_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</span>
        </div>
        <div class="sos-alert-card__body">
          ${a.student_name ? `<p><strong>Aluno:</strong> ${a.student_name}${a.class_name ? " — " + a.class_name : ""}</p>` : ""}
          <p><strong>Psicólogo:</strong> ${a.psych || "—"}</p>
          <p><strong>Professor:</strong> ${a.teacher || "—"}</p>
        </div>
        ${!a.resolved ? `<button class="btn btn--ghost btn--sm sos-resolve-btn" data-id="${a.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Marcar como resolvido</button>` : ""}
      </div>
    `).join("");
    container.querySelectorAll(".sos-resolve-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        btn.disabled = true;
        try {
          await apiFetch(`/students/sos/${id}`, { method: "PATCH" });
          toast("Alerta marcado como resolvido.", "success");
          loadSosAlerts();
          refreshTopbarStats();
        } catch (err) {
          toast(err.message, "error");
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="card"><p class="helper">${err.message}</p></div>`;
  }
};

const buildBottomNav = (role) => {
  if (!elements.bottomnav) return;
  const tabs = NAV_TABS[role] || NAV_TABS.aluno;
  // Keep the indicator element
  const indicatorEl = elements.bottomnav.querySelector(".bottomnav__indicator") || (() => {
    const d = document.createElement("div"); d.className = "bottomnav__indicator"; d.id = "navIndicator"; return d;
  })();
  const footerEl = elements.bottomnav.querySelector(".app-footer");
  elements.bottomnav.innerHTML = tabs.map((id) => {
    const m = TAB_META[id];
    return `<button class="bottomnav__item ${m.cls || ""}" data-tab="${id}" aria-label="${m.label}">${m.icon}<span>${m.label}</span></button>`;
  }).join("");
  elements.bottomnav.insertBefore(indicatorEl, elements.bottomnav.firstChild);
  if (footerEl) elements.bottomnav.appendChild(footerEl);
  elements.bottomnav.querySelectorAll(".bottomnav__item").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
};

const hideLoading = () => {
  if (elements.loadingScreen) elements.loadingScreen.classList.add("hidden");
};

const showLoading = () => {
  if (elements.loadingScreen) elements.loadingScreen.classList.remove("hidden");
};

const showLogin = () => {
  hideLoading();
  if (elements.loginScreen) elements.loginScreen.classList.remove("hidden");
  if (elements.appShell) elements.appShell.classList.add("hidden");
  setTopbarVisibility({ students: false, alerts: false });
  setTopbarStats({ students: 0, alerts: 0 });
};

const showApp = (user) => {
  hideLoading();
  if (elements.loginScreen) elements.loginScreen.classList.add("hidden");
  if (elements.appShell) elements.appShell.classList.remove("hidden");
  const initials = (user?.email || "?").charAt(0).toUpperCase();
  if (elements.topbarInitials) elements.topbarInitials.textContent = initials;
  if (elements.topbarEmail) elements.topbarEmail.textContent = user?.email || "";
  buildBottomNav(user?.role || "aluno");
  const firstTab = (NAV_TABS[user?.role || "aluno"] || NAV_TABS.aluno)[0];
  showTab(firstTab);
  updateStats();
  initStudentPicker();
  preloadLogo();
  hydrateSessionUser().finally(() => {
    const role = state.user?.role || user?.role || "aluno";
    buildBottomNav(role);
    refreshTopbarStats();
  });
};

const applyRoleVisibility = () => {}; // replaced by tab navigation

/* ═══════════════════════════════════════════════════
   PICKERS — pill-select, range slider
═══════════════════════════════════════════════════ */

/**
 * Replaces a <select> with pill buttons while keeping the original
 * hidden select in sync (so all existing .value reads still work).
 */
const initPillSelect = (selectId, { compact = false } = {}) => {
  const sel = document.getElementById(selectId);
  if (!sel || sel.dataset.pillDone) return;
  sel.dataset.pillDone = "1";

  const opts = Array.from(sel.options).filter((o) => o.value !== "");
  const isToggle = opts.length === 2;

  const wrap = document.createElement("div");
  wrap.className =
    "pill-select" +
    (isToggle ? " pill-select--toggle" : "") +
    (compact ? " pill-select--compact" : "");
  wrap.dataset.forSelect = selectId;

  const syncActive = () => {
    wrap.querySelectorAll(".pill-select__btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.value === sel.value);
    });
  };

  opts.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill-select__btn";
    btn.dataset.value = opt.value;
    btn.textContent = opt.text;
    if (sel.value === opt.value) btn.classList.add("active");

    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".pill-select__btn").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      sel.value = opt.value;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      sel.dispatchEvent(new Event("input", { bubbles: true }));
    });

    wrap.appendChild(btn);
  });

  // Observe external value changes (e.g., loadQuestionnaireDraft)
  // Use a small polling-free approach: expose syncActive on element
  sel._syncPills = syncActive;

  sel.style.display = "none";
  sel.after(wrap);
};

/**
 * Replaces a number input with a styled range slider + numeric badge,
 * keeping the original input in sync.
 */
const initRangeSlider = (inputId, { min = 0, max = 10 } = {}) => {
  const inp = document.getElementById(inputId);
  if (!inp || inp.dataset.rangeDone) return;
  inp.dataset.rangeDone = "1";

  const initialVal = inp.value !== "" ? Number(inp.value) : min;

  const track = document.createElement("div");
  track.className = "range-field__track";

  const range = document.createElement("input");
  range.type = "range";
  range.min = String(min);
  range.max = String(max);
  range.step = "1";
  range.value = String(initialVal);
  range.className = "range-slider";

  const badge = document.createElement("span");
  badge.className = "range-field__value";
  badge.textContent = String(initialVal);

  const updateColor = (v) => {
    const pct = ((v - min) / (max - min)) * 100;
    // heat-map: low=sea, mid=sun, high=coral
    let color;
    if (pct <= 40) color = "var(--sea)";
    else if (pct <= 70) color = "var(--sun)";
    else color = "var(--coral)";
    badge.style.background = `rgba(${pct <= 40 ? "14,104,117" : pct <= 70 ? "240,168,32" : "232,88,58"},0.12)`;
    badge.style.color = color;
    range.style.setProperty("--pct", `${pct}%`);
    range.style.setProperty("--thumb-color", color);
  };

  updateColor(initialVal);

  range.addEventListener("input", () => {
    const v = Number(range.value);
    badge.textContent = String(v);
    inp.value = String(v);
    updateColor(v);
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
  });

  inp.addEventListener("change", () => {
    range.value = inp.value;
    badge.textContent = inp.value;
    updateColor(Number(inp.value));
  });

  track.appendChild(range);
  track.appendChild(badge);

  // labels below
  const labels = document.createElement("div");
  labels.className = "range-labels";
  labels.innerHTML = `<span>${min} — sem stress</span><span>stress máximo — ${max}</span>`;

  const container = document.createElement("div");
  container.className = "range-field";
  container.appendChild(track);
  container.appendChild(labels);

  inp.style.display = "none";
  inp.after(container);
};

/**
 * Sync pill selects after a draft is loaded externally.
 */
const syncAllPillSelects = () => {
  document.querySelectorAll("[data-pill-done]").forEach((sel) => {
    if (typeof sel._syncPills === "function") sel._syncPills();
  });
};

/* ═══════════════════════════════════════════════════
   NUMERIC STEPPER — ± UI replacing a number input
═══════════════════════════════════════════════════ */
const initNumericStepper = (inputId, { min, max, step = 1 } = {}) => {
  const inp = document.getElementById(inputId);
  if (!inp || inp.dataset.stepperDone) return;
  inp.dataset.stepperDone = "1";
  const decimals = (step.toString().split(".")[1] || "").length;

  const wrap = document.createElement("div");
  wrap.className = "num-stepper";

  const minusBtn = document.createElement("button");
  minusBtn.type = "button";
  minusBtn.className = "num-stepper__btn";
  minusBtn.setAttribute("aria-label", "Diminuir");
  minusBtn.textContent = "−";

  const divL = document.createElement("span");
  divL.className = "num-stepper__divider";

  const display = document.createElement("span");
  display.className = "num-stepper__val";

  const divR = document.createElement("span");
  divR.className = "num-stepper__divider";

  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = "num-stepper__btn";
  plusBtn.setAttribute("aria-label", "Aumentar");
  plusBtn.textContent = "+";

  wrap.append(minusBtn, divL, display, divR, plusBtn);

  const update = (raw) => {
    if (isNaN(raw)) raw = min;
    let v = Math.round(raw / step) * step;
    v = Math.min(max, Math.max(min, parseFloat(v.toFixed(decimals))));
    inp.value = v;
    display.textContent = v;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
    minusBtn.disabled = v <= min;
    plusBtn.disabled = v >= max;
  };

  minusBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const cur = parseFloat(inp.value);
    update(isNaN(cur) ? max : cur - step);
  });
  plusBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const cur = parseFloat(inp.value);
    update(isNaN(cur) ? min : cur + step);
  });

  if (inp.value !== "") {
    update(parseFloat(inp.value));
  } else {
    display.textContent = "—";
    minusBtn.disabled = true;
  }

  inp._syncStepper = () => {
    if (inp.value !== "") update(parseFloat(inp.value));
    else { display.textContent = "—"; minusBtn.disabled = true; }
  };

  inp.style.display = "none";
  inp.after(wrap);
};

/* ═══════════════════════════════════════════════════
   INPUT UNIT — appends unit badge inside the input
═══════════════════════════════════════════════════ */
const initInputUnit = (inputId, unit) => {
  const inp = document.getElementById(inputId);
  if (!inp || inp.dataset.unitDone) return;
  inp.dataset.unitDone = "1";
  const wrap = document.createElement("div");
  wrap.className = "input-unit-wrap";
  inp.replaceWith(wrap);
  wrap.appendChild(inp);
  const badge = document.createElement("span");
  badge.className = "input-unit";
  badge.textContent = unit;
  wrap.appendChild(badge);
};

/* ═══════════════════════════════════════════════════
   CUSTOM SELECT COMPONENT
═══════════════════════════════════════════════════ */
const initCustomSelect = (selectEl) => {
  if (!selectEl) return;

  // Already initialized — just rebuild options list and sync display
  if (selectEl.dataset.csInit === "1") {
    const wrapper = selectEl.nextElementSibling;
    if (wrapper?._rebuildCustomSelect) wrapper._rebuildCustomSelect();
    return;
  }

  selectEl.dataset.csInit = "1";
  selectEl.style.display = "none";

  const wrapper = document.createElement("div");
  wrapper.className = "custom-select";
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("role", "combobox");
  wrapper.setAttribute("aria-haspopup", "listbox");
  selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);

  // Trigger row
  const trigger = document.createElement("div");
  trigger.className = "custom-select__trigger";

  const triggerText = document.createElement("span");
  triggerText.className = "custom-select__trigger-text placeholder";

  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrow.setAttribute("class", "custom-select__arrow");
  arrow.setAttribute("viewBox", "0 0 24 24");
  arrow.setAttribute("width", "16");
  arrow.setAttribute("height", "16");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", "6 9 12 15 18 9");
  arrow.appendChild(poly);

  trigger.append(triggerText, arrow);
  wrapper.appendChild(trigger);

  // Dropdown list
  const list = document.createElement("div");
  list.className = "custom-select__list hidden";
  list.setAttribute("role", "listbox");
  wrapper.appendChild(list);

  const syncUI = () => {
    const opt = selectEl.options[selectEl.selectedIndex];
    if (opt && opt.value) {
      triggerText.textContent = opt.textContent;
      triggerText.classList.remove("placeholder");
    } else {
      triggerText.textContent = opt ? opt.textContent : "Selecionar";
      triggerText.classList.add("placeholder");
    }
    list.querySelectorAll(".custom-select__option").forEach((item) => {
      item.classList.toggle("selected", item.dataset.value === selectEl.value);
    });
  };

  const buildList = () => {
    list.innerHTML = "";
    Array.from(selectEl.options).forEach((opt) => {
      const item = document.createElement("div");
      item.className = "custom-select__option" + (!opt.value ? " disabled" : "");
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;
      item.setAttribute("role", "option");
      item.addEventListener("click", () => {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        syncUI();
        list.classList.add("hidden");
        wrapper.classList.remove("open");
      });
      list.appendChild(item);
    });
    syncUI();
  };

  const openList = () => {
    list.classList.remove("hidden");
    wrapper.classList.add("open");
    document.querySelectorAll(".custom-select.open").forEach((other) => {
      if (other !== wrapper) {
        other.querySelector(".custom-select__list")?.classList.add("hidden");
        other.classList.remove("open");
      }
    });
    const sel = list.querySelector(".custom-select__option.selected");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  };

  const closeList = () => {
    list.classList.add("hidden");
    wrapper.classList.remove("open");
  };

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    wrapper.classList.contains("open") ? closeList() : openList();
  });

  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wrapper.classList.contains("open") ? closeList() : openList(); }
    if (e.key === "Escape") closeList();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = [...list.querySelectorAll(".custom-select__option:not(.disabled)")];
      const cur = list.querySelector(".custom-select__option.selected");
      const idx = items.indexOf(cur);
      const next = items[e.key === "ArrowDown" ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0)];
      if (next) next.click();
    }
  });

  document.addEventListener("click", (e) => { if (!wrapper.contains(e.target)) closeList(); });

  wrapper._rebuildCustomSelect = buildList;
  buildList();
};

const syncAllCustomSelects = () => {
  document.querySelectorAll("select[data-cs-init='1']").forEach((sel) => {
    sel.nextElementSibling?._rebuildCustomSelect?.();
  });
};

const initAllCustomSelects = () => {
  // Exclude elements already handled by initPillSelect (data-pill-done)
  document.querySelectorAll(".field select:not([data-cs-init]):not([data-pill-done])").forEach((sel) => {
    if (!sel.closest(".table__row") && !sel.closest(".pill-select")) {
      initCustomSelect(sel);
    }
  });
};

const initPickers = () => {
  // Biometria — unit badges for measurements (age is now a date picker, no stepper)
  initInputUnit("studentHeight", "m");
  initInputUnit("studentWeight", "kg");
  initInputUnit("studentFat", "%");
  initInputUnit("studentWaist", "cm");

  // Biometria — sex toggle

  initPillSelect("studentSex");

  // Questionário inicial
  initPillSelect("qActivity", { compact: true });
  initPillSelect("qSleep", { compact: true });

  // Questionário rotina
  initRangeSlider("qStress", { min: 0, max: 10 });
  initPillSelect("qFood", { compact: true });
  initPillSelect("qMood", { compact: true });
  initPillSelect("qEnergy", { compact: true });
  initPillSelect("qScreen", { compact: true });
  initPillSelect("qHydration", { compact: true });

  // Login
  initPillSelect("roleSelect");

  // Styled dropdown lists for all other .field selects
  initAllCustomSelects();

  // Custom date picker button — triggers native date picker on click
  document.getElementById("birthDatePickerBtn")?.addEventListener("click", () => {
    const inp = elements.studentBirthDate;
    if (!inp) return;
    try { inp.showPicker(); } catch { inp.click(); }
  });
};

const initModals = () => {
  // Modal close (legacy support)
  if (elements.closeProtocols) {
    elements.closeProtocols.addEventListener("click", () => {
      if (elements.protocolsModal) elements.protocolsModal.classList.add("hidden");
    });
  }
  // Show register fields toggle
  const showRegisterBtn = document.getElementById("showRegister");
  const registerFields = document.getElementById("registerFields");
  if (showRegisterBtn && registerFields) {
    showRegisterBtn.addEventListener("click", () => {
      // Pop animation on the button
      showRegisterBtn.classList.remove("btn--pop");
      void showRegisterBtn.offsetWidth; // force reflow to restart animation
      showRegisterBtn.classList.add("btn--pop");
      showRegisterBtn.addEventListener("animationend", () => showRegisterBtn.classList.remove("btn--pop"), { once: true });

      registerFields.classList.toggle("hidden");
      showRegisterBtn.textContent = registerFields.classList.contains("hidden") ? "Criar conta" : "J\u00e1 tenho conta";
      if (!registerFields.classList.contains("hidden") && elements.roleSelect) {
        elements.roleSelect.value = "";
      }
    });
  }
  // Enter on password
  if (elements.userPassword) {
    elements.userPassword.addEventListener("keydown", (e) => { if (e.key === "Enter") loginUser(); });
  }
};

/* ═══════════════════════════════════════════════════
   INTERNATIONALISATION (PT / EN)
═══════════════════════════════════════════════════ */
let currentLang = localStorage.getItem("af_lang") || "pt";

const TRANSLATIONS = {
  pt: {
    students: "alunos", generate_report: "Gerar relatório",
    print_pdf: "Imprimir / PDF", profile: "Perfil", profile_sub: "A tua conta AtlanticoFit",
    account: "Conta", stats: "Estatísticas", appearance: "Aparência", dark_mode: "Modo escuro",
    dark_mode_desc: "Alterna entre tema claro e escuro", language: "Idioma",
    change_password: "Alterar palavra-passe", current_pass: "Palavra-passe atual",
    new_pass: "Nova palavra-passe", save_pass: "Guardar palavra-passe",
    session: "Sessão", session_desc: "Terminar sessão neste dispositivo.", logout: "Terminar sessão",
    sos_fill: "Preenche psicólogo e professor.", sos_sent: "Alerta SOS enviado.",
    pwa_title: "Instala o AtlanticoFit", pwa_got_it: "Já está instalado!", pwa_skip: "Continuar no browser",
    pwa_desc: "Para a melhor experiência, instala a app no teu dispositivo. É grátis e funciona offline.",
  },
  en: {
    students: "students", generate_report: "Generate report",
    print_pdf: "Print / PDF", profile: "Profile", profile_sub: "Your AtlanticoFit account",
    account: "Account", stats: "Statistics", appearance: "Appearance", dark_mode: "Dark mode",
    dark_mode_desc: "Toggle between light and dark theme", language: "Language",
    change_password: "Change password", current_pass: "Current password",
    new_pass: "New password", save_pass: "Save password",
    session: "Session", session_desc: "Sign out from this device.", logout: "Sign out",
    sos_fill: "Fill in psychologist and teacher.", sos_sent: "SOS alert sent.",
    pwa_title: "Install AtlanticoFit", pwa_got_it: "Already installed!", pwa_skip: "Continue in browser",
    pwa_desc: "For the best experience, install the app on your device. It's free and works offline.",
  },
};

const i18n = (key) => TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.pt[key] ?? key;

const applyTranslations = () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = i18n(key);
    if (text) el.textContent = text;
  });
  // Update lang toggle button
  const lt = document.getElementById("langToggle");
  if (lt) lt.textContent = currentLang.toUpperCase();
  document.documentElement.lang = currentLang;
};

const setLang = (lang) => {
  currentLang = lang;
  localStorage.setItem("af_lang", lang);
  applyTranslations();
  // Sync profile lang pills
  document.querySelectorAll("#langPillWrap .pill-select__btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
};

/* ═══════════════════════════════════════════════════
   DARK MODE
═══════════════════════════════════════════════════ */
const applyTheme = (dark) => {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  localStorage.setItem("af_theme", dark ? "dark" : "light");
  // Sync all toggle buttons
  const dmToggle = document.getElementById("darkModeToggle");
  if (dmToggle) dmToggle.classList.toggle("on", dark);
};

const toggleTheme = () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  applyTheme(!isDark);
};

// Load saved theme
const savedTheme = localStorage.getItem("af_theme");
if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  applyTheme(true);
}

/* ═══════════════════════════════════════════════════
   PWA INSTALL TUTORIAL
═══════════════════════════════════════════════════ */
const isMobile = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);
const isPWA = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true ||
  document.referrer.includes("android-app://");

const getPWASteps = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return [
      "Toca no botão <strong>Partilhar</strong> (quadrado com seta) na barra do Safari",
      "Desce e toca em <strong>\"Adicionar ao Ecrã Principal\"</strong>",
      "Toca em <strong>Adicionar</strong> no canto superior direito",
      "Abre o AtlanticoFit a partir do ícone no ecrã principal",
    ];
  }
  if (/Android/i.test(ua)) {
    return [
      "Toca nos <strong>três pontos ⋮</strong> no canto superior direito do Chrome",
      "Toca em <strong>\"Adicionar ao ecrã inicial\"</strong> ou <strong>\"Instalar aplicação\"</strong>",
      "Confirma tocando em <strong>Adicionar</strong>",
      "Abre o AtlanticoFit a partir do ícone no ecrã inicial",
    ];
  }
  return [
    "Clica no ícone de <strong>instalar</strong> na barra de endereço do browser",
    "Confirma a instalação",
    "Abre o AtlanticoFit a partir do ícone na área de trabalho",
  ];
};

const initPWAInstall = () => {
  const screen = document.getElementById("pwaInstallScreen");
  if (!screen) return;
  // Only show on mobile browsers that are not already in PWA mode
  if (!isMobile() || isPWA()) {
    screen.classList.add("hidden");
    return;
  }
  // Check if user dismissed recently (expires after 7 days)
  const dismissed = localStorage.getItem("af_pwa_dismissed");
  if (dismissed) {
    const age = Date.now() - parseInt(dismissed, 10);
    if (age < 7 * 24 * 60 * 60 * 1000) {
      screen.classList.add("hidden");
      return;
    }
    localStorage.removeItem("af_pwa_dismissed");
  }
  // Build steps
  const stepsEl = document.getElementById("pwaSteps");
  if (stepsEl) {
    stepsEl.innerHTML = getPWASteps().map((s, i) =>
      `<li><span class="pwa-install__step-num">${i + 1}</span><span>${s}</span></li>`
    ).join("");
  }
  screen.classList.remove("hidden");
  document.getElementById("pwaGotIt")?.addEventListener("click", () => {
    screen.classList.add("hidden");
    localStorage.setItem("af_pwa_dismissed", Date.now().toString());
  });
  document.getElementById("pwaSkip")?.addEventListener("click", () => {
    screen.classList.add("hidden");
    localStorage.setItem("af_pwa_dismissed", Date.now().toString());
  });
};

/* ═══════════════════════════════════════════════════
   CHANGE PASSWORD
═══════════════════════════════════════════════════ */
const changePassword = () => {
  const current = document.getElementById("currentPassword")?.value.trim();
  const next = document.getElementById("newPassword")?.value.trim();
  const status = document.getElementById("changePasswordStatus");
  if (!current || !next) {
    if (status) status.textContent = "Preenche os dois campos.";
    return;
  }
  if (next.length < 8) {
    if (status) status.textContent = "A nova palavra-passe deve ter pelo menos 8 caracteres.";
    return;
  }
  if (!state.token) { if (status) status.textContent = "Sem sessão ativa."; return; }
  apiFetch("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword: current, newPassword: next }),
  })
    .then(() => {
      if (status) status.textContent = "";
      toast("Palavra-passe alterada com sucesso.", "success");
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
    })
    .catch((err) => {
      if (status) status.textContent = err.message;
      toast(err.message, "error");
    });
};

const init = () => {
  initModals();
  renderTests();
  loadQuestionnaireDraft();
  initPickers();
  syncAllPillSelects(); // sync visual state after draft hydration
  if (elements.deferStatus) {
    const isInitialDone = sessionStorage.getItem("af_initial") === "done";
    elements.deferStatus.textContent = isInitialDone
      ? `Questionario inicial completo. ${state.defers} adiamentos usados.`
      : `${state.defers} adiamentos usados.`;
  }
  updateQuestionnaireProgress();

  [...initialQuestionFields, ...routineQuestionFields].forEach((fieldId) => {
    const input = elements[fieldId];
    if (!input) return;
    input.addEventListener("input", () => {
      saveQuestionnaireDraft();
      updateQuestionnaireProgress();
    });
    input.addEventListener("change", () => {
      saveQuestionnaireDraft();
      updateQuestionnaireProgress();
    });
  });

  // -- Wire up all interactive elements ----------------------------------------
  elements.calcImc?.addEventListener("click", calculateImc);
  elements.saveStudent?.addEventListener("click", saveStudent);
  elements.saveBiometrics?.addEventListener("click", saveBiometrics);
  elements.addTestRow?.addEventListener("click", () => {
    elements.testsTable.appendChild(buildTestRow());
  });
  elements.saveTests?.addEventListener("click", saveTests);
  elements.saveAccess?.addEventListener("click", saveProfile);
  elements.registerUser?.addEventListener("click", registerUser);
  elements.loginUser?.addEventListener("click", loginUser);

  // Password reveal toggle
  elements.togglePassword?.addEventListener("click", () => {
    const input = elements.userPassword;
    const icon = document.getElementById("revealPwIcon");
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    // eye = password revealed (you can see it); eye-off = password hidden (can't see it)
    if (icon) { icon.setAttribute("data-lucide", isHidden ? "eye" : "eye-off"); lucide.createIcons(); }
  });
  elements.logoutUserBtn?.addEventListener("click", logoutUser);
  elements.profileBtn?.addEventListener("click", () => showTab("perfil"));
  elements.sendReport?.addEventListener("click", sendReport);
  elements.generateReport?.addEventListener("click", generatePDF);
  // printReport removed — PDF is now via generatePDF
  elements.addYear?.addEventListener("click", addYear);
  elements.submitInitial?.addEventListener("click", submitInitial);
  elements.deferInitial?.addEventListener("click", deferInitial);
  elements.submitRoutine?.addEventListener("click", submitRoutine);
  elements.triggerSos?.addEventListener("click", triggerSos);
  elements.registerDispensa?.addEventListener("click", registerDispensa);
  elements.loadTurma?.addEventListener("click", loadTurmaView);
  document.getElementById("exportTurmaCSV")?.addEventListener("click", exportTurmaCSV);
  document.getElementById("changePasswordBtn")?.addEventListener("click", changePassword);

  // Theme toggle is in the Profile tab (darkModeToggle)
  document.getElementById("darkModeToggle")?.addEventListener("click", toggleTheme);

  // Language toggle is in the Profile tab (langPillWrap)
  document.querySelectorAll("#langPillWrap .pill-select__btn").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  // Apply initial translations
  applyTranslations();

  // PWA install check
  initPWAInstall();

  // Re-position nav indicator on resize
  window.addEventListener("resize", () => {
    const activeBtn = elements.bottomnav?.querySelector(".bottomnav__item.active");
    if (activeBtn) requestAnimationFrame(() => updateNavIndicator(activeBtn.dataset.tab));
  }, { passive: true });

  // -- Show login or app based on saved session ---------------------------------
  if (state.token && state.user) {
    showApp(state.user);
  } else {
    showLogin();
  }
};

init();