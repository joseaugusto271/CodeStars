/* =====================================================================
   1) CONFIGURAÇÃO DO SUPABASE  ←  PREENCHA AQUI
   Painel do Supabase → Project Settings → API
   - SUPABASE_URL: "Project URL"
   - SUPABASE_ANON_KEY: chave "anon public" (pode ficar no site: quem protege
     os dados são as regras RLS do schema.sql).
   NUNCA coloque a chave "service_role" aqui.
   ===================================================================== */
const SUPABASE_URL      = 'https://gapibowqqgujgflqxlcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcGlib3dxcWd1amdmbHF4bGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MjE0NTcsImV4cCI6MjEwNzM5NzQ1N30.QViz4fzlB4s7AJRbqduRvw9NhIHn9ULrW4NvL79eIYs';

const CONFIGURADO = !/SEU-PROJETO|COLE_AQUI/.test(SUPABASE_URL + SUPABASE_ANON_KEY);
// aceita a URL colada com sobras (ex.: terminada em /rest/v1/ ou com / no fim) e deixa só https://xxxx.supabase.co
const URL_LIMPA = SUPABASE_URL.trim().replace(/\/(rest|auth|storage)\/v1.*$/i, '').replace(/\/+$/, '');
const sb = (CONFIGURADO && window.supabase) ? window.supabase.createClient(URL_LIMPA, SUPABASE_ANON_KEY.trim()) : null;
const VOLTA_PARA = location.origin + location.pathname;   // para onde Google/e-mail devolvem o aluno

/* =====================================================================
   2) UTILIDADES
   ===================================================================== */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const plural = (n, um, varios) => n === 1 ? um : varios;
const rmov = matchMedia('(prefers-reduced-motion: reduce)').matches;

// com "zoom" no CSS a unidade vh também encolhe; por isso a altura da tela é calculada aqui
function ajustaAltura(){
  const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  document.documentElement.style.setProperty('--vh100', (innerHeight / z) + 'px');
}
ajustaAltura(); addEventListener('resize', ajustaAltura);

let tmAviso;
function aviso(t){ const a=$('aviso'); a.textContent=t; a.classList.add('on'); clearTimeout(tmAviso); tmAviso=setTimeout(()=>a.classList.remove('on'),3400); }

function contar(el, alvo, suf=''){
  const ini = +el.dataset.v || 0; el.dataset.v = alvo;
  if (rmov || ini === alvo){ el.textContent = alvo + suf; return; }
  const t0 = performance.now();
  (function f(t){ const p=Math.min((t-t0)/800,1); el.textContent=Math.round(ini+(alvo-ini)*p)+(p===1?suf:''); if(p<1) requestAnimationFrame(f); })(t0);
}

// destaque de cores simples para os trechos de código das lições
function realca(c){
  const e = String(c).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  return e.replace(/(&lt;[\s\S]*?&gt;)|("[^"\n]*"|'[^'\n]*')|\b(let|const|function|return|if|else|git)\b|(\.[\w-]+)(?=\s*\{)|([\w-]+)(?=:\s)/g,
    (m, tag, str, kw, sel, prop) => {
      if (tag)  return '<span class="k">'+tag+'</span>';
      if (str)  return '<span class="s">'+str+'</span>';
      if (kw)   return '<span class="k">'+kw+'</span>';
      if (sel)  return '<span class="k">'+sel+'</span>';
      if (prop) return '<span class="p">'+prop+'</span>';
      return m;
    });
}

// realce simples para blocos de código Python nas lições
function realcaPy(c){
  const e = String(c).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  return e.replace(/(#[^\n]*)|(f?"[^"\n]*"|f?'[^'\n]*')|\b(def|return|if|elif|else|for|in|while|and|or|not|True|False|None|print|range|len|import)\b/g,
    (m, com, str, kw) => com ? '<span class="p">' + com + '</span>' : str ? '<span class="s">' + str + '</span>' : '<span class="k">' + kw + '</span>');
}

// traduz os erros do Supabase para português
function traduz(err){
  const m = String((err && err.message) || err || '').toLowerCase();
  if (m.includes('invalid login'))                          return 'E-mail ou senha incorretos. Confira e tente de novo.';
  if (m.includes('email not confirmed'))                    return 'Falta confirmar seu e-mail. Procure o link na caixa de entrada (e no spam).';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Esse e-mail já tem conta. Tente entrar.';
  if (m.includes('same password') || m.includes('different from the old')) return 'A nova senha precisa ser diferente da atual.';
  if (m.includes('weak') || m.includes('pwned'))            return 'Essa senha é fraca demais. Misture letras, números e símbolos.';
  if (m.includes('at least') && m.includes('character'))    return 'A senha é curta demais.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) return 'Sem conexão com o servidor. Verifique sua internet.';
  if (err && err.code === 'P0001' && err.message)           return err.message;   // mensagens escritas no schema.sql
  return 'Algo deu errado. Tente de novo em instantes.';
}

/* =====================================================================
   3) TELAS
   ===================================================================== */
function telaDe(t){
  $('carregando').hidden = t !== 'carregando';
  $('telaLogin').hidden  = t !== 'login';
  $('telaApp').hidden    = t !== 'app';
  if (t !== 'app') document.documentElement.dataset.tema = 'escuro';
}
const VIEWS = ['painel','perfil','projetos','praticar','ranking','ajuda'];
let editorIniciado = false;
function vai(v){
  VIEWS.forEach(id => $(id).hidden = (id !== v));
  const aba = v;
  document.querySelectorAll('.tabs a[data-v]').forEach(a => {
    const on = a.dataset.v === aba; a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  if (v === 'projetos' && !editorIniciado){ editorIniciado = true; carregaProjeto(projAtual); }
  if (v === 'praticar') pintaPratica();
  if (v === 'ranking') carregaRankingGeral();
  if (v === 'ajuda') carregaMensagens();
  scrollTo(0,0);
}
document.querySelectorAll('a[data-v]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); vai(a.dataset.v); }));
document.querySelectorAll('.tabs a:not([data-v])').forEach(a => a.addEventListener('click', e => e.preventDefault()));
$('logoApp').addEventListener('click', e => { e.preventDefault(); vai('painel'); });

/* =====================================================================
   4) LOGIN / CRIAR CONTA / RECUPERAR SENHA  (Supabase Auth)
   ===================================================================== */
let modoAtual = 'entrar';
let recuperando = /type=recovery/.test(location.hash);
const TITULOS = {
  entrar:    ['Bem-vindo de volta!',        'Entrar e continuar'],
  criar:     ['Crie sua conta',             'Criar conta e começar'],
  recuperar: ['Recuperar senha',            'Enviar link de recuperação'],
  novasenha: ['Escolha uma nova senha',     'Salvar nova senha']
};
function limpaErros(){
  document.querySelectorAll('#telaLogin .erro').forEach(e => { e.classList.remove('on'); e.textContent=''; });
  document.querySelectorAll('#telaLogin input').forEach(i => i.classList.remove('invalido'));
  $('lgOk').classList.remove('on'); $('lgOk').textContent='';
}
function erroL(id, msg, campo){ const e=$(id); e.textContent=msg; e.classList.add('on'); if(campo) $(campo).classList.add('invalido'); }
function modo(m){
  modoAtual = m;
  document.querySelectorAll('#telaLogin [data-m]').forEach(el => { el.hidden = !el.dataset.m.split(' ').includes(m); });
  $('lgTitulo').textContent = TITULOS[m][0];
  $('lgEntrar').textContent = TITULOS[m][1];
  $('lgSenha').autocomplete = m === 'criar' ? 'new-password' : 'current-password';
  limpaErros();
}
document.querySelectorAll('[data-ir]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); modo(a.dataset.ir); }));
$('hdrEntrar').addEventListener('click', () => { modo('entrar'); $('lgEmail').focus(); });
$('hdrCriar').addEventListener('click',  () => { modo('criar');  $('lgNome').focus(); });

$('lgOlho').addEventListener('click', () => {
  const ver = $('lgSenha').type === 'password';
  ['lgSenha','lgNova','lgNova2'].forEach(i => $(i).type = ver ? 'text' : 'password');
  $('lgRisco').style.display = ver ? 'block' : 'none';
  $('lgOlho').setAttribute('aria-label', ver ? 'Ocultar senha' : 'Mostrar senha');
});
$('lgEmail').addEventListener('blur', () => {
  const v = $('lgEmail').value.trim();
  if (v && !okEmail(v)) erroL('lgErroEmail','Digite um e-mail válido, como voce@email.com.','lgEmail');
});

// mascote da tela de login
const estrela = $('estrela'), boca = $('boca'), olhos = $('olhos');
function anima(c){ estrela.classList.remove('pula','triste','gira'); void estrela.offsetWidth; estrela.classList.add(c); }
function feliz(){ boca.setAttribute('d','M40 57 Q50 70 60 57'); anima('pula'); }
function triste(){ boca.setAttribute('d','M42 64 Q50 57 58 64'); anima('triste'); }
estrela.addEventListener('click', () => anima('pula'));

$('lgGoogle').addEventListener('click', async () => {
  if (!sb) return erroL('lgErroGeral','Falta ligar o Supabase (veja o aviso acima).');
  limpaErros();
  const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: VOLTA_PARA } });
  if (error){ erroL('lgErroGeral', traduz(error)); triste(); }
});

$('lgForm').addEventListener('submit', async e => {
  e.preventDefault(); limpaErros();
  if (!sb) return erroL('lgErroGeral','Falta ligar o Supabase. Preencha SUPABASE_URL e SUPABASE_ANON_KEY no index.html.');
  const email = $('lgEmail').value.trim(), senha = $('lgSenha').value, nome = $('lgNome').value.trim();
  let ok = true;
  if (['entrar','criar','recuperar'].includes(modoAtual) && !okEmail(email)){ erroL('lgErroEmail','Digite um e-mail válido, como voce@email.com.','lgEmail'); ok = false; }
  if (modoAtual === 'criar' && !nome){ erroL('lgErroNome','Digite seu nome.','lgNome'); ok = false; }
  if (modoAtual === 'entrar' && !senha){ erroL('lgErroSenha','Digite sua senha.','lgSenha'); ok = false; }
  if (modoAtual === 'criar' && senha.length < 8){ erroL('lgErroSenha','A senha precisa ter pelo menos 8 caracteres.','lgSenha'); ok = false; }
  if (modoAtual === 'novasenha'){
    const n = $('lgNova').value, c = $('lgNova2').value;
    if (n.length < 8){ erroL('lgErroNova','A nova senha precisa ter pelo menos 8 caracteres.','lgNova'); ok = false; }
    else if (n !== c){ erroL('lgErroNova','A confirmação não é igual à nova senha.','lgNova2'); ok = false; }
  }
  if (!ok){ triste(); return; }

  const btn = $('lgEntrar'), textoBtn = btn.textContent;
  btn.disabled = true; btn.textContent = 'Aguarde…';
  try{
    if (modoAtual === 'entrar'){
      const { error } = await sb.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      feliz();                                   // onAuthStateChange abre o painel
    } else if (modoAtual === 'criar'){
      const { data, error } = await sb.auth.signUp({ email, password: senha, options:{ data:{ nome }, emailRedirectTo: VOLTA_PARA } });
      if (error) throw error;
      if (data.user && data.user.identities && data.user.identities.length === 0) throw { message:'User already registered' };
      if (!data.session){
        modo('entrar');
        $('lgOk').textContent = 'Quase lá! Enviamos um e-mail de confirmação. Clique no link dele para ativar sua conta e depois volte para entrar.';
        $('lgOk').classList.add('on');
      } else feliz();
    } else if (modoAtual === 'recuperar'){
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: VOLTA_PARA });
      if (error) throw error;
      $('lgOk').textContent = 'Se esse e-mail tiver conta, você vai receber um link para criar uma nova senha.';
      $('lgOk').classList.add('on');
    } else if (modoAtual === 'novasenha'){
      const { error } = await sb.auth.updateUser({ password: $('lgNova').value });
      if (error) throw error;
      recuperando = false; history.replaceState(null, '', location.pathname);
      const { data } = await sb.auth.getSession();
      if (data.session){ aviso('Senha alterada!'); await tratar('SIGNED_IN', data.session); }
      else { modo('entrar'); }
    }
  } catch (err){
    erroL('lgErroGeral', traduz(err)); triste();
  } finally {
    btn.disabled = false; if (btn.textContent === 'Aguarde…') btn.textContent = textoBtn;
  }
});

// efeitos da vitrine
(function(){
  const frases=["Todo bug é uma aula disfarçada.","Errar faz parte: compile, quebre, aprenda.","Um commit por dia mantém a sequência viva.","Código bom começa com uma pergunta boa."];
  $('frase').textContent = frases[Math.floor(Math.random()*frases.length)];
  const alvo = 'Bem-vindo de volta!")', el = $('digita'); let i = 0;
  (function t(){ if(i<=alvo.length){ el.textContent=alvo.slice(0,i++); setTimeout(t,90); } })();
  if (!rmov){
    const mira=[[-3,-2],[3,-2],[-3,2],[3,1],[0,-3],[0,0]];
    setInterval(()=>{ const [x,y]=mira[Math.floor(Math.random()*mira.length)]; olhos.style.transform=`translate(${x}px,${y}px)`; },1800);
    (function sozinha(){ setTimeout(()=>{ if(!document.hidden && !$('telaLogin').hidden && !estrela.matches(':hover')) anima(Math.random()<.5?'pula':'gira'); sozinha(); },4000+Math.random()*4000); })();
  }
})();

/* =====================================================================
   5) DADOS DO ALUNO (carregados do Supabase depois do login)
   ===================================================================== */
