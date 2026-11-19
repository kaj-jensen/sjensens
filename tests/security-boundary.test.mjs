import test from 'node:test';
import assert from 'node:assert/strict';
import {protectRequest} from '../worker/security.mjs';
const request = () => new Request('https://example.invalid/private?email=secret@example.invalid', {headers:{Authorization:'Bearer PRIVATE',Cookie:'session=SECRET'}});
test('unexpected failures are controlled and do not record sensitive content',async()=>{
 const events=[];const original=console.error;console.error=value=>events.push(value);
 try {
  for (const error of [new Error('provider SECRET secret@example.invalid'), {token:'PRIVATE'}]) {
   const response=await protectRequest(async()=>{throw error;})(request(),{});
   assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');
   assert.ok(response.headers.get('Content-Security-Policy').includes("default-src 'none'"));
   assert.doesNotMatch(await response.text(),/SECRET|PRIVATE|secret@example/);
   const record=JSON.parse(events.at(-1));assert.deepEqual(Object.keys(record).sort(),['event','method','requestId','status']);
   assert.equal(record.event,'request_failed');assert.equal(record.status,503);
   assert.equal(record.requestId,response.headers.get('X-Request-ID'));
   assert.doesNotMatch(events.at(-1),/SECRET|PRIVATE|secret@example|private/);
  }
 } finally {console.error=original;}
});
test('ordinary and authentication rejection responses remain unchanged',async()=>{
 for(const status of [200,302,403,404]){
  const original=new Response('expected',{status,headers:{'X-Test':'retained'}});
  assert.equal(await protectRequest(async()=>original)(request(),{}),original);
 }
});
test('existing 5xx responses preserve body and status, add non-cacheable correlation',async()=>{
 const original=console.error;console.error=()=>{};
 try {const response=await protectRequest(async()=>new Response('delivery_failed',{status:502,headers:{'X-Test':'retained'}}))(request(),{});
 assert.equal(response.status,502);assert.equal(await response.text(),'delivery_failed');assert.equal(response.headers.get('X-Test'),'retained');assert.ok(response.headers.get('X-Request-ID'));assert.equal(response.headers.get('Cache-Control'),'no-store');
 }finally{console.error=original;}
});

test('automatic credential-bearing deployment is production-only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const workflow=await readFile(new URL('../.github/workflows/browser-checks.yml',import.meta.url),'utf8');
 const deploy=workflow.slice(workflow.indexOf('  deploy:'));
 const condition=deploy.slice(deploy.indexOf('    if: >-'),deploy.indexOf('    runs-on:'));
 assert.match(condition,/github.event_name == 'push'/);assert.match(condition,/github.event_name == 'workflow_dispatch'/);
 assert.doesNotMatch(condition,/pull_request/);assert.match(condition,/github.ref == 'refs\/heads\/main/);
 assert.ok(deploy.includes('environment:\n      name: production'));
});

test('production logging keeps only application records and previews disable telemetry',async()=>{
 const {experimental_readRawConfig}=await import('wrangler');
 const {readFile}=await import('node:fs/promises');
 const raw=experimental_readRawConfig({config:'wrangler.jsonc'}).rawConfig;
 assert.equal(raw.observability.enabled,true);assert.equal(raw.observability.head_sampling_rate,1);
 assert.equal(raw.observability.logs.invocation_logs,false);assert.equal(raw.observability.logs.enabled,true);
 assert.equal(raw.observability.redact_query_string,true);assert.equal(raw.observability.traces.enabled,false);
 const prepare=await readFile(new URL('../scripts/prepare-release.mjs',import.meta.url),'utf8');
 assert.match(prepare,/observability:\{enabled:false\}/);
 assert.doesNotMatch(prepare,/\['build'[^\n]+observability/);
});

test('logger failure cannot replace controlled errors or existing 5xx response',async()=>{
 const original=console.error;console.error=()=>{throw Error('logger unavailable');};
 try {
  for(const handler of [async()=>{throw Error('PRIVATE provider error');},async()=>new Response('known failure',{status:502})]){
   const response=await protectRequest(handler)(request(),{});
   assert.ok([502,503].includes(response.status));assert.equal(response.headers.get('Cache-Control'),'no-store');assert.ok(response.headers.get('X-Request-ID'));assert.doesNotMatch(await response.text(),/PRIVATE|logger unavailable/);
  }
 }finally{console.error=original;}
});

test('production version-preview URLs remain disabled in release preparation',async()=>{
 const {experimental_readRawConfig}=await import('wrangler');
 const {readFile}=await import('node:fs/promises');
 const raw=experimental_readRawConfig({config:'wrangler.jsonc'}).rawConfig;
 assert.equal(raw.preview_urls,false);
 const prepare=await readFile(new URL('../scripts/prepare-release.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(prepare,/\['build'[^\n]+preview_urls/);
});
