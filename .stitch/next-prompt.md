# Redesign Request: Alunos (Student List) Page

## Goal
Redesign the "Alunos" (Students Directory) page into a premium, high-fidelity experience using the **Clinical Sanctuary** design system.

## Context (From Next.js Code)
- **Top Actions**: Bulk Import ("Importar CSV") and Create New ("Novo aluno").
- **Create Form (Hidden by Default)**: Inline form to create a new student featuring:
  - Text input for "Nome"
  - Sex pill select (Masculino / Feminino)
  - Date input for "Data de Nascimento"
  - Submit button.
- **Data Table**:
  - Displays a list of students.
  - Columns: Name (includes dynamic colored Avatar with initials), Sex (M/F), Birth Date (e.g. 15/05/2012), Class (e.g. "8ºA").
  - Includes a global search bar to filter by name.
  - Bottom summary showing total results (e.g. "75 resultados") and pagination controls.

## Design Requirements
This is a premium, clinical educational platform. The design must be breathtaking and deeply align with our tokens:
1. **Background**: Use the ambient `bg-[#f4faff]` with subtle blurred radial gradients (`#F59E0B` and `#1E3A8A` at 5-10% opacity) if needed for depth.
2. **Typography**: Use bold, high-contrast headings (`text-primary` #040a12). Use editorial tracking for eyebrows (e.g., `tracking-widest uppercase text-[11px]`).
3. **Data Grid (Table)**:
   - Do not use generic, boring striped tables.
   - Use clean, spaced rows with subtle horizontal borders (`border-navy-900/10`).
   - Give the table a luxurious container (e.g., `bg-white/70`, `backdrop-blur-xl`, `border border-white`, `rounded-[24px]`, `shadow-sm`).
   - Use beautiful colored swatches for the Avatars.
4. **Header & Actions**: 
   - A bold standard page header (similar to the dashboard's `text-4xl font-extrabold`).
   - Premium button styles: Default buttons should use gradients or subtle translucent backgrounds with hover effects to float up (`hover:-translate-y-0.5`). 
5. **Create Form**: 
   - Ensure the inline form looks like a beautiful card when expanded.

Please provide a fully functional HTML/Tailwind mockup of this `/alunos` page layout. Make sure to generate the complete page structure, including the sidebar placeholder to accurately depict contextual layout (Sidebar on left, main content on right).