let usuario = null;           // usuário do Supabase Auth
let perfil  = null;           // linha da tabela profiles
let licoes  = [];             // catálogo (tabela licoes)
let feitas  = new Set();      // ids das lições concluídas
let resumo  = { estrelas:0, licoes_feitas:0, hoje:0, sequencia:0, semana_ini:null, dias_semana:[] };
let ranking = [];             // linhas de ranking_semana()
let projetos = [], projAtual = null, desafios = [], quizzes = [], praticaOk = true;
let projetosFinais = [], envios = [];   // projeto final de cada trilha e as notas do aluno
let moduloSel = null, licaoAberta = null;

function nomeInicial(u){
  const m = u.user_metadata || {};
  const n = (m.nome || m.full_name || m.name || (u.email||'').split('@')[0] || 'Estrela').trim();
  return n.slice(0,30) || 'Estrela';
}

async function carregaTudo(){
  const uid = usuario.id;
  const [p, l, pr, rs, rk, pj] = await Promise.all([
    sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
    sb.from('licoes').select('*').order('ordem'),
    sb.from('progresso_licoes').select('licao_id'),
    sb.rpc('meu_resumo'),
    sb.rpc('ranking_semana'),
    sb.from('projetos').select('*').order('criado_em')
  ]);
  for (const r of [p, l, pr, rs, rk, pj]) if (r.error) throw r.error;
  perfil = p.data;
  if (!perfil){            // se o gatilho do banco ainda não criou o perfil, cria agora
    const { data, error } = await sb.from('profiles').insert({ id: uid, nome: nomeInicial(usuario) }).select().single();
    if (error) throw error; perfil = data;
  }
  licoes = l.data; feitas = new Set(pr.data.map(x => x.licao_id));
  resumo = rs.data; ranking = rk.data || []; projetos = pj.data;
  // Praticar: se as tabelas ainda não existirem, o site continua funcionando e a página Praticar avisa
  const [dz, qz] = await Promise.all([ sb.from('desafios').select('*').order('ordem'), sb.from('quizzes').select('*').order('ordem') ]);
  praticaOk = !dz.error && !qz.error; desafios = dz.error ? [] : dz.data; quizzes = qz.error ? [] : qz.data;
  // Projeto final: se projeto-final.sql ainda não foi rodado, o site segue sem o projeto
  const [pf, pe] = await Promise.all([ sb.from('projetos_finais').select('*'), sb.from('projeto_final_envios').select('modulo,nota,aprovado,criado_em').order('criado_em', { ascending:false }) ]);
  projetosFinais = (pf.error || pe.error) ? [] : pf.data; envios = (pf.error || pe.error) ? [] : pe.data;
  if (!projetos.length) await criaProjeto('Meu primeiro projeto');
  projAtual = projetos.slice().sort((a,b) => b.atualizado_em.localeCompare(a.atualizado_em))[0];
}
async function recarregaResumo(){
  const [rs, rk] = await Promise.all([ sb.rpc('meu_resumo'), sb.rpc('ranking_semana') ]);
  if (rs.error) throw rs.error; if (rk.error) throw rk.error;
  resumo = rs.data; ranking = rk.data || [];
}

/* =====================================================================
   6) PAINEL: trilha, meta, ranking, chips
   ===================================================================== */
function modulos(){
  const mp = new Map();
  licoes.forEach(l => { if(!mp.has(l.modulo)) mp.set(l.modulo,{ id:l.modulo, nome:l.modulo_nome, l:[] }); mp.get(l.modulo).l.push(l); });
  const arr = [...mp.values()]; let travaDaqui = false;
  arr.forEach((m,i) => {
    m.feitas = m.l.filter(x => feitas.has(x.id)).length; m.total = m.l.length;
    m.proj = projetosFinais.find(p => p.modulo === m.id) || null;
    m.projOk = !m.proj || envios.some(e => e.modulo === m.id && e.aprovado);
    m.st = travaDaqui ? 'trava' : ((m.feitas === m.total && m.projOk) ? 'ok' : 'atual');
    if (m.st === 'atual') travaDaqui = true;
    m.prev = i > 0 ? arr[i-1].nome : null;
  });
  return arr;
}
function statusLicoes(m){
  let achou = false;
  return m.l.map(l => { if (feitas.has(l.id)) return 'ok'; if (m.st === 'trava') return 'trava'; if (!achou){ achou = true; return 'atual'; } return 'trava'; });
}
const ICO = (n, f) => '<svg class="i' + (f ? ' f' : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
const ICONE = { ok:'✓', atual:ICO('play', 1), trava:ICO('lock') };

function pintaPainel(){
  const mods = modulos();
  $('nomeSaudacao').textContent = perfil.nome;
  if (!mods.length){
    $('cTag').textContent = 'SEM LIÇÕES'; $('cTit').textContent = 'Nenhuma lição cadastrada ainda';
    $('cBtn').hidden = true; $('cPre').hidden = true; $('mods').innerHTML=''; $('lista').innerHTML='';
    $('fala').textContent = 'Rode o schema.sql no Supabase para cadastrar as lições.'; return;
  }
  if (!moduloSel || !mods.find(m => m.id === moduloSel && m.st !== 'trava'))
    moduloSel = (mods.find(m => m.st === 'atual') || mods[mods.length-1]).id;

  // card "Continuando"
  const prox = licoes.find(l => !feitas.has(l.id));
  const pend = mods.find(x => x.proj && x.st === 'atual' && x.feitas === x.total);
  const b0 = $('cBtn'); if (b0.dataset.h0 == null) b0.dataset.h0 = b0.innerHTML; b0.innerHTML = b0.dataset.h0;
  if (pend){
    $('cTag').textContent = 'PROJETO FINAL • ' + pend.nome.toUpperCase();
    $('cTit').textContent = pend.proj.titulo;
    $('cBarra').style.width = '100%'; $('cProg').setAttribute('aria-valuenow', 100);
    $('cMeta1').textContent = 'Todas as lições concluídas'; $('cMeta2').textContent = 'Passa com nota maior que ' + NOTA_MINIMA;
    $('cPre').hidden = true; b0.hidden = false; b0.textContent = 'Fazer o projeto'; b0.onclick = () => abreProjeto(pend.id);
  } else if (prox){
    const m = mods.find(x => x.id === prox.modulo), n = m.l.indexOf(prox) + 1, pct = Math.round(m.feitas / m.total * 100);
    $('cTag').textContent = 'CONTINUANDO • ' + m.nome.toUpperCase();
    $('cTit').textContent = 'Lição ' + n + ': ' + prox.titulo;
    $('cBarra').style.width = pct + '%'; $('cProg').setAttribute('aria-valuenow', pct);
    $('cMeta1').textContent = m.feitas + ' de ' + m.total + ' ' + plural(m.total,'lição','lições');
    $('cMeta2').textContent = '~' + prox.minutos + ' min · +' + prox.estrelas + '';
    $('cCod').innerHTML = realca(prox.preview || ''); $('cPre').hidden = false;
    $('cBtn').hidden = false; $('cBtn').onclick = () => abreLicao(prox.id);
  } else {
    $('cTag').textContent = 'TRILHA COMPLETA'; $('cTit').textContent = 'Você concluiu todas as lições!';
    $('cBarra').style.width = '100%'; $('cProg').setAttribute('aria-valuenow', 100);
    $('cMeta1').textContent = licoes.length + ' lições concluídas'; $('cMeta2').textContent = '';
    $('cPre').hidden = true; $('cBtn').hidden = true;
  }

  // módulos e lições
  $('mods').innerHTML = mods.map(m =>
    `<button class="mp ${m.st==='trava'?'trava':''} ${m.id===moduloSel?'on':''}" role="tab" aria-selected="${m.id===moduloSel}" data-k="${esc(m.id)}"><span>${ICONE[m.st]}</span>${esc(m.nome)}</button>`).join('');
  const m = mods.find(x => x.id === moduloSel), st = statusLicoes(m);
  $('lista').innerHTML = m.l.map((l,i) => {
    const s = st[i], fim = s==='ok' ? '<span class="pill ref">' + ICO('refresh') + ' REFAZER</span><span class="ic ok">✓</span>' : s==='atual' ? '<span class="ic go">→</span>' : '<span>' + ICO('lock') + '</span>';
    return `<button class="row ${s}" data-s="${s}" data-id="${esc(l.id)}"><span class="n">${String(i+1).padStart(2,'0')}</span><span class="t">${esc(l.titulo)}</span><span class="pill ${l.tipo}">${l.tipo==='a'?ICO('book')+' APRENDER':ICO('bolt')+' PRATICAR'}</span>${fim}</button>`;
  }).join('');

  $('lista').insertAdjacentHTML('beforeend', linhaProjeto(m));
  pintaMeta(); pintaRank(); pintaChips(); falaPadrao();
}
$('mods').addEventListener('click', e => {
  const b = e.target.closest('.mp'); if (!b) return;
  const m = modulos().find(x => x.id === b.dataset.k);
  if (m.st === 'trava'){ aviso('Conclua o ' + m.prev + ' para desbloquear o ' + m.nome + '.'); return; }
  moduloSel = m.id; pintaPainel();
});
$('lista').addEventListener('click', e => {
  const r = e.target.closest('.row'); if (!r) return;
  if (r.dataset.proj){ if (r.dataset.s === 'trava') aviso('Conclua todas as lições do módulo para liberar o projeto final.'); else abreProjeto(r.dataset.proj); return; }
  if (r.dataset.s === 'trava') aviso('Conclua a lição anterior para liberar esta.');
  else abreLicao(r.dataset.id);
});

function pintaMeta(){
  const m = perfil.meta_diaria, f = resumo.hoje, p = Math.min(f / m, 1) * 100;
  $('ringNum').textContent = f + '/' + m; $('ring').style.setProperty('--p', p + '%');
  $('metaTxt').textContent = f >= m ? 'Meta batida! A chama de hoje está acesa'
    : (m - f === 1 ? 'Mais uma lição e a chama de hoje fica acesa.' : 'Faltam ' + (m - f) + ' lições para bater a meta de hoje.');
  const L = ['S','T','Q','Q','S','S','D'], set = new Set(resumo.dias_semana || []);
  const ini = resumo.semana_ini ? new Date(resumo.semana_ini + 'T00:00:00Z') : null;
  $('dias').innerHTML = L.map((l,i) => {
    let on = false; if (ini) on = set.has(new Date(ini.getTime() + i*864e5).toISOString().slice(0,10));
    return `<span class="${on?'x':''}"><b>${on?ICO('flame',1):''}</b>${l}</span>`;
  }).join('');
}
function pintaRank(){
  $('rankList').innerHTML = ranking.map(r => {
    const pos = Number(r.posicao), med = pos + 'º';
    return `<li class="${r.eu?'eu':''}">${med} ${esc(r.nome)}${r.eu?' (você)':''} <em>${r.estrelas} ${ICO('star',1)}</em></li>`;
  }).join('') || '<li>Complete uma lição para entrar no ranking!</li>';
}
function pintaChips(){
  contar($('nSeq'), resumo.sequencia); contar($('nEst'), resumo.estrelas); contar($('nLic'), resumo.licoes_feitas);
  const eu = ranking.find(r => r.eu), temPos = eu && eu.estrelas > 0;
  $('nRank').textContent = temPos ? Number(eu.posicao) + 'º' : '—';
  const set = (id, txt) => { $(id).setAttribute('aria-label', txt); $(id).title = txt; };
  set('chSeq', resumo.sequencia + ' ' + plural(resumo.sequencia,'dia seguido','dias seguidos'));
  set('chEst', resumo.estrelas + ' ' + plural(resumo.estrelas,'estrela','estrelas'));
  set('chLic', resumo.licoes_feitas + ' ' + plural(resumo.licoes_feitas,'lição feita','lições feitas'));
  set('chRank', temPos ? eu.posicao + 'º no ranking da semana' : 'Sem posição no ranking ainda');
}

/* mascote do painel */
const mas = $('mascote'); let fi = 0;
function falar(t){ $('fala').textContent = t; mas.classList.remove('gira'); void mas.offsetWidth; mas.classList.add('gira'); }
function falasLista(){
  const prox = licoes.find(l => !feitas.has(l.id)), m = prox && modulos().find(x => x.id === prox.modulo), a = [];
  if (m){ const f = m.total - m.feitas; a.push(plural(f,'Falta 1 lição','Faltam '+f+' lições') + ' para fechar o ' + m.nome + '. Bora?'); }
  else a.push('Você completou a trilha toda!');
  a.push('Cada lição vale estrelas', 'Todo bug é uma aula disfarçada.');
  a.push(resumo.sequencia > 0 ? 'Sua chama está acesa há ' + resumo.sequencia + ' ' + plural(resumo.sequencia,'dia','dias') + '' : 'Que tal acender sua chama hoje?');
  return a;
}
function falaPadrao(){ $('fala').textContent = falasLista()[0]; fi = 0; }
mas.addEventListener('click', () => { const a = falasLista(); fi = (fi + 1) % a.length; falar(a[fi]); });

/* =====================================================================
   6b) PROJETO FINAL de cada trilha (corrigido por IA na Edge Function avaliar-projeto)
   ===================================================================== */
const NOTA_MINIMA = 5;   // passa com nota MAIOR que isto (a regra de verdade fica na função do servidor)
let pjAtual = null, pjBusy = false, pjAprovado = false;
const pjChave = m => 'cs_proj_' + usuario.id + '_' + m;
function melhorNota(mod){ const n = envios.filter(e => e.modulo === mod).map(e => Number(e.nota)); return n.length ? Math.max(...n) : null; }
const fmtNota = n => Number(n).toLocaleString('pt-BR', { maximumFractionDigits:1 });

function linhaProjeto(m){
  if (!m.proj) return '';
  const s = m.projOk ? 'ok' : (m.st === 'trava' || m.feitas < m.total) ? 'trava' : 'atual', melhor = melhorNota(m.id);
  const fim = s === 'ok' ? '<span class="pill ref">' + ICO('refresh') + ' REFAZER</span><span class="ic ok">✓</span>' : s === 'atual' ? '<span class="ic go">→</span>' : '<span>' + ICO('lock') + '</span>';
  const nota = melhor != null ? `<span class="pill">Melhor nota: ${fmtNota(melhor)}</span>` : '';
  return `<button class="row ${s}" data-s="${s}" data-proj="${esc(m.id)}"><span class="n">${ICO('trophy')}</span><span class="t">Projeto final: ${esc(m.proj.titulo)}</span>${nota}<span class="pill p">PROJETO</span>${fim}</button>`;
}

let pjTmr = null;
function pjAtualiza(){   // o resultado acompanha o que a pessoa digita
  if (!pjAtual || (pjAtual.proj.tipo || 'web') !== 'web') return;
  $('pjVer').srcdoc = $('pjCod').value;
}
function abreProjeto(modId){
  const m = modulos().find(x => x.id === modId); if (!m || !m.proj) return;
  const p = m.proj; pjAtual = m; pjAprovado = false;
  $('pjTit').textContent = 'Projeto final · ' + m.nome;
  $('pjTag').textContent = 'PROJETO FINAL • ' + m.nome.toUpperCase();
  $('pjTema').textContent = p.titulo; $('pjDesc').textContent = p.tema;
  $('pjReq').innerHTML = p.requisitos.map(r => `<li>${esc(r)}</li>`).join('');
  $('pjInfo').textContent = 'Passa com nota maior que ' + NOTA_MINIMA + ' (de 0 a 10).';
  let rasc = null; try{ rasc = localStorage.getItem(pjChave(m.id)); }catch(e){}
  $('pjCod').value = rasc != null ? rasc : p.base;
  const tipo = p.tipo || 'web';
  $('pjArq').textContent = tipo === 'python' ? 'main.py' : tipo === 'texto' ? 'comandos.txt' : 'index.html';
  $('pjEdit').classList.toggle('sem', tipo === 'texto'); $('pjResBox').hidden = tipo === 'texto';
  $('pjVer').hidden = tipo !== 'web'; $('pjSaida').hidden = tipo !== 'python'; $('pjRodar').hidden = tipo !== 'python';
  $('pjSaida').textContent = 'Clique em Executar para ver a saída do seu programa.';
  pjAtualiza();
  $('pjRes').hidden = true; $('pjRes').className = 'pj-res';
  $('pjEnviar').disabled = false; $('pjEnviar').textContent = 'Enviar para a correção';
  $('proj').hidden = false; document.documentElement.classList.add('au-aberta'); $('pjCod').focus();
}
function fechaProjeto(){
  $('proj').hidden = true; $('pjVer').srcdoc = ''; pjAtual = null;
  document.documentElement.classList.remove('au-aberta');
}
function mostraNota(d){
  const r = $('pjRes'); r.hidden = false; r.className = 'pj-res' + (d.aprovado ? ' ok' : '');
  const prox = modulos().find(x => x.st === 'atual'), fim = d.aprovado && !prox;
  r.innerHTML = `<div class="pj-nota"><b>${fmtNota(d.nota)}</b><strong>${d.aprovado ? (fim ? 'Aprovado! Você concluiu a trilha toda' : 'Aprovado! Próximo módulo liberado') : 'Quase lá! Ajuste e envie de novo'}</strong></div><p>${esc(d.feedback || '').replace(/\n/g, '<br>')}</p>`;
  r.scrollIntoView({ behavior: rmov ? 'auto' : 'smooth', block:'nearest' });
}
async function enviaProjeto(){
  if (pjBusy || !pjAtual) return;
  if (pjAprovado){ fechaProjeto(); falar('Projeto aprovado!'); return; }
  const cod = $('pjCod').value;
  if (cod.trim().length < 30){ aviso('Escreva um pouco mais de código antes de enviar.'); return; }
  if (cod.length > 8000){ aviso('Seu código passou de 8.000 caracteres. Deixe mais enxuto.'); return; }
  const btn = $('pjEnviar'); pjBusy = true; btn.disabled = true; btn.textContent = 'Corrigindo…';
  try{
    const { data:{ session } } = await sb.auth.getSession();
    const r = await fetch(URL_LIMPA + '/functions/v1/avaliar-projeto', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + session.access_token, 'apikey':SUPABASE_ANON_KEY.trim() },
      body: JSON.stringify({ modulo: pjAtual.id, codigo: cod }),
      signal: AbortSignal.timeout(70000)
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.erro || 'A correção não respondeu. Tente de novo em instantes.');
    envios.unshift({ modulo: pjAtual.id, nota: d.nota, aprovado: d.aprovado, criado_em: new Date().toISOString() });
    pjAprovado = !!d.aprovado; mostraNota(d);
    if (d.aprovado){ moduloSel = null; pintaPainel(); try{ localStorage.removeItem(pjChave(pjAtual.id)); }catch(e){} }
    btn.textContent = d.aprovado ? 'Concluir' : 'Enviar de novo';
  }catch (err){
    aviso(err.name === 'TimeoutError' ? 'A correção demorou demais. Tente de novo em instantes.' : (err.message || 'Não consegui enviar o projeto.')); btn.textContent = 'Enviar para a correção';
  }
  btn.disabled = false; pjBusy = false;
}
$('pjX').addEventListener('click', fechaProjeto);
$('pjRodar').addEventListener('click', () => rodaPython($('pjCod').value, [], 'pjSaida'));
$('pjEnviar').addEventListener('click', enviaProjeto);
$('pjReset').addEventListener('click', () => {
  if (!pjAtual || !confirm('Voltar ao código inicial? O que você escreveu será apagado.')) return;
  $('pjCod').value = pjAtual.proj.base; try{ localStorage.removeItem(pjChave(pjAtual.id)); }catch(e){}
  pjAprovado = false; $('pjRes').hidden = true; $('pjRes').className = 'pj-res';
  $('pjEnviar').disabled = false; $('pjEnviar').textContent = 'Enviar para a correção'; pjAtualiza();
});
$('pjCod').addEventListener('input', () => {
  if (pjAtual) try{ localStorage.setItem(pjChave(pjAtual.id), $('pjCod').value); }catch(e){}
  clearTimeout(pjTmr); pjTmr = setTimeout(pjAtualiza, 350);
});
$('pjCod').addEventListener('keydown', e => {   // Tab escreve 2 espaços em vez de pular o foco
  if (e.key !== 'Tab' || e.shiftKey) return; e.preventDefault();
  const t = e.target, a = t.selectionStart; t.value = t.value.slice(0, a) + '  ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = a + 2;
  t.dispatchEvent(new Event('input'));
});

