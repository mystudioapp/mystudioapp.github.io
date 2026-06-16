// v1781639213913
// ManiPro Features v1.0 - Comissao, Dashboard, Acesso Profissional
(function(){
// Funcao global chamada pelo onclick dos botoes Editar profissional
window._doEditBarber = function(id){
  var d = window._barbersData && window._barbersData[id];
  if(d) {
    editBarber(d.id, d.name, d.specialty, d.commission_pct);
  } else {
    if(window.db && window.S && S.shopId){
      db.from('barbers').select('*').eq('id',id).maybeSingle().then(function(r){
        if(r&&r.data) editBarber(r.data.id, r.data.name||'', r.data.specialty||'', r.data.commission_pct||0);
      });
    }
  }
};

var featReady = false;

// Observe changes to barb-cfg and re-render with commission + access buttons
var barbObserver = new MutationObserver(function(mutations){
  mutations.forEach(function(m){
    if(m.target.id === "barb-cfg" && m.addedNodes.length > 0 && !m.target._featProcessed){
      m.target._featProcessed = true;
      setTimeout(function(){ enhanceBarbList(); m.target._featProcessed = false; }, 50);
    }
  });
});

function startObserving(){
  var el = document.getElementById("barb-cfg");
  if(el) barbObserver.observe(el, {childList: true});
}

async function enhanceBarbList(){
  if(!window.db || !window.S || !S.shopId) return;
  var el = document.getElementById("barb-cfg");
  if(!el || !el.children.length) return;
  var r1 = await db.from("barbers").select("id,name,specialty,commission_pct").eq("shop_id", S.shopId).order("name");
  var barbers = r1.data || [];
  if(!window._barbersData) window._barbersData={};
  barbers.forEach(function(b){ window._barbersData[b.id]={id:b.id,name:b.name||"",specialty:b.specialty||"",commission_pct:b.commission_pct||0}; });
  var items = el.querySelectorAll(".ci");
  items.forEach(function(item, idx){
    if(item.getAttribute("data-enhanced")==="1") return;
    item.setAttribute("data-enhanced","1");
    var b = barbers[idx];
    if(!b) return;
    var sub = item.querySelector(".cits");
    if(sub && !sub.textContent.includes("Comiss")) {
      sub.textContent = (b.specialty||"") + " \u2022 Comiss\u00e3o: " + (b.commission_pct||0) + "%";
    }
    if(!item.querySelector(".btn-edit-barber")){
      var btn = document.createElement("button");
      btn.className = "btn-edit-barber";
      btn.innerHTML = "Editar";
      btn.setAttribute("style","background:var(--lilac);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-weight:700;touch-action:manipulation");
      btn.setAttribute("onclick","window._doEditBarber('"+b.id+"')");
      var togDiv = item.querySelector(".tog");
      if(togDiv && togDiv.parentNode) togDiv.parentNode.insertBefore(btn, togDiv);
      else item.appendChild(btn);
    }
  });
}

// === FUNCTIONS ===
window.addBarber = function(){
  var _as3=document.getElementById("brb-access-section");if(_as3)_as3.style.display="none";
  if(!document.getElementById("mod-barber")){ injectUI(); if(!document.getElementById("mod-barber")) return; }
  document.getElementById("brb-name").value="";
  document.getElementById("brb-spec").value="";
  document.getElementById("brb-comm").value="0";
  document.getElementById("brb-comm-val").textContent="0";
  document.getElementById("brb-edit-id").value="";
  document.getElementById("mod-barber-title").textContent="Adicionar Profissional";
  openMod("mod-barber");
};

window.editBarber = function(id,name,spec,comm){
  if(!document.getElementById("mod-barber")){ injectUI(); }
  if(!document.getElementById("mod-barber")) return;
  document.getElementById("brb-name").value=name||"";
  document.getElementById("brb-spec").value=spec||"";
  document.getElementById("brb-comm").value=comm||0;
  document.getElementById("brb-comm-val").textContent=comm||0;
  document.getElementById("brb-edit-id").value=id;
  document.getElementById("mod-barber-title").textContent="Editar Profissional";
  var accSec=document.getElementById("brb-access-section");
  if(!accSec){
    var md=document.querySelector("#mod-barber .msh");
    if(md){
      accSec=document.createElement("div");
      accSec.id="brb-access-section";
      accSec.innerHTML='<div style="border-top:1px solid rgba(155,89,182,.3);margin-top:12px;padding-top:12px"><div style="font-size:13px;font-weight:700;color:var(--lilac);margin-bottom:8px">Acesso da Profissional</div><div class="fg"><label class="fl">Nova senha (vazio = manter)</label><input class="fi" id="brb-access-pwd" type="text" placeholder="Min 6 caracteres"></div></div>';
      var sb=md.querySelector("button");
      if(sb)md.insertBefore(accSec,sb);else md.appendChild(accSec);
    }
  }
  if(accSec)accSec.style.display="block";
  var pwdF=document.getElementById("brb-access-pwd");if(pwdF)pwdF.value="";
  if(typeof openMod==="function")openMod("mod-barber");
  else{var m=document.getElementById("mod-barber");if(m)m.classList.add("open");}
};

window.filterDash = async function(period){
  document.querySelectorAll(".fbtn").forEach(function(b){b.classList.remove("active");});
  var btn=document.getElementById("fd-"+period);if(btn)btn.classList.add("active");
  var cd=document.getElementById("dash-period-custom");
  if(period==="custom")cd.style.display="block";else cd.style.display="none";
  var now=new Date(),from,to=now.toISOString().split("T")[0];
  if(period==="week")from=new Date(now-7*86400000).toISOString().split("T")[0];
  else if(period==="biweek")from=new Date(now-14*86400000).toISOString().split("T")[0];
  else if(period==="month")from=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split("T")[0];
  else if(period==="year")from=new Date(now.getFullYear(),0,1).toISOString().split("T")[0];
  else if(period==="custom"){from=document.getElementById("dash-from").value;to=document.getElementById("dash-to").value;if(!from||!to){document.getElementById("dash-profit-result").innerHTML="Selecione as datas.";return;}}
  try{
    var r=await db.from("appointments").select("service_price,barber_name,barber_id,status").gte("appointment_date",from).lte("appointment_date",to).eq("shop_id",S.shopId).in("status",["done","executed","finished"]);
    var appts=r.data||[];
    var r2=await db.from("barbers").select("id,name,commission_pct").eq("shop_id",S.shopId);
    var bm={};(r2.data||[]).forEach(function(b){bm[b.id]={name:b.name,pct:Number(b.commission_pct)||0};});
    var total=appts.reduce(function(s,a){return s+Number(a.service_price||0);},0);
    var cb={};
    appts.forEach(function(a){var bid=a.barber_id||"x";if(!cb[bid])cb[bid]={name:a.barber_name||"?",total:0,comm:0,pct:0};var p=Number(a.service_price||0);cb[bid].total+=p;var pct=bm[bid]?bm[bid].pct:0;cb[bid].pct=pct;cb[bid].comm+=p*(pct/100);});
    var tc=Object.values(cb).reduce(function(s,b){return s+b.comm;},0);
    var liq=total-tc;
    var h="<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px'><div style='background:var(--dk3);border-radius:8px;padding:12px;text-align:center'><div style='font-size:11px;color:var(--txl)'>Receita</div><div style='font-size:18px;font-weight:700;color:var(--lilac)'>"+fmt(total)+"</div></div><div style='background:var(--dk3);border-radius:8px;padding:12px;text-align:center'><div style='font-size:11px;color:var(--txl)'>Lucro</div><div style='font-size:18px;font-weight:700;color:#27AE60'>"+fmt(liq)+"</div></div></div>";
    h+="<div style='font-weight:600;font-size:13px;margin-bottom:8px'>Comiss\u00f5es por Profissional:</div>";
    var ls=Object.values(cb).sort(function(a,b){return b.comm-a.comm;});
    if(!ls.length)h+="<div style='color:var(--txl);font-size:12px'>Nenhum atendimento no per\u00edodo.</div>";
    else ls.forEach(function(b){h+="<div style='display:flex;justify-content:space-between;padding:8px;background:var(--dk3);border-radius:6px;margin-bottom:4px'><div><b>"+b.name+"</b> <span style='color:var(--txl);font-size:11px'>("+b.pct+"%)</span></div><div style='text-align:right'><div style='font-weight:600;color:var(--lilac)'>"+fmt(b.comm)+"</div><div style='font-size:10px;color:var(--txl)'>de "+fmt(b.total)+"</div></div></div>";});
    h+="<div style='margin-top:10px;padding-top:10px;border-top:1px solid var(--dk4);display:flex;justify-content:space-between;font-size:12px'><span>Total comiss\u00f5es:</span><span style='font-weight:700;color:#E74C3C'>-"+fmt(tc)+"</span></div>";
    document.getElementById("dash-profit-result").innerHTML=h;
  }catch(e){document.getElementById("dash-profit-result").innerHTML="Erro: "+e.message;}
};

// === OVERRIDE DASHBOARD FOR PROFESSIONAL ===
async function overrideLoadDashForBarber(){
  var myBid=window.S&&window.S.barberUserId;
  if(!myBid)return;
  window.loadDash = async function(){
    var td=new Date().toISOString().split('T')[0];
    var el=document.getElementById('td-lbl');
    if(el)el.textContent='Hoje '+new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
    try{
      var r1=await db.from('appointments').select('*').eq('appointment_date',td).eq('shop_id',S.shopId).eq('barber_id',myBid).neq('status','cancelled').order('appointment_time');
      var ta=r1.data||[];
      var monthStart=td.slice(0,7)+'-01';
      var r2=await db.from('appointments').select('service_price,status').gte('appointment_date',monthStart).eq('shop_id',S.shopId).eq('barber_id',myBid).neq('status','cancelled');
      var ma=r2.data||[];
      var brR=await db.from('barbers').select('commission_pct').eq('id',myBid).maybeSingle();
      var pct=(brR&&brR.data)?Number(brR.data.commission_pct)||0:0;
      var tc=ta.length;
      var tr=ta.filter(function(a){return a.status==='done'||a.status==='finished';}).reduce(function(s,a){return s+Number(a.service_price||0)*(pct/100);},0);
      var mc=ma.length;
      var mr=ma.filter(function(a){return a.status==='done'||a.status==='finished';}).reduce(function(s,a){return s+Number(a.service_price||0)*(pct/100);},0);
      var stToday=document.getElementById('st-today');if(stToday)stToday.textContent=tc;
      var stRtd=document.getElementById('st-rtd');if(stRtd)stRtd.textContent=fmt(tr);
      var stMonth=document.getElementById('st-month');if(stMonth)stMonth.textContent=mc;
      var stRm=document.getElementById('st-rm');if(stRm)stRm.textContent=fmt(mr);
      document.querySelectorAll('.sl').forEach(function(l){
        if(l.textContent.includes('Receita hoje')||l.textContent.includes('Comissao hoje'))l.textContent='Comiss\u00e3o hoje';
        if(l.textContent.includes('Receita m')||l.textContent.includes('Comissao m'))l.textContent='Comiss\u00e3o m\u00eas';
        if(l.textContent==='Hoje'||l.textContent==='Meus hoje')l.textContent='Meus hoje';
        if(l.textContent==='Este m\u00eas'||l.textContent==='Meus no m\u00eas')l.textContent='Meus no m\u00eas';
      });
      var dl=document.getElementById('dash-list');
      if(dl){
        if(ta.length>0){dl.innerHTML=ta.map(function(a){return typeof agItemHTML==='function'?agItemHTML(a):'';}).join('');}
        else{dl.innerHTML='<div style="text-align:center;padding:30px;color:var(--txl)">Nenhum agendamento seu hoje.</div>';}
      }
      // Minhas Comissoes section
      var brNameR=await db.from('barbers').select('name,commission_pct').eq('id',myBid).maybeSingle();
      var bName=(brNameR&&brNameR.data)?brNameR.data.name:'';
      var bPct=(brNameR&&brNameR.data)?Number(brNameR.data.commission_pct)||0:0;
      var comSec=document.getElementById('barber-dash-section');
      if(!comSec){comSec=document.createElement('div');comSec.id='barber-dash-section';comSec.style.padding='0 20px 16px';var dlParent=dl.parentNode;dlParent.insertBefore(comSec,dl);}
      var encR=await db.from('appointments').select('service_price,appointment_date,service_name').eq('barber_id',myBid).eq('shop_id',S.shopId).in('status',['finished']).gte('appointment_date',monthStart);
      var encData=encR.data||[];
      var totalEnc=encData.reduce(function(s,a){return s+Number(a.service_price||0);},0);
      var myComm=totalEnc*(bPct/100);
      var comHtml='<div style="background:var(--dk2);border-radius:12px;padding:16px">';
      comHtml+='<div style="font-weight:700;font-size:16px;color:var(--lilac);margin-bottom:14px">\uD83D\uDCB0 Minhas Comiss\u00f5es - '+bName+'</div>';
      comHtml+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
      comHtml+='<div style="background:var(--dk3);border-radius:8px;padding:14px;text-align:center"><div style="font-size:11px;color:var(--txl)">Comiss\u00e3o ('+bPct+'%)</div><div style="font-size:20px;font-weight:700;color:var(--lilac)">'+fmt(myComm)+'</div></div>';
      comHtml+='<div style="background:var(--dk3);border-radius:8px;padding:14px;text-align:center"><div style="font-size:11px;color:var(--txl)">Atendimentos (m\u00eas)</div><div style="font-size:20px;font-weight:700;color:#27AE60">'+encData.length+'</div></div>';
      comHtml+='</div>';
      if(encData.length>0){
        comHtml+='<div style="font-size:12px;color:var(--txl);margin-bottom:8px">Servi\u00e7os encerrados:</div>';
        encData.forEach(function(a){comHtml+='<div style="display:flex;justify-content:space-between;padding:6px;background:var(--dk3);border-radius:6px;margin-bottom:3px"><div style="font-size:12px"><b>'+a.service_name+'</b><br><span style="color:var(--txl);font-size:10px">'+new Date(a.appointment_date+"T12:00").toLocaleDateString("pt-BR")+'</span></div><div style="text-align:right"><div style="font-weight:600;color:var(--lilac);font-size:12px">'+fmt(Number(a.service_price||0)*(bPct/100))+'</div></div></div>';});
        comHtml+='<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(155,89,182,.3);display:flex;justify-content:space-between;font-size:13px"><b>Total:</b><span style="font-weight:700;color:var(--lilac)">'+fmt(myComm)+'</span></div>';
      } else { comHtml+='<div style="color:var(--txl);font-size:12px;padding:10px;text-align:center">Nenhum encerrado este m\u00eas.</div>'; }
      // Period filter
      comHtml+='<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(155,89,182,.2)">';
      comHtml+='<div style="font-weight:700;font-size:14px;color:var(--lilac);margin-bottom:10px">\uD83D\uDCCA Consultar por Per\u00edodo</div>';
      comHtml+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">';
      comHtml+='<button class="fbtn" onclick="filterBarberDash('+Q+'week'+Q+')">Semanal</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash('+Q+'biweek'+Q+')">Quinzenal</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash('+Q+'month'+Q+')">Mensal</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash('+Q+'year'+Q+')">Anual</button>';
      comHtml+='<button class="fbtn" onclick="filterBarberDash('+Q+'custom'+Q+')">Per\u00edodo</button>';
      comHtml+='</div>';
      comHtml+='<div id="barber-period-custom" style="display:none;margin-bottom:10px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fg"><label class="fl">De</label><input type="date" class="fi" id="bp-from"></div><div class="fg"><label class="fl">At\u00e9</label><input type="date" class="fi" id="bp-to"></div></div><button class="btn btn-out" onclick="filterBarberDash('+Q+'custom'+Q+')" style="margin-top:8px;font-size:12px;padding:8px">Consultar</button></div>';
      comHtml+='<div id="barber-period-result" style="font-size:12px;color:var(--txl)">Selecione um per\u00edodo acima.</div>';
      comHtml+='</div></div>';
      comSec.innerHTML=comHtml;
    }catch(e){console.warn('loadDash barber error:',e);}
  };
  window.loadDash();
}

// === FILTRO PERIODO DO PROFISSIONAL ===
window.filterBarberDash = async function(period){
  var btns=document.querySelectorAll('#barber-dash-section .fbtn');
  btns.forEach(function(b){b.classList.remove('active');});
  if(event&&event.target)event.target.classList.add('active');
  var cd=document.getElementById('barber-period-custom');
  if(cd){cd.style.display=(period==='custom')?'block':'none';}
  var now=new Date(),from,to=now.toISOString().split('T')[0];
  if(period==='week')from=new Date(now-7*86400000).toISOString().split('T')[0];
  else if(period==='biweek')from=new Date(now-14*86400000).toISOString().split('T')[0];
  else if(period==='month')from=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
  else if(period==='year')from=new Date(now.getFullYear(),0,1).toISOString().split('T')[0];
  else if(period==='custom'){from=document.getElementById('bp-from').value;to=document.getElementById('bp-to').value;if(!from||!to){document.getElementById('barber-period-result').innerHTML='Selecione as datas.';return;}}
  var resultEl=document.getElementById('barber-period-result');
  if(!resultEl)return;
  resultEl.innerHTML='<div style="text-align:center;padding:10px"><div class="spin"></div></div>';
  try{
    var bid=S.barberUserId;
    if(!bid){resultEl.innerHTML='Erro: profissional n\u00e3o identificada.';return;}
    var r=await db.from('appointments').select('service_price,service_name,appointment_date,status').eq('barber_id',bid).gte('appointment_date',from).lte('appointment_date',to).eq('shop_id',S.shopId).in('status',['done','finished']);
    var appts=r.data||[];
    var r2=await db.from('barbers').select('commission_pct').eq('id',bid).maybeSingle();
    var pct=Number((r2.data||{}).commission_pct)||0;
    var total=appts.reduce(function(s,a){return s+Number(a.service_price||0);},0);
    var comm=total*(pct/100);
    var count=appts.length;
    var h='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">';
    h+='<div style="background:var(--dk3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--txl)">Atendimentos</div><div style="font-size:18px;font-weight:700;color:var(--lilac)">'+count+'</div></div>';
    h+='<div style="background:var(--dk3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--txl)">Faturado</div><div style="font-size:14px;font-weight:700;color:#fff">'+fmt(total)+'</div></div>';
    h+='<div style="background:var(--dk3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--txl)">Comiss\u00e3o ('+pct+'%)</div><div style="font-size:18px;font-weight:700;color:#27AE60">'+fmt(comm)+'</div></div>';
    h+='</div>';
    if(appts.length>0){
      var svcMap={};
      appts.forEach(function(a){var sn=a.service_name||'Servi\u00e7o';if(!svcMap[sn])svcMap[sn]={count:0,total:0};svcMap[sn].count++;svcMap[sn].total+=Number(a.service_price||0);});
      h+='<div style="font-size:11px;color:var(--txl);margin-bottom:4px">Detalhamento:</div>';
      Object.keys(svcMap).forEach(function(sn){var s=svcMap[sn];h+='<div style="display:flex;justify-content:space-between;padding:5px 8px;background:var(--dk3);border-radius:6px;margin-bottom:3px;font-size:11px"><span>'+sn+' ('+s.count+'x)</span><span style="font-weight:600;color:var(--lilac)">'+fmt(s.total*(pct/100))+'</span></div>';});
      h+='<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(155,89,182,.2);display:flex;justify-content:space-between;font-size:12px"><b>Total comiss\u00e3o:</b><span style="font-weight:700;color:#27AE60">'+fmt(comm)+'</span></div>';
    } else {h+='<div style="color:var(--txl);font-size:11px;text-align:center">Nenhum atendimento encerrado neste per\u00edodo.</div>';}
    resultEl.innerHTML=h;
  }catch(e){resultEl.innerHTML='Erro: '+e.message;}
};

// === UI INJECTION ===
function injectUI(){
  // Modal Profissional
  if(!document.getElementById("mod-barber")){
    var d=document.createElement("div");d.className="mov";d.id="mod-barber";
    d.innerHTML='<div class="msh"><div class="mhd" onclick="closeMod(\x27mod-barber\x27)"></div><div class="mt" id="mod-barber-title">Adicionar Profissional</div><div class="fg"><label class="fl">Nome *</label><input class="fi" id="brb-name" placeholder="Nome"></div><div class="fg"><label class="fl">Especialidade</label><input class="fi" id="brb-spec" placeholder="Ex: Nail Designer"></div><div class="fg"><label class="fl">Comiss\u00e3o: <span id="brb-comm-val">0</span>%</label><input type="range" id="brb-comm" min="0" max="100" value="0" step="5" oninput="document.getElementById(\x27brb-comm-val\x27).textContent=this.value" style="width:100%;accent-color:var(--lilac)"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txl)"><span>0%</span><span>50%</span><span>100%</span></div></div><input type="hidden" id="brb-edit-id" value=""><button class="btn" onclick="saveBarber()" style="width:100%;margin-top:12px">Salvar</button></div>';
    document.body.appendChild(d);
  }
  // Modal Criar Acesso
  if(!document.getElementById("mod-barber-user")){
    var d2=document.createElement("div");d2.className="mov";d2.id="mod-barber-user";
    d2.innerHTML='<div class="msh"><div class="mhd" onclick="closeMod(\x27mod-barber-user\x27)"></div><div class="mt">Criar Acesso</div><div id="buser-barber-name" style="color:var(--lilac);font-weight:700;margin-bottom:12px"></div><div class="fg"><label class="fl">E-mail *</label><input class="fi" id="buser-email" type="email" placeholder="email@exemplo.com"></div><div class="fg"><label class="fl">Senha *</label><input class="fi" id="buser-pwd" type="text" placeholder="Min 6 caracteres"></div><input type="hidden" id="buser-barber-id" value=""><button class="btn" onclick="saveBarberUser()" style="width:100%;margin-top:8px">Criar acesso</button><div id="buser-count" style="font-size:11px;color:var(--txl);text-align:center;margin-top:8px"></div></div>';
    document.body.appendChild(d2);
  }
  // Dashboard filters - only for owner
  var dl=document.getElementById("dash-list");
  if(window.S&&S.role==='barber'){
    var profitSec=document.getElementById('dash-profit-section');
    if(profitSec)profitSec.style.display='none';
    return;
  }
  if(dl&&!document.getElementById("dash-profit-section")&&S.role!=='barber'){
    var sec=document.createElement("div");sec.id="dash-profit-section";sec.style.padding="0 20px 16px";
    sec.innerHTML='<div style="background:var(--dk2);border-radius:12px;padding:16px"><div style="font-weight:700;font-size:15px;color:var(--lilac);margin-bottom:12px">Lucros e Comiss\u00f5es</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"><button class="fbtn" onclick="filterDash(\x27week\x27)" id="fd-week">Semanal</button><button class="fbtn" onclick="filterDash(\x27biweek\x27)" id="fd-biweek">Quinzenal</button><button class="fbtn" onclick="filterDash(\x27month\x27)" id="fd-month">Mensal</button><button class="fbtn" onclick="filterDash(\x27year\x27)" id="fd-year">Anual</button><button class="fbtn" onclick="filterDash(\x27custom\x27)" id="fd-custom">Per\u00edodo</button></div><div id="dash-period-custom" style="display:none;margin-bottom:12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="fg"><label class="fl">De</label><input type="date" class="fi" id="dash-from"></div><div class="fg"><label class="fl">At\u00e9</label><input type="date" class="fi" id="dash-to"></div></div><button class="btn btn-out" onclick="filterDash(\x27custom\x27)" style="margin-top:8px;font-size:12px;padding:8px">Consultar</button></div><div id="dash-profit-result" style="font-size:13px;color:var(--txl)">Selecione um per\u00edodo.</div></div>';
    dl.parentNode.insertBefore(sec,dl);
  }
  // CSS for filter buttons (in case not already in main CSS)
  if(!document.getElementById("feat-css")){
    var st=document.createElement("style");st.id="feat-css";
    st.textContent=".fbtn{background:var(--dk3);border:1px solid var(--dk4);color:var(--txm);border-radius:50px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s}.fbtn.active,.fbtn:hover{background:var(--lilac);color:#fff;border-color:var(--lilac)}";
    document.head.appendChild(st);
  }
}

// === ROLE DETECTION ===
async function checkBarberRole(){
  try{
    var sess=await db.auth.getSession();
    if(!sess.data.session) return;
    var uid=sess.data.session.user.id;
    var shopCheck=await db.from("shops").select("id").eq("owner_id",uid).maybeSingle();
    if(shopCheck.data){S.role="owner";return;}
    var bCheck=await db.from("barber_users").select("barber_id").eq("user_id",uid).maybeSingle();
    if(bCheck.data){
      S.role="barber";
      S.barberUserId=bCheck.data.barber_id;
      // Hide owner-only tabs
      document.querySelectorAll(".ni").forEach(function(n){
        var oc=n.getAttribute("onclick")||"";
        if(oc.includes("'cfg'")||oc.includes("'svcs'")||oc.includes("'barbs'")||oc.includes("'clientes'"))n.style.display="none";
      });
      // Hide "Encerrar" button - profissional pode Confirmar/Cancelar/Concluir mas NAO Encerrar
      var obs=new MutationObserver(function(){
        document.querySelectorAll("button,a,[onclick]").forEach(function(el){
          var txt=(el.textContent||"").toLowerCase();
          var oc=(el.getAttribute("onclick")||"").toLowerCase();
          if(txt.includes("encerrar")||txt.includes("finalizar")||oc.includes("finished")||oc.includes("encerr")){
            el.style.display="none";
          }
        });
      });
      var app=document.getElementById("admin-app");
      if(app)obs.observe(app,{childList:true,subtree:true});
      // Override dashboard
      overrideLoadDashForBarber();
    }
  }catch(e){}
}

function applyBarberMode(){
  setTimeout(function(){
    document.querySelectorAll(".ni").forEach(function(n){
      var oc=n.getAttribute("onclick")||"";
      if(oc.includes("'cfg'")||oc.includes("'svcs'")||oc.includes("'barbs'")||oc.includes("'clientes'"))n.style.display="none";
    });
    var obs=new MutationObserver(function(){
      document.querySelectorAll("button,a,[onclick]").forEach(function(el){
        var txt=(el.textContent||"").toLowerCase();
        var oc=(el.getAttribute("onclick")||"").toLowerCase();
        if(txt.includes("encerrar")||txt.includes("finalizar")||oc.includes("finished")||oc.includes("encerr")){
          el.style.display="none";
        }
      });
    });
    var app=document.getElementById("admin-app");
    if(app)obs.observe(app,{childList:true,subtree:true});
  },300);
}

// === INIT ===
function init(){
  injectUI();
  startObserving();
  setTimeout(function(){if(S.shopId)enhanceBarbList();},2000);
  setTimeout(checkBarberRole, 3000);
}

var checkInterval = setInterval(function(){
  if(window.db && window.S && window.S.shopId){
    clearInterval(checkInterval);
    init();
    if(S.role === "barber") applyBarberMode();
  }
},500);

})();
