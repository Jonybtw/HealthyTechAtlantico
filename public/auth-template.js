window.AUTH_TEMPLATE = `
<div id="loginScreen" class="login-screen">
  <div class="login-card">
    <div class="login-logo">
      <div class="login-logo__badge">Colegio Atlantico</div>
      <h1>AtlanticoFit</h1>
      <p class="login-logo__sub">Plataforma de Educacao Fisica</p>
    </div>
    <label class="field">
      Email
      <input id="userEmail" type="email" placeholder="nome@colegio.pt" autocomplete="email" />
    </label>
    <label class="field">
      Palavra-passe
      <input id="userPassword" type="password" placeholder="Minimo 8 caracteres" autocomplete="current-password" />
    </label>
    <div class="login-actions">
      <button class="btn" id="loginUser">Entrar</button>
      <button class="btn btn--ghost" id="showRegister">Criar conta</button>
    </div>
    <div id="registerFields" class="register-fields hidden">
      <label class="field">
        Perfil da conta
        <select id="roleSelect">
          <option value="">Selecionar perfil</option>
          <option value="aluno">Aluno</option>
          <option value="professor">Professor</option>
          <option value="psicologo">Psicologo</option>
          <option value="pais">Pais / E.E.</option>
        </select>
      </label>
      <label class="field field--inline">
        <input id="consentRgpd" type="checkbox" />
        Aceito o tratamento de dados (RGPD)
      </label>
      <label class="field field--inline">
        <input id="consentShare" type="checkbox" />
        Autorizo envio de relatorios por email
      </label>
      <button class="btn" id="registerUser" style="width:100%;margin-top:8px">Registar</button>
    </div>
    <p class="helper login-status" id="accessStatus"></p>
  </div>
</div>
`;
