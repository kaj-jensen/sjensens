import {mkdirSync,rmSync,copyFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/check-csp.mjs'],{stdio:'inherit'});
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');
for(const file of ['index.html','om-oss.html','utforda-jobb.html','kontakt.html','_headers'])copyFileSync(file,`dist/${file}`);
