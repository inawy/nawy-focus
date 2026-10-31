import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const root = process.cwd()
const errors = []
const required = ['AGENTS.md','GOVERNANCE.md','docs/architecture.md','docs/product-facts.md','docs/known-limitations.md','docs/decisions.md']
for (const file of required) if (!existsSync(join(root,file))) errors.push('Missing required file: '+file)
const read = file => readFileSync(join(root,file),'utf8')
const contains = (file, words) => { if (!existsSync(join(root,file))) return; const data=read(file); for (const word of words) if (!data.includes(word)) errors.push(file+' missing required text: '+word) }
if (existsSync(join(root,'package.json'))) {
 const pkg=JSON.parse(read('package.json'))
 for (const script of ['build','typecheck','lint','test']) if (typeof pkg.scripts?.[script] !== 'string') errors.push('Missing package script: '+script)
 for (const group of ['dependencies','devDependencies']) for (const [name,version] of Object.entries(pkg[group]??{})) if (typeof version!=='string'||version==='latest'||version.includes('*')) errors.push('Use an explicit version range for '+name)
}
if (existsSync(join(root,'tsconfig.app.json'))) { const c=JSON.parse(read('tsconfig.app.json')).compilerOptions??{}; if(c.strict!==true) errors.push('TypeScript strict must remain enabled'); if(c.noUncheckedIndexedAccess!==true) errors.push('noUncheckedIndexedAccess must remain enabled') }
contains('AGENTS.md',['https://github.com/inawy/design-system','docs/product-facts.md','docs/architecture.md','Verified','Assumption'])
contains('docs/architecture.md',['src/main.tsx','src/hooks/useTimer.ts','src/lib/timer.ts','src/db.ts'])
contains('docs/product-facts.md',['nawy-focus-db','Dexie','IndexedDB'])
contains('GOVERNANCE.md',['Verified','Assumption','Unknown'])
contains('docs/known-limitations.md',['package-lock.json','E2E'])
const skills=['implement-feature','debug-bug','code-review','ui-implementation','database-migration','release-readiness']
for(const skill of skills){const file='.agents/skills/'+skill+'/SKILL.md';if(!existsSync(join(root,file))){errors.push('Missing Agent Skill: '+file);continue}const s=read(file);if(!s.startsWith('---\nname: '+skill+'\n')||!s.includes('\ndescription:'))errors.push('Invalid Agent Skill frontmatter: '+file)}
if(errors.length){console.error('Nawy Focus governance validation failed:');for(const e of errors)console.error('- '+e);process.exitCode=1}else console.log('Nawy Focus governance validation passed.')