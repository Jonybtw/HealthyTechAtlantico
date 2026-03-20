const fs = require('fs');
let text = fs.readFileSync('messages/pt.json', 'utf8');

// Ensure studentListLoadError is present
if (!text.includes('\"studentListLoadError\"')) {
  text = text.replace(
    /\"connectionError\": \"([^\"]+)\",\\s*\"refresh\": \"/g,
    '\"connectionError\": \"\",\n    \"studentListLoadError\": \"Erro a carregar alunos.\",\n    \"refresh\": \"'
  );
}

// Convert specific loadError strings:
text = text.replace(/Erro ao carregar lista de alunos\\./g, 'Erro a carregar alunos.');
text = text.replace(/Erro ao carregar turma\\./g, 'Erro a carregar turmas.');
text = text.replace(/Erro ao carregar encarregados\\./g, 'Erro a carregar guardiões.');
text = text.replace(/Erro ao carregar registos de auditoria\\./g, 'Erro a carregar registos de auditoria.');
text = text.replace(/Nao foi possivel carregar os alertas SOS\\./g, 'Erro a carregar alertas SOS.');

// Standardize generic "Erro ao " to "Erro a "
text = text.replace(/Erro ao criar/g, 'Erro a criar');
text = text.replace(/Erro ao gravar/g, 'Erro a gravar');
text = text.replace(/Erro ao submeter/g, 'Erro a submeter');
text = text.replace(/Erro ao enviar/g, 'Erro a enviar');
text = text.replace(/Erro ao remover/g, 'Erro a remover');
text = text.replace(/Erro ao guardar/g, 'Erro a guardar');
text = text.replace(/Erro ao eliminar/g, 'Erro a eliminar');

fs.writeFileSync('messages/pt.json', text, 'utf8');
console.log('Fixed pt.json');
