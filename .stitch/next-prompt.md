Redesign the “Alunos” (Students Directory) page as a premium, calm, highly legible directory for school staff, aligned with the **Clinical Sanctuary** dark-mode design system.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web (Desktop-first, responsive down to mobile)
- Mode: DARK MODE ONLY (do not use white/cream page backgrounds)
- Theme: “Clinical Sanctuary” — premium, high-contrast, calm, secure, glassmorphism
- Background (Base): Deep Obsidian / Navy Black `#07111c` with extremely subtle mesh/radial gradients
- Surfaces:
  - Primary Surface: `rgba(15, 23, 42, 0.80)` + `backdrop-blur` (glass cards)
  - Utility Surface: `rgba(30, 41, 59, 0.50)` (inputs/inner cards)
- Primary Action: Navy gradient `linear-gradient(135deg, #1E3A8A, #10243a)`
- Accent / Priority: Gold/Amber `#d8ad34` / `#e8c766` (CTA glow, priority metrics)
- Success: `#10B981`
- Destructive / SOS: `#EF4444`
- Typography:
  - Body: Inter (or Public Sans)
  - Headings: Manrope (premium tracking)
  - Eyebrow headers: uppercase, tracking-widest, microtext (required on every page)
- Components:
  - Cards: rounded-[20px] to rounded-[24px], 1px translucent borders, soft shadows
  - Buttons: pill-shaped, subtle lift on hover, strong focus rings
  - Tables: comfortable row height, subtle separators, no generic striped look

**Page Structure:**
1. **App Shell (Contextual Layout):**
   - Left sidebar placeholder (dark glass panel) + top bar.
   - Top eyebrow breadcrumb: `GESTÃO · ALUNOS` (uppercase, tracking-widest).
   - User area on top right (avatar placeholder).

2. **Page Header:**
   - Big title: “Alunos”.
   - Short muted description: “Diretório de estudantes, importação e gestão rápida.”
   - Primary actions aligned right:
     - Primary CTA: “Novo aluno” (gold accent glow)
     - Secondary CTA: “Importar CSV” (utility surface, subtle border)

3. **Search + Filters Toolbar:**
   - Search input with icon, placeholder “Pesquisar por nome…”
   - Optional filters (school year / class) as compact selects
   - Result counter microtext: “75 resultados”

4. **Create Form (Progressive Disclosure):**
   - Collapsible card (accordion) shown when clicking “Novo aluno”
   - Fields:
     - “Nome” (text)
     - “Sexo” (pill segmented control: Masculino / Feminino)
     - “Data de Nascimento” (date)
   - Validation states: helper text + error styles, accessible focus rings

5. **Students Data Grid (Premium Table):**
   - Glass container card with blur and translucent border
   - Columns: Avatar+Nome, Sexo, Data de nascimento, Turma
   - Rows are keyboard-focusable and clickable (hover highlight + subtle chevron affordance)
   - Avatar: elegant color swatch + initials
   - States:
     - Loading: skeleton rows
     - Empty: icon + text + CTA to create first student
     - Error: subtle banner with “Tentar novamente”

6. **Pagination Footer:**
   - Prev/next buttons + page indicator (“Página 2 de 8”)
   - Optional “rows per page” selector (keep limits reasonable)

**Output Requirement:**
- Generate a complete, functional **HTML + Tailwind** mockup of the `/alunos` page, including sidebar placeholder + top bar.
- Keep everything in dark mode with glassmorphism surfaces; do not introduce light backgrounds.
