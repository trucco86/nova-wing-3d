import { writeFileSync } from 'node:fs';
const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
  throw new Error('Usage: npm run agent:new -- short-task-name');
const path = `specs/${slug}.md`;
writeFileSync(
  path,
  `# ${slug}\n\nStatus: draft\n\n## Objetivo\n\nDescrever o problema observável e o resultado esperado.\n\n## Escopo\n\nIndicar os arquivos e comportamentos afetados.\n\n## Critérios de aceite\n\n- Definir comportamento verificável antes da implementação.\n\n## Validação\n\n- npm run validate\n- Teste específico e evidência visual quando houver mudança gráfica.\n\n## Evidências\n\nRegistrar comandos, resultados, limitações e commit do PR.\n`,
  { flag: 'wx' },
);
console.log(path);
