const assert = require("node:assert/strict");
const { PERMISSIONS, canRole, canAccessStudentByRole } = require("../server/utils/rbac");
const { requirePermission } = require("../server/middleware/permissions");

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("professor has all permissions", () => {
  for (const permission of Object.values(PERMISSIONS)) {
    assert.equal(canRole("professor", permission), true);
  }
});

test("pais cannot trigger SOS", () => {
  assert.equal(canRole("pais", PERMISSIONS.TRIGGER_SOS), false);
});

test("psicologo can read SOS/reports but not biometrics", () => {
  assert.equal(
    canAccessStudentByRole({
      role: "psicologo",
      permission: PERMISSIONS.READ_SOS,
      isOwner: false,
      isGuardian: false,
    }),
    true
  );
  assert.equal(
    canAccessStudentByRole({
      role: "psicologo",
      permission: PERMISSIONS.READ_REPORTS,
      isOwner: false,
      isGuardian: false,
    }),
    true
  );
  assert.equal(
    canAccessStudentByRole({
      role: "psicologo",
      permission: PERMISSIONS.READ_BIOMETRICS,
      isOwner: false,
      isGuardian: false,
    }),
    false
  );
});

test("aluno must own record", () => {
  assert.equal(
    canAccessStudentByRole({
      role: "aluno",
      permission: PERMISSIONS.READ_BIOMETRICS,
      isOwner: true,
      isGuardian: false,
    }),
    true
  );
  assert.equal(
    canAccessStudentByRole({
      role: "aluno",
      permission: PERMISSIONS.READ_BIOMETRICS,
      isOwner: false,
      isGuardian: false,
    }),
    false
  );
});

test("pais must be linked as guardian", () => {
  assert.equal(
    canAccessStudentByRole({
      role: "pais",
      permission: PERMISSIONS.READ_REPORTS,
      isOwner: false,
      isGuardian: true,
    }),
    true
  );
  assert.equal(
    canAccessStudentByRole({
      role: "pais",
      permission: PERMISSIONS.READ_REPORTS,
      isOwner: false,
      isGuardian: false,
    }),
    false
  );
});

test("permission middleware blocks unauthorized role", () => {
  const middleware = requirePermission(PERMISSIONS.MANAGE_DISPENSAS);
  let statusCode = null;
  let payload = null;
  let nextCalled = false;
  const req = { user: { role: "aluno" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
  };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.deepEqual(payload, { error: "Forbidden" });
});

test("permission middleware allows authorized role", () => {
  const middleware = requirePermission(PERMISSIONS.MANAGE_DISPENSAS);
  let nextCalled = false;
  const req = { user: { role: "professor" } };
  const res = {
    status() {
      throw new Error("status should not be called");
    },
    json() {
      throw new Error("json should not be called");
    },
  };

  middleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

let passed = 0;
for (const t of tests) {
  try {
    t.fn();
    passed += 1;
    console.log(`PASS ${t.name}`);
  } catch (err) {
    console.error(`FAIL ${t.name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(`\n${passed}/${tests.length} tests passed`);
}
