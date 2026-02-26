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

const state = {
  profiles: JSON.parse(localStorage.getItem("af_profiles")) || [],
  tests: JSON.parse(localStorage.getItem("af_tests")) || [],
  years: JSON.parse(localStorage.getItem("af_years")) || [],
  alerts: JSON.parse(localStorage.getItem("af_alerts")) || [],
  defers: Number(localStorage.getItem("af_defers")) || 0,
  token: localStorage.getItem("af_token") || "",
  user: JSON.parse(localStorage.getItem("af_user")) || null,
  currentStudentId: Number(localStorage.getItem("af_student_id")) || null,
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
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    13: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    14: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    15: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    16: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    17: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
    },
    18: {
      vai: [47, 82],
      cooper: [18, 22],
      velocidade: [6.7, 5.9],
      milha: ["10:30", "6:30"],
      agilidade: [11.5, 10.25],
      abd: [10, 55],
      bracos: [10, 27],
      senta: [18.5, 33.0],
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
  consentRgpd: document.getElementById("consentRgpd"),
  consentShare: document.getElementById("consentShare"),
  registerUser: document.getElementById("registerUser"),
  loginUser: document.getElementById("loginUser"),
  logoutUser: document.getElementById("logoutUser"),
  saveAccess: document.getElementById("saveAccess"),
  accessStatus: document.getElementById("accessStatus"),
  studentName: document.getElementById("studentName"),
  studentSex: document.getElementById("studentSex"),
  studentAge: document.getElementById("studentAge"),
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
  const age = Number(elements.studentAge.value);
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
  elements.imcNote.textContent = inZone
    ? "IMC dentro da Zona Saudável."
    : `IMC fora da Zona Saudável (${min}–${max}). Risco cardiovascular aumentado.`;

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
    const age = Number(elements.studentAge.value);
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
  localStorage.setItem("af_tests", JSON.stringify(state.tests));
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
    if (elements.topbarUser) elements.topbarUser.textContent = me.email || "";
  } catch (_) {}
};

