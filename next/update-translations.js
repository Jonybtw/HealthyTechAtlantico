/* eslint-disable @typescript-eslint/no-require-imports, no-console */

const fs = require('fs');

const ptPath = 'c:\\\\Users\\\\Ryzen\\\\HealthyTechAtlantico\\\\next\\\\messages\\\\pt.json';
const enPath = 'c:\\\\Users\\\\Ryzen\\\\HealthyTechAtlantico\\\\next\\\\messages\\\\en.json';

const pt = JSON.parse(fs.readFileSync(ptPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newPt = {
  registerLanding: {
    title: 'Registo',
    eyebrow: 'Criar conta',
    description: 'Escolha o seu perfil para iniciar o processo de registo no Colégio Atlântico.',
    studentTitle: 'Sou Aluno',
    studentDescription: 'Registe-se usando o seu email institucional (@colegioatlantico.pt).',
    guardianTitle: 'Sou Encarregado de Educação',
    guardianDescription: 'Registe-se usando o número de processo do seu educando.',
    backToLogin: 'Voltar ao Login'
  },
  registerStudent: {
    title: 'Registo de Aluno',
    eyebrow: 'Registo',
    description: 'Preencha os dados abaixo com o seu email escolar para criar a sua conta.',
    nameLabel: 'Nome completo',
    namePlaceholder: 'ex: João Silva',
    emailLabel: 'Email Escolar',
    emailPlaceholder: 'ex: a12345@colegioatlantico.pt',
    passwordLabel: 'Palavra-passe',
    passwordHint: 'Mínimo de 8 caracteres, com uma maiúscula e um número.',
    submitButton: 'Criar conta',
    submittingButton: 'A criar...',
    errorDomain: 'Apenas são permitidos emails com o domínio @colegioatlantico.pt.',
    errorGeneric: 'Ocorreu um erro ao criar a conta. Tente novamente.',
    successTitle: 'Verifique o seu email',
    successDescription: 'Enviámos um email com um botão para ativar a sua conta.'
  },
  registerGuardian: {
    title: 'Registo de Encarregado de Educação',
    eyebrow: 'Registo',
    description: 'Crie uma conta para acompanhar a evolução física do seu educando.',
    nameLabel: 'Nome completo',
    namePlaceholder: 'ex: Maria Silva',
    emailLabel: 'Email pessoal',
    emailPlaceholder: 'ex: maria.silva@email.com',
    passwordLabel: 'Palavra-passe',
    passwordHint: 'Mínimo de 8 caracteres, com uma maiúscula e um número.',
    processNumberLabel: 'Nº Processo do Aluno',
    processNumberPlaceholder: 'ex: 12345',
    processNumberHint: 'Número de identificação do aluno fornecido pela escola.',
    submitButton: 'Criar conta',
    submittingButton: 'A criar...',
    errorGeneric: 'Ocorreu um erro ao criar a conta. Tente novamente.',
    successTitle: 'Verifique o seu email',
    successDescription: 'Enviámos um email com um botão para ativar a sua conta.'
  },
  changePasswordPage: {
    title: 'Alterar Palavra-passe',
    eyebrow: 'Segurança',
    description: 'Por motivos de segurança, altere a sua palavra-passe para continuar.',
    currentPassword: 'Palavra-passe atual',
    newPassword: 'Nova palavra-passe',
    confirmPassword: 'Confirmar nova palavra-passe',
    submitButton: 'Alterar palavra-passe',
    submittingButton: 'A alterar...',
    successTitle: 'Palavra-passe alterada',
    successDescription: 'A sua palavra-passe foi alterada com sucesso.',
    errorGeneric: 'Ocorreu um erro ao alterar. Verifique os dados e tente novamente.'
  },
  verifyEmail: {
    title: 'Verificar Email',
    eyebrow: 'Validação',
    description: 'A verificar a ligação.',
    verifying: 'A processar a sua verificação...',
    verifiedText: 'O seu email foi verificado com sucesso!',
    failedText: 'Ligação inválida ou expirada.',
    buttonToLogin: 'Iniciar Sessão',
    buttonRetry: 'Tentar novamente'
  }
};

const newEn = {
  registerLanding: {
    title: 'Registration',
    eyebrow: 'Create account',
    description: 'Choose your profile to start the registration process at Colégio Atlântico.',
    studentTitle: 'I am a Student',
    studentDescription: 'Register using your institutional email (@colegioatlantico.pt).',
    guardianTitle: 'I am a Guardian',
    guardianDescription: "Register using your student's process number.",
    backToLogin: 'Back to Login'
  },
  registerStudent: {
    title: 'Student Registration',
    eyebrow: 'Register',
    description: 'Fill in your details using your school email to create an account.',
    nameLabel: 'Full name',
    namePlaceholder: 'e.g., John Doe',
    emailLabel: 'School Email',
    emailPlaceholder: 'e.g., a12345@colegioatlantico.pt',
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters, one uppercase, and one number.',
    submitButton: 'Create account',
    submittingButton: 'Creating...',
    errorDomain: 'Only emails with the @colegioatlantico.pt domain are allowed.',
    errorGeneric: 'An error occurred while creating the account. Please try again.',
    successTitle: 'Check your email',
    successDescription: "We've sent an email with a link to activate your account."
  },
  registerGuardian: {
    title: 'Guardian Registration',
    eyebrow: 'Register',
    description: "Create an account to track your student's physical progression.",
    nameLabel: 'Full name',
    namePlaceholder: 'e.g., Jane Doe',
    emailLabel: 'Personal email',
    emailPlaceholder: 'e.g., jane.doe@email.com',
    passwordLabel: 'Password',
    passwordHint: 'At least 8 characters, one uppercase, and one number.',
    processNumberLabel: 'Student Process Number',
    processNumberPlaceholder: 'e.g., 12345',
    processNumberHint: 'Student ID number provided by the school.',
    submitButton: 'Create account',
    submittingButton: 'Creating...',
    errorGeneric: 'An error occurred while creating the account. Please try again.',
    successTitle: 'Check your email',
    successDescription: "We've sent an email with a link to activate your account."
  },
  changePasswordPage: {
    title: 'Change Password',
    eyebrow: 'Security',
    description: 'For security reasons, please change your password to continue.',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    submitButton: 'Change password',
    submittingButton: 'Changing...',
    successTitle: 'Password changed',
    successDescription: 'Your password has been changed successfully.',
    errorGeneric: 'An error occurred. Please check your details and try again.'
  },
  verifyEmail: {
    title: 'Verify Email',
    eyebrow: 'Validation',
    description: 'Verifying link.',
    verifying: 'Processing your verification...',
    verifiedText: 'Your email has been successfully verified!',
    failedText: 'Link is invalid or expired.',
    buttonToLogin: 'Sign In',
    buttonRetry: 'Try again'
  }
};

Object.assign(pt, newPt);
Object.assign(en, newEn);

fs.writeFileSync(ptPath, JSON.stringify(pt, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Successfully updated pt.json and en.json');
