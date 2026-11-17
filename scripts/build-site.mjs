import {mkdirSync,rmSync,cpSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/check-csp.mjs'],{stdio:'inherit'});
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');
for(const file of ['index.html','om-oss.html','utforda-jobb.html','kontakt.html','_headers','_redirects','analytics.js','css','images','favicon.svg','robots.txt','sitemap.xml'])cpSync(file,`dist/${file}`,{recursive:true});
