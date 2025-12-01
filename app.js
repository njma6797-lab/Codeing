/* app.js */
const DATA_URL = 'data.json';
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const favToggle = document.getElementById('favToggle');
const installBtn = document.getElementById('installBtn');
const embeddedScript = document.getElementById('embedded-data');
let allData = [];
let showFavs = false;
let deferredPrompt = null;

// Utility: encode tel (يحوّل # إلى %23)
const encodeTel = (code) => {
  if (!code) return '';
  let s = String(code).trim().replace(/\s+/g,'');
  s = s.replace(/#/g, '%23').replace(/\+/g, '%2B');
  return s;
};

// load data.json or fallback
async function loadData(){
  try {
    const res = await fetch(DATA_URL);
    if(!res.ok) throw new Error('fetch fail');
    const json = await res.json();
    return json;
  } catch(e){
    try {
      return JSON.parse(embeddedScript.textContent || '[]');
    } catch(err){
      return [];
    }
  }
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

function getFavs(){ try { return JSON.parse(localStorage.getItem('fav_codes')||'[]'); } catch(e){ return []; } }
function toggleFav(id){
  const favs = getFavs();
  const idx = favs.indexOf(id);
  if(idx===-1) favs.push(id); else favs.splice(idx,1);
  localStorage.setItem('fav_codes', JSON.stringify(favs));
}

function render(items){
  listEl.innerHTML = '';
  if(!items.length){
    document.getElementById('empty').classList.remove('hidden');
    return;
  } else { document.getElementById('empty').classList.add('hidden'); }

  const favs = getFavs();

  items.forEach(it=>{
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="badge ${escapeHtml(it.operator)}">${escapeHtml(it.operator || '')}</div>
      <h3>${escapeHtml(it.title)}</h3>
      <p class="desc">${escapeHtml(it.desc || '')}</p>
      <div class="row">
        <div class="code">${escapeHtml(it.code)}</div>
        <div class="actions">
          <button class="btn copy">نسخ</button>
          <a class="btn call" href="tel:${encodeTel(it.code)}">اتصال</a>
          <button class="btn fav">${favs.includes(it.id) ? '★' : '☆'}</button>
        </div>
      </div>
    `;
    // events
    card.querySelector('.copy').addEventListener('click', ()=> {
      copyText(it.code, card.querySelector('.copy'));
    });
    card.querySelector('.fav').addEventListener('click', ()=> {
      toggleFav(it.id);
      card.querySelector('.fav').textContent = getFavs().includes(it.id) ? '★' : '☆';
    });
    listEl.appendChild(card);
  });
}

function copyText(text, btn){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>{
      const prev = btn.textContent;
      btn.textContent = 'تم النسخ';
      setTimeout(()=> btn.textContent = prev, 1000);
    }).catch(()=> fallbackCopy(text, btn));
  } else fallbackCopy(text, btn);
}
function fallbackCopy(text, btn){
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); const prev = btn.textContent; btn.textContent='تم النسخ'; setTimeout(()=>btn.textContent=prev,1000); } catch(e){}
  document.body.removeChild(ta);
}

function applyFilters(op='all', q=''){
  q = (q||'').trim().toLowerCase();
  let results = allData.filter(it => {
    if(op && op !== 'all' && it.operator !== op) return false;
    if(showFavs && !getFavs().includes(it.id)) return false;
    if(!q) return true;
    return (it.title && it.title.toLowerCase().includes(q)) || (it.desc && it.desc.toLowerCase().includes(q)) || (it.code && it.code.toLowerCase().includes(q));
  });
  render(results);
}

// init
loadData().then(data=>{
  allData = Array.isArray(data) ? data : [];
  // replace embedded fallback so file:// users can still use
  document.getElementById('embedded-data').textContent = JSON.stringify(allData);
  applyFilters('all','');

  // nav buttons
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.addEventListener('click', ()=> {
      document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const op = b.dataset.op || 'all';
      applyFilters(op, searchEl.value);
    });
  });

  // search
  searchEl.addEventListener('input', ()=> {
    const active = document.querySelector('.nav-btn.active');
    const op = active ? active.dataset.op : 'all';
    applyFilters(op, searchEl.value);
  });

  // favorites toggle
  favToggle.addEventListener('click', ()=> {
    showFavs = !showFavs;
    favToggle.classList.toggle('active', showFavs);
    favToggle.textContent = showFavs ? 'عرض الكل' : 'المفضلات';
    const active = document.querySelector('.nav-btn.active');
    const op = active ? active.dataset.op : 'all';
    applyFilters(op, searchEl.value);
  });
});

// PWA install flow
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn.addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if(choice.outcome === 'accepted'){
    console.log('User accepted install');
  }
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// hide install btn if not supported
if (!window.matchMedia) {
  // nothing
}
if (!('BeforeInstallPromptEvent' in window) && !('onbeforeinstallprompt' in window)) {
  // show it anyway; browsers vary. Keep visible — browser will ignore if unsupported.
}

// small particles effect for cinematic feel
(function particles(){
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles=[];
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();
  function create(){
    particles = [];
    const count = Math.max(Math.floor(W/60), 30);
    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random()*W,
        y: Math.random()*H,
        r: Math.random()*1.8 + 0.4,
        vx: (Math.random()-0.5)*0.2,
        vy: (Math.random()*0.6)+0.1,
        alpha: Math.random()*0.6 + 0.15
      });
    }
  }
  create();
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      if(p.y > H+10){ p.y = -10; p.x = Math.random()*W; }
      if(p.x < -10) p.x = W+10;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