/* =====================================================================
   7) AULA em tela cheia, passo a passo (lições da trilha e desafios do Praticar)
      A gravação do progresso é feita pela função concluir_licao no banco.
   ===================================================================== */
const ARQ = { html:'index.html', css:'style.css', js:'script.js', py:'main.py' };
let aula = null, aulaIdx = 0, aulaOk = [], aulaCod = [], aulaTent = [];
let aulaRun = 0, aulaRecebeu = false, aulaTmr = null, aulaSoltaTab = false;
const FRASES_OK = ['Mandou bem!', 'Isso aí!', 'Perfeito!', 'Muito bem!', 'É isso mesmo!'];
const sorteia = a => a[Math.floor(Math.random() * a.length)];
const semMarcas = s => String(s || '').replace(/`/g, '').replace(/\*\*/g, '');

// texto simples da aula: `código` e **negrito**
function semEmoji(s){ return String(s).replace(/([ \t]?)([\p{Extended_Pictographic}\uFE0F\u200D]+)([ \t]?)/gu, (m, a, e, b) => e.includes('©') ? m : (a && b ? ' ' : '')); }
function md(s){ return esc(semEmoji(s)).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>'); }
function blocoAula(b){
  if (b.t === 'texto')  return '<p>' + md(b.v) + '</p>';
  if (b.t === 'titulo') return '<h3>' + md(b.v) + '</h3>';
  if (b.t === 'lista')  return '<ul class="lc-lista">' + b.v.map(i => '<li>' + md(i) + '</li>').join('') + '</ul>';
  if (b.t === 'dica')   return '<div class="lc-dica">' + ICO('bulb') + ' ' + md(b.v) + '</div>';
  if (b.t === 'codigo') return (b.rotulo ? '<div class="lc-rot">' + esc(b.rotulo) + '</div>' : '') + '<pre class="lc-cod"><code>' + (b.l === 'py' ? realcaPy(b.v) : realca(b.v)) + '</code></pre>';
  return '';
}

// Roda DENTRO do iframe do exercício (por isso não pode usar nada de fora). Confere o resultado e avisa a página.
function verificador(T, id){
  // O próprio script verificador (e o JS do aluno) ficam no HTML da página. Se o aluno deixar uma tag aberta
  // (ex.: <h1 abc> sem fechar), esses <script> viram FILHOS dela e o textContent passa a incluir o código dos
  // testes (que contém o texto esperado). Como todos já executaram, removemos antes de conferir.
  Array.prototype.slice.call(document.querySelectorAll('script')).forEach(function(s){ s.remove(); });
  function el(s){ try{ return document.querySelector(s); }catch(e){ return null; } }
  function els(s){ try{ return Array.prototype.slice.call(document.querySelectorAll(s)); }catch(e){ return []; } }
  // texto visível do elemento: ignora conteúdo de <style>, <noscript> e <template>
  function texto(e){ var c = e.cloneNode(true); Array.prototype.slice.call(c.querySelectorAll('script,style,noscript,template')).forEach(function(x){ x.remove(); }); return c.textContent; }
  function norm(p, v){ var e = document.createElement('div'); document.body.appendChild(e); e.style.setProperty('border-style', 'solid'); e.style.setProperty(p, v); var r = getComputedStyle(e).getPropertyValue(p); e.remove(); return r; }
  var R = T.map(function(t){
    try{
      var e, a, v;
      switch (t.t){
        case 'existe':  return !!el(t.sel);
        case 'quantos': return document.querySelectorAll(t.sel).length >= t.min;
        case 'texto':
          // vale se QUALQUER elemento que combine com o seletor atender (ex.: dois <a>, só o segundo tem o texto)
          return els(t.sel).some(function(x){
            var tx = texto(x);
            if (t.contem != null) return tx.toLowerCase().indexOf(t.contem.toLowerCase()) > -1;
            return tx.trim().length > 0;
          });
        case 'attr':
          return els(t.sel).some(function(x){
            var a = x.getAttribute(t.attr); if (a == null) return false;
            if (t.contem != null) return a.indexOf(t.contem) > -1;
            if (t.naoVazio) return a.trim().length > 0;
            return true;
          });
        case 'css':
          return els(t.sel).some(function(x){ return getComputedStyle(x).getPropertyValue(t.prop) === norm(t.prop, t.val); });
        case 'colunas':
          e = el(t.sel); if (!e) return false;
          v = getComputedStyle(e).getPropertyValue('grid-template-columns').trim().split(/\s+/);
          return v.length === t.n && v.every(function(x){ return Math.abs(parseFloat(x) - parseFloat(v[0])) < 1; });
        case 'var':
          v = (0, eval)(t.nome);
          if (t.val !== undefined) return v === t.val;
          return typeof v === t.tipo;
        case 'fn':
          v = (0, eval)(t.nome);
          return typeof v === 'function' && JSON.stringify(v.apply(null, t.args)) === JSON.stringify(t.ret);
        case 'log':
          return (window.__logs || []).some(function(l){ return t.rx ? new RegExp(t.rx, 'i').test(l) : l.indexOf(t.contem) > -1; });
        case 'logvar':
          v = String((0, eval)(t.nome));
          return v.length > 0 && (window.__logs || []).some(function(l){ return l.indexOf(v) > -1; });
      }
    }catch(err){ return false; }
    return false;
  });
  try{ parent.postMessage({ cs:2, id:id, r:R }, '*'); }catch(e){}
}

const LOGS = '<script>window.__logs=[];(function(){var o=console.log;console.log=function(){window.__logs.push([].map.call(arguments,function(x){try{return typeof x===\'object\'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(\' \'));o.apply(console,arguments)}})();' + '<' + '/script>';
function montaLicao(ex, c, dom, id){
  const check = '<script>(' + verificador.toString() + ')(' + JSON.stringify(dom).replace(/</g, '\\u003c') + ',' + id + ');' + '<' + '/script>';
  const fim = '<' + '/script>';
  if (ex.doc) return c.html + '<style>' + c.css + '</style>' + PONTE + LOGS + '<script>' + c.js + fim + check;     // página completa (com <html>)
  return '<!DOCTYPE html><html><head><meta charset=utf-8><style>' + c.css + '</style>' + PONTE + LOGS + '</head><body>' + c.html + '<script>' + c.js + fim + check + '</body></html>';
}


// Lições no formato antigo (aula + exercício) viram telas curtas automaticamente
function converteAntigo(c){
  const telas = []; let atual = null;
  (c.passos || []).forEach(b => {
    if (b.t === 'texto' || !atual){ atual = { t:'texto', blocos:[b] }; telas.push(atual); }
    else atual.blocos.push(b);
  });
  if (c.exercicio){ const e = c.exercicio; telas.push({ t:'codigo', texto:e.enunciado, abas:e.abas, inicial:e.inicial, doc:e.doc, testes:e.testes, dica:e.dica, solucao:e.solucao }); }
  return telas;
}
function telasDe(c){
  if (c && c.telas && c.telas.length) return c.telas;
  if (c && ((c.passos && c.passos.length) || c.exercicio)) return converteAntigo(c);
  return null;
}

function abreLicao(id){
  const l = licoes.find(x => x.id === id); if (!l) return;
  const m = modulos().find(x => x.id === l.modulo), n = m.l.indexOf(l) + 1;
  abreAula({ id:l.id, titulo:'Lição ' + n + ': ' + l.titulo, conteudo:l.conteudo, estrelas:l.estrelas, desafio:false, voltar:'painel', feita:feitas.has(l.id) });
}
function abreAula(cfg){
  let telas = telasDe(cfg.conteudo);
  if (!telas) telas = [{ t:'texto', blocos:[ (!cfg.desafio && !licoes.some(x => x.conteudo))
    ? { t:'dica', v:'**As lições ainda não foram instaladas no banco.** No Supabase, abra o **SQL Editor**, rode o arquivo **licoes-conteudo.sql** e recarregue esta página (Ctrl + Shift + R).' }
    : { t:'texto', v:'O conteúdo desta lição ainda vai ser adicionado. Por enquanto, termine a lição para testar o seu progresso, as estrelas e o ranking.' } ] }];
  aula = { ...cfg, telas:[...telas, { t:'fim' }] };
  aulaIdx = 0; aulaOk = []; aulaCod = []; aulaTent = [];
  $('auTit').textContent = cfg.titulo; $('auSair').hidden = true; $('aula').hidden = false;
  document.documentElement.classList.add('au-aberta');
  $('auProg').setAttribute('aria-valuemax', aula.telas.length);
  mostraTela(0);
}
function fechaAula(){
  clearTimeout(aulaTmr); aulaRun++;
  $('aula').hidden = true; $('auSair').hidden = true; $('auConteudo').innerHTML = '';
  document.documentElement.classList.remove('au-aberta');
  if (aula) vai(aula.voltar);
}

// ---- mascote
function falaMascote(txt, humor){
  const b = $('auBalao'); b.textContent = txt || ''; b.hidden = !txt;
  const s = $('auStar'); s.classList.remove('pula', 'triste'); void s.offsetWidth;
  $('auBoca').setAttribute('d', humor === 'feliz' ? 'M40 57 Q50 70 60 57' : humor === 'triste' ? 'M42 64 Q50 57 58 64' : 'M42 59 Q50 66 58 59');
  if (humor === 'feliz') s.classList.add('pula'); else if (humor === 'triste') s.classList.add('triste');
}

// ---- telas
function pintaProgresso(){
  $('auProg').innerHTML = aula.telas.map((_, k) => `<i class="${k < aulaIdx ? 'feito' : k === aulaIdx ? 'atual' : ''}"></i>`).join('');
  $('auProg').setAttribute('aria-valuenow', aulaIdx + 1);
}
function mostraTela(i){
  aulaIdx = i; clearTimeout(aulaTmr); aulaRun++;
  const t = aula.telas[i], box = $('auConteudo');
  pintaProgresso(); $('auVolta').disabled = i === 0;
  $('auDica').hidden = !t.dica; $('auSolucao').hidden = true;
  if (t.t === 'texto'){ montaTexto(t, box); falaMascote(i === 0 ? 'Vamos nessa?' : '', 'neutro'); }
  else if (t.t === 'escolha'){ montaEscolha(t, box); falaMascote(aulaOk[i] ? 'Já acertou esta! Clique em Continuar.' : 'Escolha uma resposta e clique em Verificar.', 'neutro'); }
  else if (t.t === 'codigo'){ montaCodigo(t, box); }
  else if (t.t === 'python'){ montaPython(t, box); }
  else montaFim(box);
  atualizaOk();
  $('auMain').scrollTop = 0;
  const alvo = box.querySelector('[tabindex="-1"]'); if (alvo) alvo.focus({ preventScroll:true });
}
function avanca(){ if (aulaIdx < aula.telas.length - 1) mostraTela(aulaIdx + 1); }
function atualizaOk(){
  const t = aula.telas[aulaIdx], b = $('auOk'), kbd = ' <span class="au-kbd">Ctrl+⏎</span>';
  let txt = 'Continuar', dis = false;
  if (t.t === 'escolha' && !aulaOk[aulaIdx]){ txt = 'Verificar'; dis = !document.querySelector('#auConteudo input[name=auop]:checked'); }
  else if ((t.t === 'codigo' || t.t === 'python') && !aulaOk[aulaIdx]) txt = 'Verificar';
  else if (t.t === 'fim') txt = aula.desafio ? 'Concluir desafio' : aula.feita ? 'Voltar' : 'Concluir e ganhar +' + aula.estrelas + '';
  b.innerHTML = txt + kbd; b.disabled = dis;
}
function acaoOk(){
  const t = aula.telas[aulaIdx];
  if (t.t === 'texto') return avanca();
  if (t.t === 'escolha') return aulaOk[aulaIdx] ? avanca() : verificaEscolha();
  if (t.t === 'codigo') return aulaOk[aulaIdx] ? avanca() : verificaCodigo();
  if (t.t === 'python') return aulaOk[aulaIdx] ? avanca() : verificaPython();
  return concluiAula();
}

function montaTexto(t, box){
  box.innerHTML = `<div class="au-col" tabindex="-1">${(t.blocos || []).map(blocoAula).join('')}</div>`;
}

// pergunta de múltipla escolha
function montaEscolha(t, box){
  const i = aulaIdx; if (!aulaCod[i]) aulaCod[i] = { ordem: embaralha(t.opcoes.map((_, k) => k)), erradas: [] };
  const st = aulaCod[i], ok = aulaOk[i];
  box.innerHTML = `<div class="au-col"><h2 class="au-perg" tabindex="-1">${md(t.p)}</h2><div class="au-ops" role="radiogroup" aria-label="Respostas">`
    + st.ordem.map(o => `<label class="au-op ${ok && o === t.certa ? 'certa' : st.erradas.includes(o) ? 'errada' : ''}"><input type="radio" name="auop" value="${o}"${ok || st.erradas.includes(o) ? ' disabled' : ''}${ok && o === t.certa ? ' checked' : ''}><span>${md(t.opcoes[o])}</span></label>`).join('')
    + `</div><p class="au-exp" id="auExp" role="status"${ok || st.erradas.length >= 2 ? '' : ' hidden'}>${md(t.explicacao)}</p></div>`;
}
function verificaEscolha(){
  const i = aulaIdx, t = aula.telas[i], st = aulaCod[i], sel = document.querySelector('#auConteudo input[name=auop]:checked'); if (!sel) return;
  const o = +sel.value; aulaTent[i] = (aulaTent[i] || 0) + 1;
  if (o === t.certa){ aulaOk[i] = true; montaEscolha(t, $('auConteudo')); falaMascote(sorteia(FRASES_OK), 'feliz'); }
  else { st.erradas.push(o); montaEscolha(t, $('auConteudo')); falaMascote('Quase! Tente outra opção.', 'triste'); }
  atualizaOk();
}

// exercício de código: editor à esquerda, resultado à direita
const chipRot = c => typeof c === 'string' ? c : c.r;
const chipVal = c => typeof c === 'string' ? c : c.v;
const testeSrc = (x, cod) => { try{ return new RegExp(x.rx, 'i').test(cod[x.em] || ''); }catch(e){ return false; } };
// Confere o HTML DIGITADO (o navegador "conserta" tags abertas sozinho, então o DOM sozinho não mostra esse erro).
// Devolve a mensagem do primeiro problema, ou null se as tags estão bem fechadas.
const HTML_VAZIAS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const HTML_OPCIONAIS = new Set(['html','head','body']);      // tags que podem ficar sem fechar sem prejudicar o aluno
const HTML_BRUTAS = ['script','style','textarea','title'];   // o conteúdo delas é texto puro, não é conferido
function htmlProblema(src){
  let s = String(src || '').replace(/<!-{2}[\s\S]*?-{2}>/g, '');                  // tira comentários HTML
  if (/<!-{2}/.test(s)) return 'Um comentário ficou sem fechar (falta o -->).';
  const MAL = 'Uma tag está mal formada: falta um ">" ou uma aspa.';
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g, pilha = [];
  let m, ult = 0;
  while ((m = re.exec(s))){
    if (/<\/?[a-zA-Z]/.test(s.slice(ult, m.index))) return MAL;
    ult = re.lastIndex;
    const nome = m[2].toLowerCase();
    if (!m[1]){                                                                    // tag de abertura
      if (HTML_VAZIAS.has(nome) || /\/\s*$/.test(m[3])) continue;
      pilha.push(nome);
      if (HTML_BRUTAS.includes(nome)){
        const rel = s.slice(re.lastIndex).search(new RegExp('</' + nome + '[\\s>/]', 'i'));
        if (rel < 0) return 'A tag <' + nome + '> não foi fechada. Falta o </' + nome + '>.';
        re.lastIndex += rel; ult = re.lastIndex;
      }
    } else {                                                                       // tag de fechamento
      const k = pilha.lastIndexOf(nome);
      if (k < 0) return 'Sobrou um </' + nome + '> sem a tag de abertura <' + nome + '>.';
      const aberta = pilha.slice(k + 1).find(n => !HTML_OPCIONAIS.has(n));
      if (aberta) return 'A tag <' + aberta + '> não foi fechada. Falta o </' + aberta + '>.';
      pilha.length = k;
    }
  }
  if (/<\/?[a-zA-Z]/.test(s.slice(ult))) return MAL;
  const aberta = pilha.find(n => !HTML_OPCIONAIS.has(n));
  return aberta ? 'A tag <' + aberta + '> não foi fechada. Falta o </' + aberta + '>.' : null;
}
// Confere o CSS DIGITADO. O navegador perdoa o ; da última declaração de um bloco e o } que falta no fim do arquivo
// (fecha sozinho), então getComputedStyle sozinho não mostra esses erros. Aqui TODA declaração precisa terminar em ;
// e TODO bloco precisa de }. Devolve a mensagem do primeiro problema, ou null se está tudo certo.
// "color: red font-size: 40px" (faltou o ; entre duas declarações): devolve o trecho da 1ª declaração, ou null
function cssFaltaPontoVirgula(seg){
  if (/^\s*@/.test(seg)) return null;                                                  // @import, @charset... não são declarações
  let m = seg.replace(/"[^"]*"|'[^']*'/g, x => 'x'.repeat(x.length)), ant;             // ignora o que está entre aspas e dentro de ( )
  do { ant = m; m = m.replace(/\([^()]*\)/g, x => 'x'.repeat(x.length)); } while (m !== ant);
  const c1 = m.indexOf(':'); if (c1 < 0) return null;
  const r = /\s([-a-zA-Z][-\w]*)\s*:/g; r.lastIndex = c1;
  const f = r.exec(m);
  return f ? seg.slice(0, f.index) : null;
}
function cssProblema(src){
  const s = String(src || ''), n = s.length, pilha = [];
  const resume = t => { t = t.replace(/\s+/g, ' ').trim(); return t.length > 40 ? t.slice(0, 40) + '…' : t; };
  let seg = '', par = 0, i = 0;                       // seg = texto desde o último { ; ou }   |   par = profundidade de ( )
  while (i < n){
    const c = s[i];
    if (c === '/' && s[i + 1] === '*'){                // comentário /* ... */
      const f = s.indexOf('*/', i + 2);
      if (f < 0) return 'Um comentário ficou sem fechar (falta o */).';
      i = f + 2; seg += ' '; continue;
    }
    if (c === '"' || c === "'"){                       // texto entre aspas: ; { } dentro dele não contam
      let j = i + 1;
      while (j < n && s[j] !== c && s[j] !== '\n'){ if (s[j] === '\\') j++; j++; }
      if (j >= n || s[j] !== c) return 'Faltou fechar uma aspa (' + c + ').';
      seg += s.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === '\\'){ seg += s.slice(i, i + 2); i += 2; continue; }
    if (c === '(') par++; else if (c === ')' && par > 0) par--;
    if (par === 0 && c === '{'){ pilha.push(resume(seg)); seg = ''; }                        // abre bloco
    else if (par === 0 && c === ';'){                                                       // declaração terminada
      const antes = cssFaltaPontoVirgula(seg);
      if (antes) return 'Falta o ; no final de "' + resume(antes) + '".';
      seg = '';
    }
    else if (par === 0 && c === '}'){                                                       // fecha bloco
      if (seg.trim()) return 'Falta o ; no final de "' + resume(seg) + '".';
      if (!pilha.length) return 'Sobrou um } sem o { de abertura.';
      pilha.pop(); seg = '';
    } else seg += c;
    i++;
  }
  if (par > 0) return 'Faltou fechar um parêntese ")".';
  if (pilha.length){
    if (seg.trim()) return 'Falta o ; no final de "' + resume(seg) + '".';
    return 'Falta fechar o bloco "' + pilha[pilha.length - 1] + ' {" com }.';
  }
  return null;
}
// Junta as conferências do código digitado (HTML, CSS e <style> dentro do HTML) numa mensagem só
function problemaCodigo(t, cod){
  if (!t || t.t !== 'codigo') return null;
  const abas = t.abas || []; let p = null;
  if (abas.includes('html')) p = htmlProblema(cod.html);
  if (!p && abas.includes('css')) p = cssProblema(cod.css);
  if (!p && abas.includes('html')){
    const re = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi; let m;
    while (!p && (m = re.exec(cod.html || ''))) p = cssProblema(m[1]);
  }
  return p;
}
function montaCodigo(t, box){
  const i = aulaIdx;
  if (!aulaCod[i]){
    let base = { html:'', css:'', js:'', ...(t.inicial || {}) };
    if (t.continua){ for (let k = i - 1; k >= 0; k--){ if (aula.telas[k].t === 'codigo' && aulaCod[k]){ base = { ...base, ...aulaCod[k].cod }; break; } } }
    aulaCod[i] = { cod:base, ini:{ ...base }, aba:t.abas[0], res:null };
  }
  box.innerHTML = `<div class="au-col larga"><div class="au-texto" tabindex="-1">${md(t.texto)}</div>
    <div class="au-ed">
      <section class="au-card" aria-label="Editor de código"><div class="au-tabs" role="tablist" id="auAbas">${t.abas.map(a => `<button class="au-tab" role="tab" data-l="${a}" type="button">${ARQ[a]}</button>`).join('')}</div>
        <textarea id="auEd" class="au-ta" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Editor de código"></textarea>
        <div class="au-rodaed"><button class="au-reset" id="auReset" type="button">↺ Reset</button></div></section>
      <section class="au-card" aria-label="Resultado"><div class="au-tabs"><span class="au-tit2">Resultado</span></div><iframe id="auRes" title="Resultado do seu código" sandbox="allow-scripts"></iframe>${t.abas.includes('js') ? '<div class="cons"><div class="ch"><span>CONSOLE</span></div><pre id="auCons" aria-live="polite"></pre></div>' : ''}</section>
    </div>
    <div class="au-chips" id="auChips">${(t.chips || []).map((c, k) => `<button class="au-chip" data-k="${k}" type="button" title="Inserir no editor"><code>${esc(chipRot(c))}</code></button>`).join('')}</div>
    <ul class="checks" id="auChecks" aria-live="polite"></ul></div>`;
  mostraAba(); pintaChecks(); rodaPreview();
  falaMascote(aulaOk[i] ? 'Etapa concluída! Clique em Continuar.' : (t.chips && t.chips.length ? 'Clique no botão com o código para inseri-lo no editor.' : 'Escreva o código e clique em Verificar.'), 'neutro');
  if (aulaTent[i] >= 2 && !aulaOk[i]) $('auSolucao').hidden = false;
}
// ---- exercício de Python: roda no navegador (Pyodide) dentro de um Worker que pode ser parado
const PY_URL = 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/';
function pyWorkerMain(URL_PY){
  importScripts(URL_PY + 'pyodide.js');
  let py = null;
  const pronto = loadPyodide({ indexURL: URL_PY }).then(p => { py = p; postMessage({ pronto:true }); }, () => { postMessage({ falhou:true }); });
  self.onmessage = async ev => {
    const d = ev.data; await pronto;
    const linhas = []; let erro = null;
    py.setStdout({ batched: l => linhas.push(l) }); py.setStderr({ batched: l => linhas.push(l) });
    const g = py.globals.get('dict')();
    try{ await py.runPythonAsync(d.codigo, { globals:g }); }
    catch(e){ erro = String((e && e.message) || e).trim().split('\n').slice(-2).join('\n'); }
    const txt = linhas.join('\n');
    const r = d.testes.map(t => {
      try{
        if (t.t === 'saida') return t.rx ? new RegExp(t.rx, 'i').test(txt) : txt.toLowerCase().indexOf(String(t.contem).toLowerCase()) > -1;
        if (t.t === 'var'){
          if (!g.has(t.nome)) return false;
          if (t.tipo) return py.runPython('type(' + t.nome + ').__name__', { globals:g }) === t.tipo;
          let v = g.get(t.nome); if (v && v.toJs) v = v.toJs();
          return JSON.stringify(v) === JSON.stringify(t.val);
        }
        if (t.t === 'fn'){
          g.set('__a', py.toPy(t.args));
          const out = py.runPython('import json\njson.dumps(' + t.nome + '(*__a), ensure_ascii=False)', { globals:g });
          return JSON.stringify(JSON.parse(out)) === JSON.stringify(t.ret);
        }
      }catch(e){ return false; }
      return false;
    });
    try{ g.destroy(); }catch(e){}
    postMessage({ id:d.id, saida:txt, erro:erro, r:r });
  };
}
let pyWorker = null, pyPronto = null, pyOk = false, pyId = 0, pyFila = Promise.resolve();
function pyGarante(){
  if (pyPronto) return pyPronto;
  const w = new Worker(URL.createObjectURL(new Blob(['(' + pyWorkerMain.toString() + ')(' + JSON.stringify(PY_URL) + ')'], { type:'text/javascript' })));
  pyWorker = w;
  pyPronto = new Promise((ok, no) => { w.onmessage = ev => { if (ev.data && ev.data.pronto){ pyOk = true; ok(); } else if (ev.data && ev.data.falhou) no(new Error('falhou')); }; w.onerror = () => no(new Error('worker')); });
  pyPronto.catch(() => { if (pyWorker === w){ pyWorker = null; pyPronto = null; pyOk = false; } try{ w.terminate(); }catch(e){} });
  return pyPronto;
}
async function pyRoda(codigo, testes){
  const nada = erro => ({ saida:'', erro, r:testes.map(() => false) });
  try{ await Promise.race([pyGarante(), new Promise((_, no) => setTimeout(() => no(new Error('tempo')), 60000))]); }
  catch(e){ if (pyWorker){ try{ pyWorker.terminate(); }catch(x){} } pyWorker = null; pyPronto = null; pyOk = false; return nada('Não consegui carregar o Python. Verifique sua internet e tente de novo.'); }
  const w = pyWorker, id = ++pyId;
  return new Promise(resolve => {
    const fim = setTimeout(() => { w.terminate(); if (pyWorker === w){ pyWorker = null; pyPronto = null; pyOk = false; } resolve(nada('O programa demorou demais e foi parado. Será que tem um laço que nunca termina?')); }, 6000);
    w.onmessage = ev => { const d = ev.data; if (!d || d.id !== id) return; clearTimeout(fim); resolve({ saida:d.saida, erro:d.erro, r:d.r }); };
    w.postMessage({ id, codigo, testes });
  });
}
async function rodaPython(codigo, testes, alvo){
  const idSaida = alvo || 'auSaida', box = $(idSaida);
  if (box){ box.textContent = pyOk ? 'Executando…' : 'Carregando o Python (só na primeira vez, pode levar alguns segundos)…'; }
  const p = pyFila.then(() => pyRoda(codigo, testes || [])); pyFila = p.catch(() => {});
  const r = await p, b = $(idSaida);
  if (b && (alvo ? pjAtual : (aula && aula.telas[aulaIdx] && aula.telas[aulaIdx].t === 'python'))){
    b.textContent = r.saida || (r.erro ? '' : '(o programa não mostrou nada)');
    if (r.erro){ const e = document.createElement('span'); e.className = 'e'; e.textContent = (r.saida ? '\n' : '') + r.erro; b.appendChild(e); }
  }
  return r;
}
function montaPython(t, box){
  const i = aulaIdx;
  if (!aulaCod[i]){ const base = { py:'', ...(t.inicial || {}) }; aulaCod[i] = { cod:base, ini:{ ...base }, aba:'py', res:null }; }
  box.innerHTML = `<div class="au-col larga"><div class="au-texto" tabindex="-1">${md(t.texto)}</div>
    <div class="au-ed">
      <section class="au-card" aria-label="Editor de código"><div class="au-tabs" role="tablist" id="auAbas"><button class="au-tab on" role="tab" data-l="py" type="button">main.py</button></div>
        <textarea id="auEd" class="au-ta" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Editor de código Python"></textarea>
        <div class="au-rodaed"><button class="au-rodar" id="auRodar" type="button">Executar</button><button class="au-reset" id="auReset" type="button">↺ Reset</button></div></section>
      <section class="au-card" aria-label="Saída do programa"><div class="au-tabs"><span class="au-tit2">Saída</span></div><pre id="auSaida" class="au-saida" aria-live="polite">Clique em Executar para ver a saída do seu programa.</pre></section>
    </div>
    <ul class="checks" id="auChecks" aria-live="polite"></ul></div>`;
  mostraAba(); pintaChecks();
  falaMascote(aulaOk[i] ? 'Etapa concluída! Clique em Continuar.' : 'Escreva o código, teste em Executar e depois clique em Verificar.', 'neutro');
  if (aulaTent[i] >= 2 && !aulaOk[i]) $('auSolucao').hidden = false;
}
async function verificaPython(){
  const i = aulaIdx, t = aula.telas[i], st = aulaCod[i]; aulaTent[i] = (aulaTent[i] || 0) + 1;
  const id = ++aulaRun; $('auOk').disabled = true; $('auOk').textContent = 'Verificando…';
  const r = await rodaPython(st.cod.py, t.testes.filter(x => x.t !== 'src'));
  if (id !== aulaRun) return;
  finalizaCodigo(id, r.r);
}
function mostraAba(){
  const st = aulaCod[aulaIdx]; $('auEd').value = st.cod[st.aba];
  document.querySelectorAll('#auAbas .au-tab').forEach(a => { const on = a.dataset.l === st.aba; a.classList.toggle('on', on); a.setAttribute('aria-selected', on); });
}
function pintaChecks(){
  const t = aula.telas[aulaIdx], st = aulaCod[aulaIdx], ul = $('auChecks'); if (!ul) return;
  ul.innerHTML = st.res ? t.testes.map((x, k) => { const r = st.res[k];
    return `<li class="chk ${r ? 'ok' : 'no'}"><span class="ci" aria-hidden="true">${r ? '✓' : '✗'}</span><span>${esc(x.msg)}</span><span class="sr">${r ? ' (feito)' : ' (ainda falta)'}</span></li>`; }).join('')
    + (st.prob ? `<li class="chk no"><span class="ci" aria-hidden="true">✗</span><span>${esc(st.prob)}</span><span class="sr"> (ainda falta)</span></li>` : '') : '';
}
function rodaPreview(){
  const t = aula && aula.telas[aulaIdx], f = $('auRes'); if (!t || t.t !== 'codigo' || !f) return;
  if ($('auCons')) $('auCons').textContent = '';
  f.srcdoc = montaLicao({ doc:!!t.doc }, aulaCod[aulaIdx].cod, [], 0);
}
function insereChip(k){
  const t = aula.telas[aulaIdx], st = aulaCod[aulaIdx], ta = $('auEd'), v = chipVal(t.chips[k]);
  const atual = ta.value, solo = /^\s*(<!-{2}[\s\S]*-{2}>|\/\*[\s\S]*\*\/|\/\/[^\n]*)?\s*$/.test(atual);
  let novo, pos;
  if (solo){ novo = v + '\n'; pos = novo.length; }
  else {
    const a = ta.selectionStart, b = ta.selectionEnd;
    if (a >= atual.length){ novo = atual + (atual.endsWith('\n') ? '' : '\n') + v + '\n'; pos = novo.length; }
    else { novo = atual.slice(0, a) + v + atual.slice(b); pos = a + v.length; }
  }
  ta.value = novo; ta.focus(); ta.setSelectionRange(pos, pos); ta.dispatchEvent(new Event('input', { bubbles:true }));
}
function verificaCodigo(){
  const i = aulaIdx, t = aula.telas[i], st = aulaCod[i]; aulaTent[i] = (aulaTent[i] || 0) + 1;
  const dom = t.testes.filter(x => x.t !== 'src'), id = ++aulaRun; aulaRecebeu = false;
  $('auOk').disabled = true; $('auOk').textContent = 'Verificando…';
  if ($('auCons')) $('auCons').textContent = '';
  $('auRes').srcdoc = montaLicao({ doc:!!t.doc }, st.cod, dom, id);
  setTimeout(() => { if (aulaRun === id && !aulaRecebeu) finalizaCodigo(id, []); }, 2500);   // se o iframe não responder
}
function resultadoAula(d){ aulaRecebeu = true; finalizaCodigo(d.id, d.r || []); }
function finalizaCodigo(id, dr){
  if (id !== aulaRun) return;
  const i = aulaIdx, t = aula.telas[i], st = aulaCod[i]; let k = 0;
  st.res = t.testes.map(x => x.t === 'src' ? testeSrc(x, st.cod) : !!dr[k++]);
  st.prob = problemaCodigo(t, st.cod);   // tag aberta sem fechar, falta de ; ou } etc.
  pintaChecks();
  const falhou = t.testes.filter((_, j) => !st.res[j]);
  if (!falhou.length && !st.prob){ aulaOk[i] = true; $('auSolucao').hidden = true; falaMascote(sorteia(FRASES_OK), 'feliz'); }
  else { aulaOk[i] = false; falaMascote('Quase! Ainda falta: ' + semMarcas(falhou.length ? falhou[0].msg : st.prob), 'triste'); if (aulaTent[i] >= 2) $('auSolucao').hidden = false; }
  atualizaOk();
}

// tela final
function montaFim(box){
  const nCod = aula.telas.filter(x => x.t === 'codigo' || x.t === 'python').length, nEsc = aula.telas.filter(x => x.t === 'escolha').length;
  const resumoTxt = (nCod ? nCod + ' ' + plural(nCod, 'exercício de código', 'exercícios de código') : '') + (nCod && nEsc ? ' e ' : '') + (nEsc ? nEsc + ' ' + plural(nEsc, 'pergunta', 'perguntas') : '');
  const d = aula.desafio;
  box.innerHTML = `<div class="au-col" tabindex="-1"><svg class="au-fim-ico" aria-hidden="true"><use href="#lg"/></svg><h2 class="au-perg">${d ? 'Desafio completo!' : 'Lição completa!'}</h2>`
    + (resumoTxt ? `<p>Você fez ${resumoTxt}.</p>` : '')
    + (d ? '<p>Aqui não vale estrela, mas é treino de verdade!</p>'
        : aula.feita ? '<p>Você já tinha concluído esta lição, então as estrelas não são dadas de novo. Mas praticar nunca é demais!</p>'
        : `<div class="au-estrelas">+${aula.estrelas} ${ICO('star',1)}</div><p>Conclua a lição para ganhar as estrelas.</p>`) + '</div>';
  falaMascote('Mandou muito bem!', 'feliz');
}
async function concluiAula(){
  const btn = $('auOk'); if (btn.disabled) return;
  if (aula.desafio){ praticaFeita.add(aula.id.replace('desafio:', '')); salvaPraticaLocal(); fechaAula(); aviso('Desafio concluído! Mandou bem.'); return; }
  if (aula.feita){ fechaAula(); return; }
  btn.disabled = true; btn.textContent = 'Salvando…';
  try{
    const l = licoes.find(x => x.id === aula.id);
    const antes = modulos().find(x => x.id === l.modulo), metaAntes = resumo.hoje >= perfil.meta_diaria;
    const { data, error } = await sb.rpc('concluir_licao', { p_licao: l.id });
    if (error) throw error;
    feitas.add(l.id); await recarregaResumo();
    const depois = modulos().find(x => x.id === l.modulo);
    let msg = data && data.nova ? '+' + l.estrelas + ' estrelas! Lição concluída.' : 'Lição já estava concluída.';
    if (antes.feitas < antes.total && depois.feitas === depois.total) msg = depois.proj && !depois.projOk ? 'Lições do ' + depois.nome + ' concluídas! Agora faça o projeto final. ' + msg : 'Módulo ' + depois.nome + ' concluído! ' + msg;
    else if (!metaAntes && resumo.hoje >= perfil.meta_diaria) msg += ' Meta de hoje batida';
    moduloSel = null; pintaPainel(); fechaAula(); falar('Boa! Mais uma lição no bolso'); aviso(msg);
  } catch (err){ aviso('Não consegui salvar seu progresso. ' + traduz(err)); atualizaOk(); }
}

// ---- eventos da tela de aula
$('auOk').addEventListener('click', acaoOk);
$('auVolta').addEventListener('click', () => { if (aulaIdx > 0) mostraTela(aulaIdx - 1); });
$('auX').addEventListener('click', () => { if (aulaIdx > 0 && aulaIdx < aula.telas.length - 1){ $('auSair').hidden = false; $('auSairNao').focus(); } else fechaAula(); });
$('auSairSim').addEventListener('click', fechaAula);
$('auSairNao').addEventListener('click', () => { $('auSair').hidden = true; $('auX').focus(); });
$('auDica').addEventListener('click', () => { const t = aula.telas[aulaIdx]; if (t.dica) falaMascote(semMarcas(t.dica), 'neutro'); });
dois($('auSolucao'), () => {
  const t = aula.telas[aulaIdx], st = aulaCod[aulaIdx];
  st.cod = { ...st.cod, ...t.solucao }; st.res = null; aulaOk[aulaIdx] = false; mostraAba(); pintaChecks(); rodaPreview(); atualizaOk();
  falaMascote('Aqui está uma resposta. Agora clique em Verificar!', 'neutro');
}, 'Clique de novo para ver a solução');
$('auConteudo').addEventListener('input', e => {
  if (e.target.id !== 'auEd') return;
  const st = aulaCod[aulaIdx]; st.cod[st.aba] = e.target.value; clearTimeout(aulaTmr); aulaTmr = setTimeout(rodaPreview, 450);
  if (aulaOk[aulaIdx] || st.res){ aulaOk[aulaIdx] = false; st.res = null; pintaChecks(); atualizaOk(); }
});
$('auConteudo').addEventListener('change', e => { if (e.target.name === 'auop') atualizaOk(); });
$('auConteudo').addEventListener('click', e => {
  const tab = e.target.closest('.au-tab'), chip = e.target.closest('.au-chip');
  if (tab){ aulaCod[aulaIdx].aba = tab.dataset.l; mostraAba(); $('auEd').focus(); }
  else if (chip) insereChip(+chip.dataset.k);
  else if (e.target.closest('#auRodar')) rodaPython(aulaCod[aulaIdx].cod.py, []);
  else if (e.target.closest('#auReset')){
    const st = aulaCod[aulaIdx]; st.cod = { ...st.ini }; st.res = null; aulaOk[aulaIdx] = false;
    if ($('auSaida')) $('auSaida').textContent = 'Clique em Executar para ver a saída do seu programa.';
    mostraAba(); pintaChecks(); rodaPreview(); atualizaOk(); falaMascote('Código reiniciado. Pode tentar de novo!', 'neutro');
  }
});
$('auConteudo').addEventListener('keydown', e => {
  if (e.target.id !== 'auEd') return;
  if (e.key === 'Escape'){ aulaSoltaTab = true; return; }
  if (e.key === 'Tab' && !aulaSoltaTab){ e.preventDefault(); const t = e.target; t.setRangeText('  ', t.selectionStart, t.selectionEnd, 'end'); t.dispatchEvent(new Event('input', { bubbles:true })); }
  else if (e.key.length === 1) aulaSoltaTab = false;
});
document.addEventListener('keydown', e => {
  if ($('aula').hidden || e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
  e.preventDefault(); if (!$('auOk').disabled) $('auOk').click();
});

/* =====================================================================
   8) PERFIL (tabela profiles + Storage + Auth)
   ===================================================================== */
let rascunho = {};
function pinta(el, p){
  el.innerHTML = '';
  if (p.avatar_url){ const i = new Image(); i.alt = ''; i.referrerPolicy = 'no-referrer'; i.src = p.avatar_url; i.onerror = () => { el.textContent = ((p.nome||'').trim()[0]||'?').toUpperCase(); }; el.appendChild(i); }
  else el.textContent = ((p.nome||'').trim()[0]||'?').toUpperCase();
}
const mqEsc = matchMedia('(prefers-color-scheme: dark)');
function aplicaTema(t){ document.documentElement.dataset.tema = t === 'auto' ? (mqEsc.matches ? 'escuro' : 'claro') : t; }
mqEsc.addEventListener('change', () => { if (perfil && !$('telaApp').hidden) aplicaTema(perfil.tema); });
function pintaApp(){
  pinta($('avatar'), perfil);
  $('avatar').setAttribute('aria-label', 'Abrir perfil de ' + perfil.nome);
  aplicaTema(perfil.tema); pintaPainel();
}
const temSenha = () => ((usuario.app_metadata && usuario.app_metadata.providers) || [usuario.app_metadata && usuario.app_metadata.provider]).includes('email');

function abrePerfil(){
  rascunho = { ...perfil, fotoBlob:null, remover:false };
  $('nome').value = perfil.nome; $('errnome').textContent = ''; $('nome').classList.remove('erro');
  pinta($('grande'), rascunho); $('remover').hidden = !rascunho.avatar_url;
  $('email').value = usuario.email || ''; $('email').classList.remove('erro'); $('erremail').textContent = '';
  const por = temSenha(); $('email').readOnly = !por; $('detSenha').hidden = !por; $('notaGoogle').hidden = por;
  document.querySelectorAll('input[name=meta]').forEach(r => r.checked = (+r.value === rascunho.meta_diaria));
  document.querySelectorAll('input[name=tema]').forEach(r => r.checked = (r.value === rascunho.tema));
  $('lembrete').checked = rascunho.lembrete; $('hora').value = rascunho.hora_lembrete; $('horaBox').hidden = !rascunho.lembrete;
  $('idioma').value = rascunho.idioma;
  ['senhaAtual','senhaNova','senhaConf'].forEach(i => $(i).value = ''); $('errsenha').textContent = ''; $('detSenha').open = false;
  $('sairConf').hidden = true;
  vai('perfil'); $('voltar').focus({ preventScroll:true });
}
function fechaPerfil(){ aplicaTema(perfil.tema); $('sairConf').hidden = true; vai('painel'); $('avatar').focus(); }
$('avatar').addEventListener('click', abrePerfil);
$('cancelar').addEventListener('click', fechaPerfil); $('voltar').addEventListener('click', fechaPerfil);
$('escolher').addEventListener('click', () => $('arquivo').click());
$('arquivo').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (!f.type.startsWith('image/')){ aviso('Escolha um arquivo de imagem (JPG, PNG...).'); return; }
  if (f.size > 10*1024*1024){ aviso('Essa imagem é muito grande. Escolha uma de até 10 MB.'); return; }
  const r = new FileReader();
  r.onload = () => { const img = new Image();
    img.onload = () => {
      const t = 256, c = document.createElement('canvas'); c.width = c.height = t;
      const l = Math.min(img.width, img.height), sx = (img.width - l)/2, sy = (img.height - l)/2;
      c.getContext('2d').drawImage(img, sx, sy, l, l, 0, 0, t, t);
      c.toBlob(b => {
        if (!b){ aviso('Não consegui preparar essa imagem. Tente outra.'); return; }
        rascunho.fotoBlob = b; rascunho.remover = false;
        pinta($('grande'), { ...rascunho, avatar_url: URL.createObjectURL(b) }); $('remover').hidden = false;
      }, 'image/jpeg', .85);
    };
    img.onerror = () => aviso('Não consegui abrir essa imagem. Tente outra.');
    img.src = r.result; };
  r.onerror = () => aviso('Não consegui ler o arquivo. Tente de novo.');
  r.readAsDataURL(f);
});
$('remover').addEventListener('click', () => {
  rascunho.fotoBlob = null; rascunho.remover = true; rascunho.avatar_url = null;
  pinta($('grande'), { nome: $('nome').value || perfil.nome }); $('remover').hidden = true;
});
$('nome').addEventListener('input', () => { $('nome').classList.remove('erro'); $('errnome').textContent = ''; if (!rascunho.avatar_url && !rascunho.fotoBlob) pinta($('grande'), { nome: $('nome').value }); });
$('email').addEventListener('input', () => { $('email').classList.remove('erro'); $('erremail').textContent = ''; });
$('lembrete').addEventListener('change', () => { $('horaBox').hidden = !$('lembrete').checked; });
$('lembreteTeste').addEventListener('click', async () => {
  const b = $('lembreteTeste'); b.disabled = true; b.textContent = 'Enviando…';
  try{ await chamaFuncao('enviar-lembretes', { teste:true }); aviso('E-mail de teste enviado. Olhe a caixa de entrada e o spam.'); }
  catch(err){ aviso(err.message || 'Não consegui enviar o teste.'); }
  b.disabled = false; b.textContent = 'Enviar e-mail de teste';
});
document.querySelectorAll('input[name=tema]').forEach(r => r.addEventListener('change', () => aplicaTema(r.value)));

function erroSenhaP(m, id){ $('errsenha').textContent = m; $('detSenha').open = true; $(id).focus(); return false; }
function validaSenha(){   // devolve null (não mexeu), false (erro) ou {atual, nova}
  const a = $('senhaAtual').value, n = $('senhaNova').value, c = $('senhaConf').value; $('errsenha').textContent = '';
  if (!a && !n && !c) return null;
  if (!a) return erroSenhaP('Digite sua senha atual.', 'senhaAtual');
  if (n.length < 8) return erroSenhaP('A nova senha precisa ter pelo menos 8 caracteres.', 'senhaNova');
  if (n !== c) return erroSenhaP('A confirmação não é igual à nova senha.', 'senhaConf');
  return { atual: a, nova: n };
}

$('salvar').addEventListener('click', async () => {
  const nome = $('nome').value.trim();
  if (!nome){ $('nome').classList.add('erro'); $('errnome').textContent = 'Digite um nome para continuar.'; $('nome').focus(); return; }
  const por = temSenha(), em = $('email').value.trim();
  if (por && !okEmail(em)){ $('email').classList.add('erro'); $('erremail').textContent = 'Digite um e-mail válido, como voce@email.com.'; $('email').focus(); return; }
  const ps = por ? validaSenha() : null; if (ps === false) return;

  const btn = $('salvar'); btn.disabled = true; btn.textContent = 'Salvando…';
  const notas = [];
  try{
    // senha: confere a atual antes de trocar
    if (ps){
      const { error: e1 } = await sb.auth.signInWithPassword({ email: usuario.email, password: ps.atual });
      if (e1){ erroSenhaP('A senha atual está incorreta.', 'senhaAtual'); return; }
      const { error: e2 } = await sb.auth.updateUser({ password: ps.nova }); if (e2) throw e2;
      notas.push('senha alterada');
    }
    // foto: envia para o Storage (pasta do próprio aluno)
    let avatar_url = perfil.avatar_url;
    const caminho = usuario.id + '/avatar.jpg';
    if (rascunho.fotoBlob){
      const { error } = await sb.storage.from('avatars').upload(caminho, rascunho.fotoBlob, { upsert:true, contentType:'image/jpeg', cacheControl:'3600' });
      if (error) throw error;
      avatar_url = sb.storage.from('avatars').getPublicUrl(caminho).data.publicUrl + '?v=' + Date.now();
    } else if (rascunho.remover){
      await sb.storage.from('avatars').remove([caminho]); avatar_url = null;
    }
    // perfil
    const novo = {
      nome, avatar_url,
      meta_diaria: +document.querySelector('input[name=meta]:checked').value,
      lembrete: $('lembrete').checked, hora_lembrete: $('hora').value || '19:00',
      idioma: $('idioma').value, tema: document.querySelector('input[name=tema]:checked').value
    };
    const { data, error } = await sb.from('profiles').update(novo).eq('id', usuario.id).select().single();
    if (error) throw error;
    perfil = data;
    // e-mail: o Supabase manda um link de confirmação para o endereço novo
    if (por && em !== usuario.email){
      const { error: e3 } = await sb.auth.updateUser({ email: em }, { emailRedirectTo: VOLTA_PARA });
      if (e3) throw e3;
      notas.push('confirme o novo e-mail pelo link que enviamos');
    }
    pintaApp(); fechaPerfil();
    aviso('Perfil salvo!' + (notas.length ? ' (' + notas.join('; ') + ')' : ''));
  } catch (err){ aviso('Não consegui salvar. ' + traduz(err)); }
  finally { btn.disabled = false; btn.textContent = 'Salvar alterações'; }
});

$('sair').addEventListener('click', () => { $('sairConf').hidden = false; $('sairSim').focus(); });
$('sairNao').addEventListener('click', () => { $('sairConf').hidden = true; $('sair').focus(); });
$('sairSim').addEventListener('click', sairDaConta);
$('sairErro').addEventListener('click', sairDaConta);
async function sairDaConta(){
  try{ await flushProjeto(); }catch(e){}
  const { error } = await sb.auth.signOut();
  if (error) aviso('Não consegui sair. ' + traduz(error));
}

/* =====================================================================
   9) PROJETOS: editor ao vivo, salvo na tabela projetos
   ===================================================================== */
const SEED = { html:'<!' + '-- Escreva seu código abaixo --' + '>\n', css:`/* Escreva seu CSS aqui */
`, js:`// Escreva seu JavaScript aqui
` };
const EX = { html:`<h1>Olá, CodeStars!</h1>
<p>Cliques: <b id='n'>0</b></p>
<button id='b'>Clique em mim</button>
`, css:`body {
  font-family: sans-serif;
  text-align: center;
  padding: 40px;
  background: #fffde3;
}
h1 { color: #522580; }
button {
  background: #f2f26b;
  border: 0;
  border-bottom: 5px solid #7ff0c0;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 18px;
  cursor: pointer;
}
`, js:`let n = 0;
document.getElementById('b').addEventListener('click', () => {
  n++;
  document.getElementById('n').textContent = n;
  console.log('Cliques:', n);
});
` };
let cod = { ...SEED }, lang = 'html', tmr, soltaTab = false;
let tmrSalva = null, sujo = false, emVoo = false;

async function criaProjeto(nome, base){
  const b = base || SEED;
  const { data, error } = await sb.from('projetos').insert({ user_id: usuario.id, nome, html: b.html, css: b.css, js: b.js }).select().single();
  if (error) throw error;
  projetos.push(data); return data;
}
function pintaSelect(){
  $('projSel').innerHTML = projetos.map(p => `<option value="${esc(p.id)}" ${p.id===projAtual.id?'selected':''}>${esc(p.nome)}</option>`).join('');
}
function carregaProjeto(p){
  projAtual = p; sujo = false; clearTimeout(tmrSalva);
  cod = { html: p.html, css: p.css, js: p.js };
  $('projNome').value = p.nome; $('stSalvo').textContent = 'Salvo';
  pintaSelect(); mostra(); roda();
}
function agendaSalvar(){ sujo = true; $('stSalvo').textContent = 'Salvando…'; clearTimeout(tmrSalva); tmrSalva = setTimeout(salvaAgora, 900); }
async function salvaAgora(){
  clearTimeout(tmrSalva);
  if (emVoo || !sujo || !projAtual) return;
  emVoo = true; sujo = false;
  const p = projAtual;
  const corpo = { nome: $('projNome').value.trim() || 'Sem nome', html: cod.html, css: cod.css, js: cod.js, atualizado_em: new Date().toISOString() };
  const { error } = await sb.from('projetos').update(corpo).eq('id', p.id);
  emVoo = false;
  if (error){ sujo = true; $('stSalvo').textContent = 'Não salvou. Tentando de novo…'; tmrSalva = setTimeout(salvaAgora, 4000); return; }
  Object.assign(p, corpo);
  if (sujo && p === projAtual) salvaAgora(); else $('stSalvo').textContent = 'Salvo';
}
async function flushProjeto(){
  clearTimeout(tmrSalva);
  while (emVoo) await new Promise(r => setTimeout(r, 50));
  await salvaAgora();
  while (emVoo) await new Promise(r => setTimeout(r, 50));
  return !sujo;
}
document.addEventListener('visibilitychange', () => { if (document.hidden && sb && usuario) salvaAgora(); });
addEventListener('pagehide', () => { if (sb && usuario) salvaAgora(); });

$('projSel').addEventListener('change', async () => {
  const alvo = projetos.find(p => p.id === $('projSel').value);
  if (!(await flushProjeto())){ aviso('Ainda não consegui salvar o projeto atual. Tente de novo em instantes.'); pintaSelect(); return; }
  carregaProjeto(alvo);
});
$('projNome').addEventListener('input', () => {
  const o = $('projSel').selectedOptions[0]; if (o) o.textContent = $('projNome').value.trim() || 'Sem nome';
  agendaSalvar();
});
$('projNovo').addEventListener('click', async () => {
  try{
    if (!(await flushProjeto())){ aviso('Ainda não consegui salvar o projeto atual. Tente de novo.'); return; }
    carregaProjeto(await criaProjeto('Projeto ' + (projetos.length + 1)));
    $('projNome').focus(); $('projNome').select();
  }catch(err){ aviso(traduz(err)); }
});

// IFRAME com o resultado
const FIM = '<' + '/script>';
const PONTE = '<script>' + `(function(){function s(t,a){try{parent.postMessage({cs:1,t:t,m:a.map(function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}['log','warn','error','info'].forEach(function(k){var o=console[k];console[k]=function(){s(k,[].slice.call(arguments));o.apply(console,arguments)}});window.addEventListener('error',function(e){s('error',[e.message])})})();` + FIM;
function monta(){ return '<!DOCTYPE html><html><head><meta charset=utf-8><style>' + cod.css + '</style>' + PONTE + '</head><body>' + cod.html + '<script>' + cod.js + FIM + '</body></html>'; }
function roda(){ $('cons').textContent = ''; $('res').srcdoc = monta(); $('stRes').textContent = 'Atualizado ✓'; }
function mostra(){
  $('ed').value = cod[lang];
  document.querySelectorAll('.aba').forEach(a => { const on = a.dataset.l === lang; a.classList.toggle('on', on); a.setAttribute('aria-selected', on); });
}
$('ed').addEventListener('input', () => {
  cod[lang] = $('ed').value; agendaSalvar();
  clearTimeout(tmr); tmr = setTimeout(roda, 600); $('stRes').textContent = 'Digitando…';
});
$('ed').addEventListener('keydown', e => {
  if (e.key === 'Escape'){ soltaTab = true; return; }
  if (e.key === 'Tab' && !soltaTab){ e.preventDefault(); const t = $('ed'); t.setRangeText('  ', t.selectionStart, t.selectionEnd, 'end'); t.dispatchEvent(new Event('input')); }
  else if (e.key.length === 1) soltaTab = false;
});
$('ed').addEventListener('blur', () => { soltaTab = false; });
document.querySelectorAll('.aba').forEach(a => a.addEventListener('click', () => { lang = a.dataset.l; mostra(); $('ed').focus(); }));
function linhaConsole(c, d){
  const linha = document.createElement('div');
  linha.className = d.t === 'error' ? 'e' : d.t === 'warn' ? 'w' : '';
  linha.textContent = (d.t === 'error' ? '' : '› ') + d.m; c.appendChild(linha);
  while (c.childNodes.length > 200) c.removeChild(c.firstChild);
  c.scrollTop = c.scrollHeight;
}
addEventListener('message', e => {
  const d = e.data; if (!d || !d.cs) return;
  const au = $('auRes');
  if (au && e.source === au.contentWindow){ if (d.cs === 2) resultadoAula(d); else if ($('auCons')) linhaConsole($('auCons'), d); return; }
  if (e.source === $('res').contentWindow && d.cs === 1) linhaConsole($('cons'), d);
});
function dois(btn, fn, msg, pula){
  let t, arm = false; const orig = btn.textContent;
  btn.addEventListener('click', () => {
    if (arm || (pula && pula())){ clearTimeout(t); arm = false; btn.textContent = orig; fn(); return; }
    arm = true; btn.textContent = msg; t = setTimeout(() => { arm = false; btn.textContent = orig; }, 3000);
  });
}
const semCodigo = () => ['html','css','js'].every(k => !cod[k].trim() || cod[k].trim() === SEED[k].trim());
function troca(novo){ cod = { ...novo }; mostra(); roda(); agendaSalvar(); }
dois($('limpar'),  () => troca(SEED), 'Clique de novo para limpar', semCodigo);
dois($('exemplo'), () => troca(EX),   'Clique de novo para trocar', semCodigo);
dois($('projDel'), async () => {
  try{
    const { error } = await sb.from('projetos').delete().eq('id', projAtual.id); if (error) throw error;
    projetos = projetos.filter(p => p.id !== projAtual.id); sujo = false; clearTimeout(tmrSalva);
    if (!projetos.length) await criaProjeto('Meu primeiro projeto');
    carregaProjeto(projetos[projetos.length - 1]); aviso('Projeto excluído.');
  }catch(err){ aviso('Não consegui excluir. ' + traduz(err)); }
}, 'Clique de novo para excluir');
$('exec').addEventListener('click', roda);
$('limpaCons').addEventListener('click', () => { $('cons').textContent = ''; });

/* =====================================================================
   9b) PRATICAR (desafios + quizzes), RANKING GERAL e AJUDA
   ===================================================================== */
const praticaFeita = new Set(), quizMelhor = {};
let praticaAba = 'desafios';
function chavePratica(){ return 'cs-pratica-' + (usuario ? usuario.id : 'anon'); }
function carregaPraticaLocal(){
  praticaFeita.clear(); Object.keys(quizMelhor).forEach(k => delete quizMelhor[k]);
  try{ const s = JSON.parse(localStorage.getItem(chavePratica()) || 'null'); if (s){ (s.desafios || []).forEach(i => praticaFeita.add(i)); Object.assign(quizMelhor, s.quiz || {}); } }catch(e){}
}
function salvaPraticaLocal(){ try{ localStorage.setItem(chavePratica(), JSON.stringify({ desafios:[...praticaFeita], quiz:quizMelhor })); }catch(e){} }

// ---- Praticar
function mostraAbaPratica(a){
  praticaAba = a;
  document.querySelectorAll('.seg-b').forEach(b => { const on = b.dataset.p === a; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('prDesafios').hidden = a !== 'desafios'; $('prQuizzes').hidden = a !== 'quizzes';
}
function pintaPratica(){
  $('prAviso').hidden = praticaOk && (desafios.length > 0 || quizzes.length > 0);
  const rot = { html:'HTML', css:'CSS', js:'JavaScript' };
  const ordem = ['html', 'css', 'js'];
  const agrupa = (lista, chave) => { const g = {}; lista.forEach(x => { const k = chave(x) || 'outros'; (g[k] = g[k] || []).push(x); }); return Object.keys(g).sort((a, b) => (ordem.indexOf(a) + 1 || 9) - (ordem.indexOf(b) + 1 || 9)).map(k => [k, g[k]]); };
  const bloco = (g, linha) => g.map(([k, l]) => (k === 'outros' ? '' : '<h3 class="pr-grupo">' + esc(rot[k] || k) + '</h3>') + '<div class="pr-rows">' + l.map(linha).join('') + '</div>').join('');
  $('prLista').innerHTML = bloco(agrupa(desafios, d => (d.tags || [])[0]), d =>
    `<button class="pr-row" data-id="${esc(d.id)}" type="button"><span class="pr-info"><b>${esc(d.titulo)}</b><span>${esc(d.descricao)}</span></span><span class="pr-meta">${d.nivel === 'facil' ? 'Fácil' : 'Médio'}</span><span class="pr-fim">${praticaFeita.has(d.id) ? ICO('check') : '→'}</span></button>`);
  $('qzLista').innerHTML = bloco(agrupa(quizzes, q => q.modulo), q => {
    const n = q.perguntas.length, m = quizMelhor[q.id];
    return `<button class="pr-row" data-id="${esc(q.id)}" type="button"><span class="pr-info"><b>${esc(q.titulo)}</b><span>${esc(q.descricao)}</span></span><span class="pr-meta">${n} perguntas${m != null ? ' · melhor ' + m + '/' + n : ''}</span><span class="pr-fim">→</span></button>`;
  });
  mostraAbaPratica(praticaAba);
}
document.querySelectorAll('.seg-b').forEach(b => b.addEventListener('click', () => mostraAbaPratica(b.dataset.p)));
$('prLista').addEventListener('click', e => { const c = e.target.closest('.pr-row'); if (c) abreDesafio(c.dataset.id); });
$('qzLista').addEventListener('click', e => { const c = e.target.closest('.pr-row'); if (c) abreQuiz(c.dataset.id); });

function abreDesafio(id){
  const d = desafios.find(x => x.id === id); if (!d) return;
  abreAula({ id:'desafio:' + d.id, titulo:'Desafio: ' + d.titulo, conteudo:d.conteudo, estrelas:0, desafio:true, voltar:'praticar', feita:praticaFeita.has(d.id) });
}

// ---- Quiz
let qzAtual = null, qzIdx = 0, qzAcertos = 0, qzRespondida = false;
function embaralha(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function abreQuiz(id){
  qzAtual = quizzes.find(x => x.id === id); if (!qzAtual) return;
  qzIdx = 0; qzAcertos = 0;
  $('qzLista').hidden = true; $('qzFim').hidden = true; $('qzRun').hidden = false;
  mostraPergunta(); scrollTo(0, 0);
}
function mostraPergunta(){
  const q = qzAtual.perguntas[qzIdx], tot = qzAtual.perguntas.length;
  qzRespondida = false;
  $('qzProg').textContent = 'Pergunta ' + (qzIdx + 1) + ' de ' + tot;
  $('qzBarra').style.width = (qzIdx / tot * 100) + '%';
  $('qzPerg').innerHTML = md(q.p);
  $('qzOps').innerHTML = embaralha(q.opcoes.map((_, i) => i)).map(orig =>
    `<label class="qz-op"><input type="radio" name="qzop" value="${orig}"><span>${md(q.opcoes[orig])}</span></label>`).join('');
  $('qzExp').hidden = true; $('qzVerifica').hidden = false; $('qzVerifica').disabled = true; $('qzProx').hidden = true;
  $('qzPerg').focus({ preventScroll:true });
}
$('qzOps').addEventListener('change', () => { if (!qzRespondida) $('qzVerifica').disabled = false; });
$('qzVerifica').addEventListener('click', () => {
  const sel = document.querySelector('#qzOps input:checked'); if (!sel || qzRespondida) return;
  const q = qzAtual.perguntas[qzIdx], tot = qzAtual.perguntas.length, marcada = +sel.value, certo = marcada === q.certa;
  qzRespondida = true; if (certo) qzAcertos++;
  document.querySelectorAll('#qzOps .qz-op').forEach(l => {
    const inp = l.querySelector('input'), i = +inp.value; inp.disabled = true;
    if (i === q.certa) l.classList.add('certa'); else if (i === marcada) l.classList.add('errada');
  });
  $('qzExp').hidden = false; $('qzExp').innerHTML = (certo ? '<strong>Isso mesmo!</strong> ' : '<strong>Quase!</strong> ') + md(q.explicacao);
  $('qzBarra').style.width = ((qzIdx + 1) / tot * 100) + '%';
  $('qzVerifica').hidden = true; $('qzProx').hidden = false;
  $('qzProx').textContent = qzIdx + 1 < tot ? 'Próxima →' : 'Ver resultado'; $('qzProx').focus();
});
$('qzProx').addEventListener('click', () => { qzIdx++; if (qzIdx < qzAtual.perguntas.length) mostraPergunta(); else fimQuiz(); });
function fimQuiz(){
  const tot = qzAtual.perguntas.length, p = qzAcertos / tot;
  $('qzRun').hidden = true; $('qzFim').hidden = false;
  quizMelhor[qzAtual.id] = Math.max(quizMelhor[qzAtual.id] || 0, qzAcertos); salvaPraticaLocal();
  $('qzFimTit').textContent = qzAtual.titulo + ' concluído!';
  $('qzNota').textContent = qzAcertos + '/' + tot;
  $('qzMsg').textContent = p === 1 ? 'Perfeito! Você acertou tudo!' : p >= .7 ? 'Muito bem! Você está dominando o assunto.' : p >= .4 ? 'Bom começo! Releia as lições e tente de novo.' : 'Sem problema: errar faz parte. Revise a trilha e tente outra vez.';
}
function sairQuiz(){ $('qzRun').hidden = true; $('qzFim').hidden = true; $('qzLista').hidden = false; pintaPratica(); }
$('qzSair').addEventListener('click', sairQuiz); $('qzVolta').addEventListener('click', sairQuiz);
$('qzRefaz').addEventListener('click', () => abreQuiz(qzAtual.id));

// ---- Ranking geral (função ranking_geral no banco)
function avatarEl(r){ const a = document.createElement('span'); a.className = 'rk-av'; a.setAttribute('aria-hidden', 'true'); pinta(a, r); return a; }
function pintaRankingGeral(rows){
  const top = rows.filter(r => Number(r.posicao) <= 3 && Number(r.estrelas) > 0);
  const ordem = [2, 1, 3].map(p => top.find(r => Number(r.posicao) === p)).filter(Boolean);
  const medalha = { 1:'', 2:'', 3:'' };
  $('rkPodio').replaceChildren(...ordem.map(r => {
    const pos = Number(r.posicao), d = document.createElement('div'); d.className = 'pod p' + pos + (r.eu ? ' eu' : ''); d.setAttribute('role', 'listitem');
    const nome = document.createElement('div'); nome.className = 'nome'; nome.textContent = r.nome + (r.eu ? ' (você)' : '');
    const pts = document.createElement('div'); pts.className = 'pts'; pts.textContent = r.estrelas + '';
    const base = document.createElement('div'); base.className = 'pbase'; base.textContent = medalha[pos];
    d.append(avatarEl(r), nome, pts, base); return d;
  }));
  const resto = rows.filter(r => Number(r.posicao) > 3), itens = []; let ult = 3;
  resto.forEach(r => {
    const pos = Number(r.posicao);
    if (pos > ult + 1){ const s = document.createElement('li'); s.className = 'rk-sep'; s.setAttribute('aria-hidden', 'true'); s.textContent = '⋮'; itens.push(s); }
    const li = document.createElement('li'); if (r.eu) li.className = 'eu';
    const p = document.createElement('span'); p.className = 'rk-pos'; p.textContent = pos + 'º';
    const n = document.createElement('span'); n.className = 'rk-nome'; n.textContent = r.nome + (r.eu ? ' (você)' : '');
    const e = document.createElement('span'); e.className = 'rk-pts'; e.textContent = r.estrelas + '';
    li.append(p, avatarEl(r), n, e); itens.push(li); ult = pos;
  });
  $('rkLista').replaceChildren(...itens);
  $('rkLista').parentElement.hidden = itens.length === 0;
  const eu = rows.find(r => r.eu);
  $('rkSua').textContent = !rows.some(r => Number(r.estrelas) > 0) ? 'Ninguém tem estrelas ainda. Conclua uma lição e seja o primeiro!'
    : (eu && Number(eu.estrelas) > 0) ? 'Você está em ' + Number(eu.posicao) + 'º lugar, com ' + eu.estrelas + '.' : 'Conclua uma lição para entrar no ranking!';
}
async function carregaRankingGeral(){
  $('rkAviso').hidden = true;
  const { data, error } = await sb.rpc('ranking_geral', { p_limite: 20 });
  if (error){
    $('rkAviso').hidden = false; $('rkPodio').replaceChildren(); $('rkLista').replaceChildren(); $('rkLista').parentElement.hidden = true; $('rkSua').textContent = '';
    $('rkAviso').innerHTML = /function|schema cache|could not find/i.test(error.message || '')
      ? '<strong>O ranking geral ainda não foi instalado no banco.</strong> No Supabase, abra o <strong>SQL Editor</strong>, rode o arquivo <strong>praticar-ranking-ajuda.sql</strong> e recarregue esta página.'
      : 'Não consegui carregar o ranking agora. ' + esc(traduz(error));
    return;
  }
  pintaRankingGeral(data || []);
}

// ---- Ajuda
// chama uma função do Supabase (Edge Function) como o aluno logado
async function chamaFuncao(nome, corpo){
  const { data:{ session } } = await sb.auth.getSession();
  if (!session) throw new Error('Entre na sua conta de novo e tente outra vez.');
  const r = await fetch(URL_LIMPA + '/functions/v1/' + nome, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + session.access_token, 'apikey':SUPABASE_ANON_KEY.trim() },
    body: JSON.stringify(corpo), signal: AbortSignal.timeout(30000)
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erro || 'Não consegui enviar o e-mail agora.');
  return d;
}
const ASSUNTOS = { duvida:'Dúvida', problema:'Problema técnico', sugestao:'Sugestão', outro:'Outro' };
document.querySelectorAll('[data-aj]').forEach(b => b.addEventListener('click', () => $(b.dataset.aj).scrollIntoView({ behavior: rmov ? 'auto' : 'smooth', block:'start' })));
$('ajMsg').addEventListener('input', () => { $('ajConta').textContent = $('ajMsg').value.length + '/1000'; $('ajErro').textContent = ''; });
async function carregaMensagens(){
  const box = $('ajMsgs');
  const { data, error } = await sb.from('mensagens_ajuda').select('assunto,mensagem,criado_em').order('criado_em', { ascending:false }).limit(5);
  if (error || !data || !data.length){ box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = '<h3>Suas mensagens enviadas</h3>' + data.map(m =>
    `<div class="msg-item"><strong>${esc(ASSUNTOS[m.assunto] || m.assunto)}</strong> · ${esc(new Date(m.criado_em).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }))}<br>${esc(m.mensagem)}</div>`).join('');
}
$('ajForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('ajMsg').value.trim(), er = $('ajErro'); er.textContent = '';
  if (msg.length < 10){ er.textContent = 'Escreva pelo menos 10 caracteres para a gente entender.'; $('ajMsg').focus(); return; }
  const btn = $('ajEnviar'); btn.disabled = true; btn.textContent = 'Enviando…';
  const assunto = $('ajAssunto').value;
  const { error } = await sb.from('mensagens_ajuda').insert({ user_id: usuario.id, assunto, mensagem: msg });
  if (error){
    btn.disabled = false; btn.textContent = 'Enviar mensagem';
    er.textContent = /relation|schema cache|does not exist|could not find/i.test(error.message || '')
      ? 'O formulário ainda não foi instalado no banco (rode o praticar-ranking-ajuda.sql no Supabase).' : traduz(error);
    return;
  }
  let enviado = true;   // a mensagem já está salva; agora ela também vai por e-mail
  try{ await chamaFuncao('fale-conosco', { assunto, mensagem: msg }); }catch(err){ enviado = false; console.warn(err); }
  btn.disabled = false; btn.textContent = 'Enviar mensagem';
  $('ajMsg').value = ''; $('ajConta').textContent = '0/1000';
  aviso(enviado ? 'Mensagem enviada! Obrigado por escrever.' : 'Mensagem salva, mas o e-mail não saiu agora. Vamos ver por aqui.'); carregaMensagens();
});


/* =====================================================================
   10) ENTRAR / SAIR  (reage ao Supabase Auth)
   ===================================================================== */
let entrando = false;
async function entrou(user){
  usuario = user; telaDe('carregando');
  $('cargaErro').hidden = true; $('splTxt').hidden = false;
  try{
    await carregaTudo(); carregaPraticaLocal();
    moduloSel = null; editorIniciado = false;
    pintaApp(); telaDe('app'); vai('painel');
  }catch (err){
    console.error(err);
    $('splTxt').hidden = true; $('cargaErro').hidden = false;
  }
}
function saiu(avisar){
  $('aula').hidden = true; $('proj').hidden = true; document.documentElement.classList.remove('au-aberta');
  usuario = null; projetosFinais = []; envios = []; perfil = null; projetos = []; projAtual = null; feitas = new Set(); editorIniciado = false;
  $('res').srcdoc = ''; $('lgSenha').value = ''; $('lgNova').value = ''; $('lgNova2').value = '';
  telaDe('login'); modo('entrar');
  if (avisar) aviso('Você saiu da conta. Até a próxima lição!');
}
$('tentar').addEventListener('click', () => { if (usuario) entrou(usuario); });

async function tratar(evento, sessao){
  if (recuperando){ telaDe('login'); modo('novasenha'); return; }
  if (evento === 'PASSWORD_RECOVERY'){ recuperando = true; telaDe('login'); modo('novasenha'); return; }
  if (sessao && sessao.user){
    if (usuario && usuario.id === sessao.user.id){ usuario = sessao.user; return; }   // renovação de token etc.
    if (entrando) return;
    entrando = true; await entrou(sessao.user); entrando = false;
  } else if (evento === 'SIGNED_OUT' || evento === 'INITIAL_SESSION'){
    saiu(evento === 'SIGNED_OUT');
  }
}

(function iniciar(){
  telaDe('carregando'); modo('entrar');
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (!sb){ telaDe('login'); $('avisoConfig').hidden = false; return; }
  sb.auth.onAuthStateChange((evento, sessao) => { setTimeout(() => tratar(evento, sessao), 0); });
  if (h.get('error_description')){
    history.replaceState(null, '', location.pathname);
    setTimeout(() => erroL('lgErroGeral', 'Esse link não vale mais (ele expira). Peça um novo.'), 300);
  }
})();

/* =====================================================================
   10) EFEITOS DA PÁGINA DE LOGIN (aparecer ao rolar, botão "Criar conta grátis")
   ===================================================================== */
/* Login: cada item aparece, em sequência, conforme a página desce */
(function(){
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var alvos = '#telaLogin .lp h2, #telaLogin .lp .lead, #telaLogin .lp-passos li, #telaLogin .lp-lista > div, #telaLogin .lp-nota, #telaLogin .rodape > *, #telaLogin .base';
  document.querySelectorAll(alvos).forEach(function(el){
    el.classList.add('rv');
    if (el.matches('.lp-passos li, .lp-lista > div')) el.classList.add('esq');
    if (!el.style.getPropertyValue('--d')){
      var irmaos = Array.prototype.filter.call(el.parentNode.children, function(x){ return x.matches(alvos); });
      el.style.setProperty('--d', (irmaos.indexOf(el) * .14) + 's');
    }
  });
  var els = document.querySelectorAll('#telaLogin .rv');
  if (reduz || !('IntersectionObserver' in window)){
    els.forEach(function(e){ e.classList.add('vis'); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('vis'); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function(e){ io.observe(e); });
  }
  var b = document.getElementById('lpCriar');
  if (b) b.addEventListener('click', function(){
    modo('criar');
    window.scrollTo({ top: 0, behavior: reduz ? 'auto' : 'smooth' });
    setTimeout(function(){ var n = document.getElementById('lgNome'); if (n) n.focus({ preventScroll: true }); }, 500);
  });
})();
