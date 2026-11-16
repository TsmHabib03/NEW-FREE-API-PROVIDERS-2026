/* Evidence-derived directory ordering. Similar software never affects rank. */
(() => {
  const providers = window.PROVIDERS || [];
  const PINNED = ['pixrouter', 'agentrouter', 'tokenforge', 'artbloom'];
  const definitions = [
    ['recurring', 'Recurring free offers', 'Recurring free', 'Documented recurring allowances. Check each provider’s conditions.'],
    ['signup', 'Signup credits', 'Signup credits', 'One-time credits with documented limits.'],
    ['conditional', 'Conditional / community free', 'Conditional free', 'Rewards, eligibility or community conditions apply.'],
    ['installed', 'Installed coding tools', 'Install needed', 'Coding apps and terminal agents that need installation.'],
    ['roleplay', 'Roleplay gateways', 'Roleplay', 'Gateways focused on roleplay.'],
    ['paid', 'Paid / free allowance unconfirmed', 'Paid / unconfirmed', 'Paid routes or no confirmed free inference allowance.'],
    ['bundles', 'Paid subscription bundles', 'Subscriptions', 'Paid subscription bundles.'],
    ['gateways', 'More API gateways: terms need evidence', 'More gateways', 'Public gateways whose free allowance needs more evidence.'],
    ['marketplace', 'Shared quota marketplace', 'Marketplace', 'Shared quota marketplaces with their own conditions.'],
    ['resources', 'Cloud AI apps / resources', 'Apps & resources', 'Cloud apps and resources rather than hosted API gateways.'],
    ['review', 'Needs review', 'Needs review', 'Unresolved signup, catalog or offer evidence.'],
    ['disabled', 'Disabled', 'Disabled', 'Retained records with disabled outbound signup actions.']
  ];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const isOff = p => p.status === 'off';
  const isLive = p => p.status === 'live';
  const isCaveat = p => ['review', 'auth', 'restricted'].includes(p.status);
  const statusLabel = p => ({off:'Disabled', review:'Needs review', auth:'Login issue', restricted:'Restricted', live:'Site live'}[p.status] || 'Unverified');
  const pins = PINNED.map(id => providers.find(p => p.id === id)).filter(Boolean);
  const sections = definitions.map(([key, sourceTitle, title, description]) => ({key, sourceTitle, title, description, archived:['review','disabled'].includes(key), items:providers.filter(p => !PINNED.includes(p.id) && p.directorySection === sourceTitle).sort((a,b) => a.rank-b.rank || a.name.localeCompare(b.name))}));
  const canonical = [...pins, ...sections.flatMap(s => s.items)];
  const addedTime = p => Date.parse(p.addedAt && `${p.addedAt}T00:00:00+08:00`);
  const checked = p => p.check?.level === 'checked' && p.check.siteLive === true && p.check.signupExists === true && p.check.termsDocumented === true && !!p.check.terms && !!p.check.sources?.length && Number.isFinite(Date.parse(p.check.checkedAt));
  const isNew = (p, now=Date.now()) => isLive(p) && !PINNED.includes(p.id) && checked(p) && Date.parse(p.check.checkedAt) <= now && now-addedTime(p) >= 0 && now-addedTime(p) < 14*864e5;
  const newItems = (now=Date.now()) => providers.filter(p => isNew(p,now)).sort((a,b) => addedTime(b)-addedTime(a) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)).slice(0,5);
  const verified = (p, now=Date.now()) => isLive(p) && p.verification?.accountAccess === true && p.verification?.inferenceSuccess === true && !!p.verification?.source && now-Date.parse(p.verification.verifiedAt) >= 0 && now-Date.parse(p.verification.verifiedAt) < 30*864e5;
  const weekStart = now => { const local=new Date(now+8*36e5); local.setUTCHours(0,0,0,0); local.setUTCDate(local.getUTCDate()-((local.getUTCDay()+6)%7)); return local.getTime()-8*36e5; };
  const spotlight = (now=Date.now()) => { const fresh=new Set(newItems(now).map(p=>p.id)); const pool=sections.filter(s=>!s.archived).flatMap(s=>s.items.slice(6)).filter(p=>verified(p,now) && !fresh.has(p.id)); return pool.length ? pool[Math.floor(weekStart(now)/(7*864e5))%pool.length] : null; };
  const quickMatch = (p,key) => key==='noCard' ? p.noCard===true : key==='install' ? p.installNeeded===true : key==='credits' ? p.signupCredit===true || p.freeShape==='free-tier' : false;
  const categories = p => [p.serviceType || 'Not documented'];
  const authTypes = p => p.authType ? [].concat(p.authType) : ['unknown'];
  const authLabel = key => ({'api-key':'API Key',oauth:'OAuth',none:'No Auth',unknown:'Not documented'}[key] || key);
  const filterValues = (p,key) => key==='category' ? categories(p) : key==='status' ? [p.status] : key==='auth' ? authTypes(p) : p.protocol || [];
  const filters = [
    {key:'category',title:'Service type',options:[...new Set(providers.flatMap(categories))].sort().map(value=>({value,label:value}))},
    {key:'status',title:'Status',options:['live','auth','review','off'].map(value=>({value,label:statusLabel({status:value})}))},
    {key:'protocol',title:'Client routes',options:[{value:'anthropic',label:'Anthropic / Claude Code'},{value:'openai',label:'OpenAI / Codex'}]}
  ];
  const haystack = p => [p.name,p.id,p.blurb,p.offer,p.serviceType,p.directorySection,...(p.models || []),...(p.badges || [])].join(' ').toLowerCase();
  const matches = (p,query='',quick=new Set(),filters={}) => query.toLowerCase().trim().split(/\s+/).filter(Boolean).every(t=>haystack(p).includes(t)) && [...quick].every(key=>quickMatch(p,key)) && Object.entries(filters).every(([key,values])=>!values.size || filterValues(p,key).some(v=>values.has(v)));
  const metrics = p => [['requestsPerMinute','Req/Min','',Infinity],['latencyMs','Latency',' ms',Infinity],['uptimePercent','Uptime %','%',100]].map(([key,label,unit,max])=>{const n=p.metrics?.[key]; const value=typeof n==='number' && Number.isFinite(n) && n>=0 && n<=max ? n : null; return {key,label,value,display:value===null?'Not listed':value.toLocaleString('en-US')+unit};});
  window.Adapters = {providers,PINNED,pins,sections,canonical,orderVersion:'2026-11-16-v2',esc,isOff,isLive,isCaveat,isRestricted:p=>p.status==='restricted',isAuth:p=>p.status==='auth',statusLabel,isReturned:p=>isLive(p)&&!!p.returnedAt,checked,verified,isNew,newItems,spotlight,weekStart,addedTime,quickMatch,matches,filters,filterValues,categories,authTypes,authLabel,docsUrl:p=>p.docsUrl||p.guide||'setup.html',kindLabel:p=>p.serviceType||'',logo:p=>p.logo||'assets/gorouterlogo.png',metrics,features:p=>[['Data format',p.dataFormat||'Not documented'],['Rate limit',p.rateLimit||'Not documented']],stats:{live:providers.filter(isLive).length,total:providers.length},hasProto:(p,k)=>(p.protocol||[]).includes(k),hasFlag:(p,k)=>(p.flags||[]).includes(k)};
})();
