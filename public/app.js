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
  { id: "agilidade", label: "Agilidade 4x10m", unit: "s", better: "low", category: "Velocidade e Agilidade" },
  { id: "abd", label: "Abdominais", unit: "reps", better: "high", category: "Força Muscular" },
  { id: "bracos", label: "Extensoes de bracos", unit: "reps", better: "high", category: "Força Muscular" },
  { id: "senta", label: "Senta e alcanca", unit: "cm", better: "high", category: "Flexibilidade" },
];

const elements = {
  statStudents: document.getElementById("statStudents"),
  statRecords: document.getElementById("statRecords"),
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

// ─── Toast ──────────────────────────────────────────────────────────────────
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

  if (!ageKey || !height || !weight) {
    elements.imcNote.textContent = "Preencha idade, altura e peso.";
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
  elements.statStudents.textContent = state.profiles.length;
  elements.statRecords.textContent = state.tests.length;
  elements.statAlerts.textContent = state.alerts.length;
};

const saveProfile = () => {
  const payload = {
    role: elements.roleSelect.value,
    consent_rgpd: elements.consentRgpd.checked,
    consent_share: elements.consentShare.checked,
  };
  if (!state.token) {
    updateAccessStatus("Sem sessao ativa. Faz login primeiro.");
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
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
    .then((data) => {
      state.token = data.token;
      state.user = data.user;
      localStorage.setItem("af_token", state.token);
      localStorage.setItem("af_user", JSON.stringify(state.user));
      showApp(state.user);
      toast(`Bem-vindo/a, ${data.user.email}`, "success");
    })
    .catch((err) => {
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
    updateAccessStatus("Sem sessao ativa. Faz login primeiro.");
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
  const sex = elements.studentSex.value === "F" ? "Feminino" : "Masculino";
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
IMC: ${imc} kg/m²  →  ${imcZone}
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
    updateAccessStatus("Insere o email do destinatario no campo Email do relatorio.");
    return;
  }
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/reports/email`, {
      method: "POST",
      body: JSON.stringify({ content: elements.reportText.value, email }),
    })
      .then(() => updateAccessStatus("Relatorio enviado por email."))
      .catch((err) => updateAccessStatus("Erro: " + err.message));
  } else {
    const subject = encodeURIComponent("Relatorio AtlanticoFit");
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

const submitInitial = () => {
  const activity = elements.qActivity?.value;
  if (activity === "") return;
  localStorage.setItem("af_initial", "done");
  elements.deferStatus.textContent = "Questionario inicial completo.";
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
  localStorage.setItem("af_routine", new Date().toISOString());
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/questionnaires`, {
      method: "POST",
      body: JSON.stringify({
        type: "routine",
        payload: {
          stress: elements.qStress.value,
          food: elements.qFood.value,
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
  elements.sosResult.innerHTML = `<strong>⚠ SOS ativo.</strong> Psicólogo: ${psych}, Professor: ${teacher}.<br><span style="color:#4a5f68;font-size:0.85rem">Notificação enviada${psychEmail || teacherEmail ? " por email" : ""}.</span>`;
  updateStats();
  if (state.token && state.currentStudentId) {
    apiFetch(`/students/${state.currentStudentId}/sos`, {
      method: "POST",
      body: JSON.stringify({ psych, teacher, psychEmail, teacherEmail }),
    })
      .then((data) => {
        if (data.emailsSent?.length > 0) {
          elements.sosResult.innerHTML += `<br><span style="color:#0a7040;font-size:0.82rem">✓ Email enviado para: ${data.emailsSent.join(", ")}</span>`;
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
      : `<option value="">— Sem alunos registados —</option>`;
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
    elements.dispensaStatus.textContent = "Erro: Não autenticado.";
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

// ─── Turma (class) view ───────────────────────────────────────────────────
let turmaChart = null;

const loadTurmaView = async () => {
  const year = elements.turmaYear?.value.trim();
  if (!year) { if (elements.turmaStatus) elements.turmaStatus.textContent = "Introduz o ano letivo."; return; }
  if (!state.token) { if (elements.turmaStatus) elements.turmaStatus.textContent = "Sem sessão ativa."; return; }
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
    const imcOk = s.imc_zone === "Zona Saudavel" || s.imc_zone === "Zona Saudável";
    const waistOk = s.waist_zone === "Zona Saudavel" || s.waist_zone === "Zona Saudável";
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
  const saudavel = students.filter((s) => s.imc_zone === "Zona Saudavel" || s.imc_zone === "Zona Saudável").length;
  const melhoria = students.filter((s) => s.imc_zone && s.imc_zone !== "Zona Saudavel" && s.imc_zone !== "Zona Saudável").length;
  const semDados = students.length - saudavel - melhoria;
  if (turmaChart) turmaChart.destroy();
  turmaChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Zona Saudável", "Zona de Melhoria", "Sem dados"],
      datasets: [{ data: [saudavel, melhoria, semDados], backgroundColor: ["rgba(15,160,80,0.75)", "rgba(242,108,79,0.75)", "rgba(74,95,104,0.3)"] }],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" }, title: { display: true, text: "Distribuição ZAF IMC — Turma" } } },
  });
};

// ─── Navigation ──────────────────────────────────────────────────────────────
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

const showLogin = () => {
  if (elements.loginScreen) elements.loginScreen.classList.remove("hidden");
  if (elements.appShell) elements.appShell.classList.add("hidden");
};

const showApp = (user) => {
  if (elements.loginScreen) elements.loginScreen.classList.add("hidden");
  if (elements.appShell) elements.appShell.classList.remove("hidden");
  if (elements.topbarUser) elements.topbarUser.textContent = user?.email || "";
  buildBottomNav(user?.role || "aluno");
  const firstTab = (NAV_TABS[user?.role || "aluno"] || NAV_TABS.aluno)[0];
  showTab(firstTab);
  updateStats();
  apiFetch("/students").then((students) => {
    elements.statStudents.textContent = students.length;
  }).catch(() => {});
};

const applyRoleVisibility = () => {}; // replaced by tab navigation

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
      registerFields.classList.toggle("hidden");
      showRegisterBtn.textContent = registerFields.classList.contains("hidden") ? "Criar conta" : "J\u00e1 tenho conta";
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

  // ── Wire up all interactive elements ────────────────────────────────────────
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

  // ── Show login or app based on saved session ─────────────────────────────────
  if (state.token && state.user) {
    showApp(state.user);
  } else {
    showLogin();
  }
};

init();
