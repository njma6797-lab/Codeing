// app.js - يعرض الشبكات والأكواد ويطبّق أزرار النسخ والاتصال وزر الخدمة/الموقع
async function loadData(){
  try{
    const res = await fetch('data.json');
    if(!res.ok) throw new Error('فشل تحميل data.json');
    return await res.json();
  }catch(e){
    console.error(e);
    alert('خطأ في تحميل البيانات (data.json). ارفع الملف على نفس المجلد.');
    return null;
  }
}

function $(sel){ return document.querySelector(sel) }
function create(tag, attrs={}, children=[]){
  const el = document.createElement(tag);
  for(const k in attrs){
    if(k === 'class') el.className = attrs[k];
    else if(k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.substring(2), attrs[k]);
    else el.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children)?children:[children]).flat().forEach(c=>{
    if(typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if(c) el.appendChild(c);
  });
  return el;
}

function copyText(text){
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=> alert('نُسخ: ' + text)).catch(()=> fallbackCopy(text));
  } else fallbackCopy(text);
}
function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); alert('نُسخ: ' + text); } catch(e){ alert('النسخ فشل — انسخ يدويًا: ' + text); }
  ta.remove();
}

function dial(code){
  const tel = 'tel:' + encodeURIComponent(code);
  window.location.href = tel;
}
function openSite(url){
  window.open(url, '_blank');
}

function applyServiceStyle(networkId){
  const callBtn = $('#cs-call');
  const siteBtn = $('#cs-site');
  callBtn.className = 'service-btn';
  siteBtn.className = 'service-btn';
  if(networkId === 'orange'){ callBtn.classList.add('orange'); siteBtn.classList.add('orange'); }
  if(networkId === 'vodafone'){ callBtn.classList.add('vodafone'); siteBtn.classList.add('vodafone'); }
  if(networkId === 'etisalat'){ callBtn.classList.add('etisalat'); siteBtn.classList.add('etisalat'); }
  if(networkId === 'we'){ callBtn.classList.add('we'); siteBtn.classList.add('we'); }
}

(async function init(){
  const data = await loadData();
  if(!data) return;

  // render network list (sidebar)
  const nl = $('#network-list');
  nl.innerHTML = '';
  data.networks.forEach(n=>{
    const btn = create('button',{class:'net-btn', onclick:()=> selectNetwork(n.id)}, n.displayName);
    nl.appendChild(btn);
  });

  // select first by default
  function selectNetwork(id){
    const network = data.networks.find(x=>x.id === id);
    if(!network) return;
    $('#network-title').textContent = network.displayName;
    const list = $('#codes-list');
    list.innerHTML = '';
    network.codes.forEach(item=>{
      const left = create('div',{class:'code-left'}, [
        create('div',{class:'code-text'}, item.code),
        create('div',{class:'code-desc'}, item.desc)
      ]);
      const copyBtn = create('button',{class:'action-btn copy', onclick:()=> copyText(item.code)}, 'نسخ');
      const callBtn = create('button',{class:'action-btn call', onclick:()=> dial(item.code)}, 'اتصال');
      const actions = create('div',{class:'card-actions'}, [copyBtn, callBtn]);
      const card = create('div',{class:'code-card'}, [left, actions]);
      list.appendChild(card);
    });

    // show service row and wire buttons
    const serviceRow = $('#service-row');
    serviceRow.hidden = false;
    applyServiceStyle(id);

    const csCall = $('#cs-call');
    const csSite = $('#cs-site');

    csCall.onclick = () => {
      if(network.customer && network.customer.number) dial(network.customer.number);
      else alert('رقم خدمة العملاء غير متوفر لهذه الشبكة');
    };
    csSite.onclick = () => {
      if(network.customer && network.customer.site) openSite(network.customer.site);
      else alert('الموقع الرسمي غير متوفر لهذه الشبكة');
    };
  }

  if(data.networks.length) selectNetwork(data.networks[0].id);
})();
