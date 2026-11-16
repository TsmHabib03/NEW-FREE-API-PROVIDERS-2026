/* Anonymous adapter for the same-origin Vercel HTTPS event receiver.
   No cookies, identifiers, raw search, referral codes, page URLs or stored events. */
(() => {
  window.DIRECTORY_ANALYTICS ??= { endpoint: '/api/events' };
  const events = new Set(['provider_click','category_expand','category_nav','filter_toggle']);
  const actions = new Set(['details','docs','signup','install','resource']);
  const placements = new Set(['pinned','new','category','spotlight','modal']);
  const track = (event, props={}) => {
    const config=window.DIRECTORY_ANALYTICS;
    if (!config?.endpoint || !events.has(event) || navigator.globalPrivacyControl || navigator.doNotTrack==='1' || window.doNotTrack==='1') return;
    let endpoint; try { endpoint=new URL(config.endpoint,location.origin); if(endpoint.protocol!=='https:' || endpoint.origin!==location.origin) return; } catch {return;}
    const safe={orderVersion:window.Adapters?.orderVersion};
    if (event==='provider_click') {
      const p=window.PROVIDERS.find(p=>p.id===props.providerId);
      if(!p || !actions.has(props.action) || !placements.has(props.placement)) return;
      Object.assign(safe,{providerId:p.id,action:props.action,placement:props.placement,category:p.directorySection});
    } else if (event.startsWith('category_')) {
      if(!window.Adapters.sections.some(s=>s.key===props.category)) return;
      safe.category=props.category; if(event==='category_expand') safe.expanded=props.expanded===true;
    } else {
      if(!['noCard','install','credits','category','status','protocol'].includes(props.key)) return;
      Object.assign(safe,{key:props.key,active:props.active===true});
    }
    try { Promise.resolve(fetch(endpoint.href,{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({event,properties:safe})})).catch(()=>{}); } catch { /* Never block navigation. */ }
  };
  window.DirectoryAnalytics={track};
})();
