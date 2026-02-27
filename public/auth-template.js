window.AUTH_TEMPLATE = `
<div id="loginScreen" class="login-screen">
  <div class="login-card">
    <div class="login-logo">
      <img src="/assets/logos/Logo1.jpg" alt="Colégio Atlântico" class="login-logo__img login-logo__img--light" />
      <img src="/assets/logos/Logo12.jpg" alt="Colégio Atlântico" class="login-logo__img login-logo__img--dark" />
      <div class="login-logo__badge">Colégio Atlântico</div>
      <h1 class="login-title">HealthyTech Atlântico</h1>
      <p class="login-logo__sub">Plataforma de Educação Física &amp; Bem-Estar</p>
    </div>
    <label class="field">
      <span class="field__label"><i data-lucide="mail" class="field-icon"></i>Email</span>
      <input id="userEmail" type="email" placeholder="nome@colegio.pt" autocomplete="email" />
    </label>
    <label class="field">
      <span class="field__label"><i data-lucide="lock" class="field-icon"></i>Palavra-passe</span>
      <div class="field__password-wrap">
        <input id="userPassword" type="password" placeholder="Mínimo 8 caracteres" autocomplete="current-password" />
        <button type="button" class="btn--reveal-pw" id="togglePassword" aria-label="Mostrar palavra-passe">
          <i data-lucide="eye-off" id="revealPwIcon"></i>
        </button>
      </div>
    </label>
    <label class="field field--inline field--remember">
      <input id="rememberMe" type="checkbox" checked />
      Lembrar-me neste dispositivo
    </label>
    <div class="login-actions">
      <button class="btn" id="loginUser"><i data-lucide="log-in" class="btn-icon"></i>Entrar</button>
      <button class="btn btn--ghost" id="showRegister"><i data-lucide="user-plus" class="btn-icon"></i>Criar conta</button>
    </div>
    <div id="registerFields" class="register-fields hidden">
      <div class="field">
        <span class="field__label"><i data-lucide="shield" class="field-icon"></i>Perfil da conta</span>
        <select id="roleSelect">
          <option value="">Selecionar perfil</option>
          <option value="aluno">Aluno</option>
          <option value="pais">Pais / E.E.</option>
          <!-- Professor e Psicólogo só podem ser criados pelo administrador -->
        </select>
      </div>
      <label class="field field--inline">
        <input id="consentRgpd" type="checkbox" />
        Aceito o tratamento de dados (RGPD)
      </label>
      <label class="field field--inline">
        <input id="consentShare" type="checkbox" />
        Autorizo envio de relatórios por email
      </label>
      <button class="btn" id="registerUser" style="width:100%;margin-top:6px"><i data-lucide="user-check" class="btn-icon"></i>Registar</button>
    </div>
    <p class="helper login-status" id="accessStatus"></p>
    <p class="login-credit">Feito por João Rôlo &amp; Rafaela Carmo &middot; HealthyTech Atlântico</p>
  </div>
</div>
`;