const refreshTopbarStats = async () => {
  if (!state.token || !state.user) {
    setTopbarVisibility({ students: false, alerts: false });
    setTopbarStats({ students: 0, alerts: 0 });
    return;
  }

  const canListStudents = hasPermission("list_students");
  const canReadSos = hasPermission("read_sos");
  setTopbarVisibility({ students: canListStudents, alerts: canReadSos });

  if (!canListStudents) {
    setTopbarStats({ students: 0, alerts: 0 });
    return;
  }

  try {
    const students = await apiFetch("/students");
    const studentCount = Array.isArray(students) ? students.length : 0;

    if (!canReadSos) {
      setTopbarStats({ students: studentCount, alerts: 0 });
      return;
    }

    if (studentCount === 0) {
      setTopbarStats({ students: 0, alerts: 0 });
      return;
    }

    const sosResponses = await Promise.all(
      students.map((student) =>
        apiFetch(`/students/${student.id}/sos`)
          .then((alerts) => (Array.isArray(alerts) ? alerts.length : 0))
          .catch((error) => {
            if (/forbidden/i.test(error.message)) return null;
            return 0;
          })
      )
    );

    const totalAlerts = sosResponses.filter((value) => Number.isInteger(value)).reduce((sum, value) => sum + value, 0);
    setTopbarStats({
      students: studentCount,
      alerts: totalAlerts,
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
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem("af_token", state.token);
      localStorage.setItem("af_user", JSON.stringify(state.user));
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
      const registerFields = document.getElementById("registerFields");
      const showRegisterBtn = document.getElementById("showRegister");
      if (registerFields) registerFields.classList.add("hidden");
      if (showRegisterBtn) showRegisterBtn.textContent = "Criar conta";
      if (elements.roleSelect) elements.roleSelect.value = "";

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem("af_token", state.token);
      localStorage.setItem("af_user", JSON.stringify(state.user));
      showApp(state.user);
      toast(`Bem-vindo/a, ${data.user.email}`, "success");
    })
    .catch((err) => {
      hideLoading();
      toast(err.message, "error");
    });
};

const logoutUser = () => {
  state.token = "";
  state.user = null;
  localStorage.removeItem("af_token");
  localStorage.removeItem("af_user");
  showLogin();
};

const saveStudent = () => {
  if (!state.token) {
    updateAccessStatus("Sem sessão ativa. Faz login primeiro.");
    return;
  }
  const name = elements.studentName.value.trim();
  const sex = elements.studentSex.value;
  const age = Number(elements.studentAge.value);
  const schoolYear = elements.schoolYear.value.trim();
  if (!name || !sex || !age) {
    updateAccessStatus("Preenche nome, sexo e idade do aluno.");
    return;
  }
  apiFetch("/students", {
    method: "POST",
    body: JSON.stringify({ name, sex, age, schoolYear }),
  })
    .then((student) => {
      state.currentStudentId = student.id;
      localStorage.setItem("af_student_id", String(student.id));
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

const updateReport = () => {
  const name = elements.studentName.value || "Aluno";
  const age = elements.studentAge.value || "-";
  const sex = elements.studentSex.value === "F" ? "Feminino" : elements.studentSex.value === "M" ? "Masculino" : "Não definido";
  const year = elements.schoolYear.value || "-";
  const imc = elements.imcValue.textContent || "-";
  const imcZone = elements.imcZone.textContent || "-";
  const waistRaw = elements.studentWaist.value;
  const waistZoneText = elements.waistZone.textContent || "-";
  const waistVal = waistRaw ? `${waistRaw} cm — ${waistZoneText}` : "Não registado";

  // Collect tests from table rows in DOM
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
  const testSections = Object.entries(testsByCategory).map(([category, lines]) => {
    return `${category}\n${lines.join("\n")}`;
  });

  // ZAF advisory messages (from official Colégio Atlântico guidelines)
  const imcAdvisory = imcZone === "Zona Saudável" || imcZone === "Zona Saudavel"
    ? "O IMC do seu educando encontra-se dentro da Zona Saudável para a sua idade e sexo."
    : "ATENÇÃO: Um IMC elevado está associado a um risco cardiovascular elevado, assim como a problemas metabólicos e osteoarticulares. Recomendamos uma consulta com o médico de família.";

  const waistAdvisory = !waistRaw ? ""
    : (waistZoneText === "Zona Saudável" || waistZoneText === "Zona Saudavel")
      ? "O perímetro da cintura encontra-se dentro dos valores de referência saudáveis."
      : "ATENÇÃO: O Perímetro da Cintura relaciona-se com a gordura abdominal (subcutânea e visceral) e com a gordura corporal total. Um Perímetro da Cintura elevado é considerado um fator de risco de doenças cardiometabólicas e respiratórias.";

  const now = new Date().toLocaleDateString("pt-PT");
  const text =
`===========================================
RELATÓRIO ATLANTICOFIT — ${now}
Colégio Atlântico
Educação Física — Avaliação Física
===========================================

Aluno: ${name}
Idade: ${age} anos  |  Sexo: ${sex}  |  Ano letivo: ${year}

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
===========================================`;

  elements.reportText.value = text;
};

const sendReport = () => {
  updateReport();
  const email = elements.reportEmail.value.trim() || elements.userEmail.value.trim() || "";
  if (!email) {
    updateAccessStatus("Insere o email do destinatário no campo Email do relatório.");
    return;
  }
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/reports/email`, {
      method: "POST",
      body: JSON.stringify({ content: elements.reportText.value, email }),
    })
      .then(() => updateAccessStatus("Relatório enviado por email."))
      .catch((err) => updateAccessStatus("Erro: " + err.message));
  } else {
    const subject = encodeURIComponent("Relatório AtlanticoFit");
    const body = encodeURIComponent(elements.reportText.value);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }
};

const updateCharts = () => {
  const labels = state.years.map((y) => y.year);
  const imcValues = state.years.map((y) => y.imc);
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
      labels,
      datasets: [
        {
          label: "IMC medio da turma",
          data: classImcValues,
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
  const draftRaw = localStorage.getItem(QUESTIONNAIRE_DRAFT_KEY);
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
  localStorage.setItem(QUESTIONNAIRE_DRAFT_KEY, JSON.stringify(draft));
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
  localStorage.setItem("af_initial", "done");
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
  localStorage.setItem("af_defers", state.defers.toString());
  elements.deferStatus.textContent = `${state.defers} adiamentos usados.`;
};

const submitRoutine = () => {
  const valid = validateQuestionnaireStep(
    routineQuestionFields,
    elements.questRoutineStatus,
    "Completa o questionário de rotina antes de submeter."
  );
  if (!valid) return;
  localStorage.setItem("af_routine", new Date().toISOString());
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
    elements.sosResult.textContent = "Preencha psicólogo e professor.";
    return;
  }
  const alertEntry = { psych, teacher, at: new Date().toISOString() };
  state.alerts.push(alertEntry);
  localStorage.setItem("af_alerts", JSON.stringify(state.alerts));
  elements.sosResult.innerHTML = `<strong>SOS ativo.</strong> Psicólogo: ${psych}, Professor: ${teacher}.<br><span style="color:#4a5f68;font-size:0.85rem">Notificação enviada${psychEmail || teacherEmail ? " por email" : ""}.</span>`;
  updateStats();
  refreshTopbarStats();
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/sos`, {
      method: "POST",
      body: JSON.stringify({ psych, teacher, psychEmail, teacherEmail }),
    })
      .then((data) => {
        if (data.emailsSent?.length > 0) {
          elements.sosResult.innerHTML += `<br><span style="color:#0a7040;font-size:0.82rem">Email enviado para: ${data.emailsSent.join(", ")}</span>`;
        }
      })
      .catch((err) => updateAccessStatus(err.message));
  }
};

const populateDispensaStudents = async () => {
  const select = elements.dispensaRecipient;
  if (!select || select.tagName !== "SELECT") return;
  if (!state.token) return;
  try {
    const students = await apiFetch("/students");
    select.innerHTML = students.length
      ? students.map((s) => `<option value="${s.id}">${s.name}${s.school_year ? " — " + s.school_year : ""}</option>`).join("")
      : `<option value="">� Sem alunos registados �</option>`;
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

const loadTurmaView = async () => {
  const year = elements.turmaYear?.value.trim();
  if (!year) { if (elements.turmaStatus) elements.turmaStatus.textContent = "Introduz o ano letivo."; return; }
  if (!state.token) { if (elements.turmaStatus) elements.turmaStatus.textContent = "Sem sess�o ativa."; return; }
  try {
    if (elements.turmaStatus) elements.turmaStatus.textContent = "A carregar...";
    const students = await apiFetch(`/classes/${encodeURIComponent(year)}/report`);
    renderTurmaTable(students);
    renderTurmaChart(students);
    if (elements.turmaStatus) elements.turmaStatus.textContent = `${students.length} aluno(s) encontrado(s).`;
  } catch (err) {
    if (elements.turmaStatus) elements.turmaStatus.textContent = "Erro: " + err.message;
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
    options: { responsive: true, plugins: { legend: { position: "bottom" }, title: { display: true, text: "Distribuição ZAF IMC — Turma" } } },
  });
};

// --- Navigation --------------------------------------------------------------
const NAV_TABS = {
  aluno:     ["bio", "tests", "quest", "sos", "reports", "protocols"],
  professor: ["bio", "tests", "turma", "dispensas", "reports", "charts", "protocols"],
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
  turma:     { label: "Turma",        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>` },
  dispensas: { label: "Dispensas",    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>` },
  protocols: { label: "Protocolos",   icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>` },
};

const showTab = (tabId) => {
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  const panel = document.getElementById("tab-" + tabId);
  if (panel) panel.classList.remove("hidden");
  document.querySelectorAll(".bottomnav__item").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabId);
  });
  if (tabId === "charts") updateCharts();
  if (tabId === "dispensas") populateDispensaStudents();
};

const buildBottomNav = (role) => {
  if (!elements.bottomnav) return;
  const tabs = NAV_TABS[role] || NAV_TABS.aluno;
  elements.bottomnav.innerHTML = tabs.map((id) => {
    const m = TAB_META[id];
    return `<button class="bottomnav__item ${m.cls || ""}" data-tab="${id}" aria-label="${m.label}">${m.icon}<span>${m.label}</span></button>`;
  }).join("");
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
  if (elements.topbarUser) elements.topbarUser.textContent = user?.email || "";
  buildBottomNav(user?.role || "aluno");
  const firstTab = (NAV_TABS[user?.role || "aluno"] || NAV_TABS.aluno)[0];
  showTab(firstTab);
  updateStats();
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

  minusBtn.addEventListener("click", () => {
    const cur = parseFloat(inp.value);
    update(isNaN(cur) ? max : cur - step);
  });
  plusBtn.addEventListener("click", () => {
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

const initPickers = () => {
  // Biometria — stepper for age, unit badges for measurements
  initNumericStepper("studentAge", { min: 9, max: 18, step: 1 });
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

const init = () => {
  initModals();
  renderTests();
  loadQuestionnaireDraft();
  initPickers();
  syncAllPillSelects(); // sync visual state after draft hydration
  if (elements.deferStatus) {
    const isInitialDone = localStorage.getItem("af_initial") === "done";
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
  elements.logoutUser?.addEventListener("click", logoutUser);
  elements.sendReport?.addEventListener("click", sendReport);
  elements.generateReport?.addEventListener("click", updateReport);
  elements.addYear?.addEventListener("click", addYear);
  elements.submitInitial?.addEventListener("click", submitInitial);
  elements.deferInitial?.addEventListener("click", deferInitial);
  elements.submitRoutine?.addEventListener("click", submitRoutine);
  elements.triggerSos?.addEventListener("click", triggerSos);
  elements.registerDispensa?.addEventListener("click", registerDispensa);
  elements.loadTurma?.addEventListener("click", loadTurmaView);

  // -- Show login or app based on saved session ---------------------------------
  if (state.token && state.user) {
    showApp(state.user);
  } else {
    showLogin();
  }
};

init();


