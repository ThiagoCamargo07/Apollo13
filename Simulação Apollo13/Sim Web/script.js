const canvas = document.getElementById("simulador");
const ctx = canvas.getContext("2d");
const loginScreen = document.getElementById("loginScreen");
const simulacaoPage = document.getElementById("simulacaoPage");
const loginForm = document.getElementById("loginForm");

let simulacaoIniciada = false;

// =========================
// CONFIGURAÇÕES DA TELA
// =========================
const LARGURA = 1400;
const ALTURA = 800;
const PAINEL = 390;

// =========================
// CORES
// =========================
const FUNDO = "#020616";
const PAINEL_COR = "#04081c";
const AZUL = "#3cc8ff";
const AMARELO = "#ffd246";
const VERDE = "#50ff78";
const VERMELHO = "#ff2323";
const BRANCO = "#ebebeb";
const CINZA = "#828296";
const CINZA_ESCURO = "#3c3c5a";

// =========================
// DADOS APROXIMADOS
// =========================
const DIST_TERRA_LUA = 384400;
const VEL_ORBITAL = 7800;
const VEL_ESCAPE = 11200;
const TEMPO_MEDIO = 72;

// =========================
// POSIÇÕES VISUAIS
// =========================
const terraPos = { x: 850, y: 570 };
const luaPos = { x: 850, y: 115 };

const raioTerra = 55;
const raioLua = 30;

const raioOrbitaTerra = 90;
const raioOrbitaLua = 52;
const raioOrbitaTerraNave = raioOrbitaTerra - 12;

const pontoSaidaTerra = { x: 790, y: 505 };
const pontoEntradaLuaDireita = { x: luaPos.x + raioOrbitaLua, y: luaPos.y };
const pontoSaidaLuaEsquerda = { x: luaPos.x - raioOrbitaLua, y: luaPos.y };
const pontoEntradaTerra = {
  x: terraPos.x + 35,
  y: terraPos.y - raioOrbitaTerraNave
};

// =========================
// ESTADO DA SIMULAÇÃO
// =========================
let fase = "LANÇAMENTO";
let tempo = 0;
let dt = 25;
let progresso = 0;
let velocidade = VEL_ORBITAL;

let voltasTerra = 0;
let voltasLua = 0;
let voltasTerraObjetivo = 3.30;
let voltasLuaObjetivo = 2.5;

let anguloTerra = -Math.PI / 2;
let anguloLua = 0;

let nave = { ...terraPos };
let distTerraKm = 0;
let distLuaKm = 0;

let pontoSaidaTransferencia = { ...pontoSaidaTerra };
let pontoSaidaRetorno = { ...pontoSaidaLuaEsquerda };

const botaoReiniciar = {
  x: 20,
  y: 760,
  largura: 180,
  altura: 30
};

// =========================
// ESTRELAS
// =========================
const estrelas = [];

for (let i = 0; i < 320; i++) {
  estrelas.push({
    x: Math.random() * (LARGURA - PAINEL - 5) + PAINEL + 5,
    y: Math.random() * ALTURA,
    r: Math.random() > 0.85 ? 2 : 1
  });
}

// =========================
// FUNÇÕES AUXILIARES
// =========================
function texto(msg, x, y, cor = BRANCO, tamanho = 14, negrito = false) {
  ctx.fillStyle = cor;
  ctx.font = `${negrito ? "bold" : "normal"} ${tamanho}px Consolas, monospace`;
  ctx.fillText(String(msg), x, y);
}

function bezier(p0, p1, p2, t) {
  t = Math.max(0, Math.min(1, t));

  return {
    x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
    y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y
  };
}

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function linha(p1, p2, cor, largura = 1) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function circulo(x, y, raio, cor, preenchido = true, largura = 1) {
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2);

  if (preenchido) {
    ctx.fillStyle = cor;
    ctx.fill();
  } else {
    ctx.strokeStyle = cor;
    ctx.lineWidth = largura;
    ctx.stroke();
  }
}

function elipse(x, y, rx, ry, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function linhaTracejada(p1, p2, cor, tamanho = 8) {
  ctx.save();
  ctx.setLineDash([tamanho, tamanho]);
  linha(p1, p2, cor, 1);
  ctx.restore();
}

function circuloTracejado(centro, raio, cor) {
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centro.x, centro.y, raio, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// =========================
// DESENHOS PRINCIPAIS
// =========================
function desenharEstrelas() {
  estrelas.forEach((estrela) => {
    circulo(estrela.x, estrela.y, estrela.r, "#9696aa");
  });
}

function desenharTerra() {
  circulo(terraPos.x, terraPos.y, raioTerra + 7, "#052878");
  circulo(terraPos.x, terraPos.y, raioTerra, "#004bb9");
  circulo(terraPos.x, terraPos.y, raioTerra, "#00dcff", false, 2);

  elipse(terraPos.x - 13, terraPos.y - 7, 25, 13, "#3cb45a");
  elipse(terraPos.x + 24, terraPos.y + 19, 19, 11, "#46be64");
  elipse(terraPos.x, terraPos.y - 32, 25, 6, "#ebebeb");
}

function desenharLua() {
  circulo(luaPos.x, luaPos.y, raioLua, "#878787");
  circulo(luaPos.x, luaPos.y, raioLua, "#e6e6e6", false, 2);

  circulo(luaPos.x - 9, luaPos.y - 6, 6, "#5a5a5a");
  circulo(luaPos.x + 10, luaPos.y + 8, 5, "#606060");
  circulo(luaPos.x + 2, luaPos.y - 15, 3, "#505050");
}

function desenharFoguete(pos, angulo) {
  const tam = 22;

  const ponta = {
    x: pos.x + Math.cos(angulo) * tam,
    y: pos.y + Math.sin(angulo) * tam
  };

  const esquerda = {
    x: pos.x + Math.cos(angulo + 2.5) * tam * 0.75,
    y: pos.y + Math.sin(angulo + 2.5) * tam * 0.75
  };

  const direita = {
    x: pos.x + Math.cos(angulo - 2.5) * tam * 0.75,
    y: pos.y + Math.sin(angulo - 2.5) * tam * 0.75
  };

  ctx.fillStyle = BRANCO;
  ctx.beginPath();
  ctx.moveTo(ponta.x, ponta.y);
  ctx.lineTo(esquerda.x, esquerda.y);
  ctx.lineTo(direita.x, direita.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#aaaaaa";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function desenharTrajetoriaFixa() {
  circulo(terraPos.x, terraPos.y, raioOrbitaTerra - 15, VERMELHO, false, 2);
  circulo(terraPos.x, terraPos.y, raioOrbitaTerra - 8, VERMELHO, false, 2);
  circulo(luaPos.x, luaPos.y, raioOrbitaLua, VERMELHO, false, 2);

  let anterior = null;

  for (let i = 0; i < 160; i++) {
    const t = i / 159;
    const ponto = bezier(pontoSaidaTerra, { x: 690, y: 330 }, pontoEntradaLuaDireita, t);

    if (anterior) linha(anterior, ponto, VERMELHO, 2);
    anterior = ponto;
  }

  anterior = null;

  for (let i = 0; i < 160; i++) {
    const t = i / 159;
    const ponto = bezier(pontoSaidaLuaEsquerda, { x: 1030, y: 330 }, pontoEntradaTerra, t);

    if (anterior) linha(anterior, ponto, VERMELHO, 2);
    anterior = ponto;
  }
}

// =========================
// INTERFACE
// =========================
function desenharPainel() {
  ctx.fillStyle = PAINEL_COR;
  ctx.fillRect(0, 0, PAINEL, ALTURA);

  linha({ x: PAINEL, y: 0 }, { x: PAINEL, y: ALTURA }, "#373c64", 2);

  texto("SIMULAÇÃO APOLLO 13", 20, 25, AZUL, 17, true);
  linha({ x: 15, y: 48 }, { x: PAINEL - 15, y: 48 }, CINZA_ESCURO);

  texto("DADOS REAIS APROXIMADOS", 20, 80, AMARELO);
  texto(`Distância média Terra-Lua: ${DIST_TERRA_LUA} km`, 20, 110);
  texto(`Velocidade orbital baixa: ${VEL_ORBITAL} m/s`, 20, 140);
  texto(`Velocidade de escape Terra: ${VEL_ESCAPE} m/s`, 20, 170);
  texto(`Tempo médio ida Lua: ${TEMPO_MEDIO} horas`, 20, 200);

  linha({ x: 15, y: 225 }, { x: PAINEL - 15, y: 225 }, CINZA_ESCURO);

  texto("SIMULAÇÃO", 20, 260, AZUL);
  texto(`Fase atual: ${fase}`, 20, 290, AMARELO);
  texto(`Tempo simulado: ${tempo.toFixed(0)} s (${(tempo / 3600).toFixed(0)}h ${Math.floor((tempo % 3600) / 60)}m)`, 20, 320);
  texto(`Velocidade atual: ${velocidade.toFixed(0)} m/s`, 20, 350);

  texto(
    `Voltas ao redor da Terra: ${voltasTerra.toFixed(1)} / ${voltasTerraObjetivo}`,
    20,
    380,
    voltasTerra >= voltasTerraObjetivo ? VERDE : BRANCO
  );

  texto(
    `Voltas ao redor da Lua: ${voltasLua.toFixed(1)} / ${voltasLuaObjetivo}`,
    20,
    410,
    voltasLua >= voltasLuaObjetivo ? VERDE : BRANCO
  );

  linha({ x: 15, y: 435 }, { x: PAINEL - 15, y: 435 }, CINZA_ESCURO);

  texto("DISTÂNCIAS E ALTITUDES", 20, 470, AZUL);
  texto(`Distância até a Terra: ${distTerraKm.toFixed(0)} km`, 20, 500);
  texto(`Distância até a Lua: ${distLuaKm.toFixed(0)} km`, 20, 530);
  texto(`Altitude em relação à Terra: ${Math.max(distTerraKm - 6371, 0).toFixed(0)} km`, 20, 560);
  texto(`Altitude em relação à Lua: ${Math.max(distLuaKm - 1737, 0).toFixed(0)} km`, 20, 590);

  linha({ x: 15, y: 615 }, { x: PAINEL - 15, y: 615 }, CINZA_ESCURO);

  texto("PARÂMETROS DA SIMULAÇÃO", 20, 650, AZUL);
  texto("Velocidade fixa: 7800 m/s", 20, 680);
  texto("dt: 25 s por frame", 20, 710);
  texto("Rastro dinâmico: DESATIVADO", 20, 740);
}

function desenharProgresso() {
  const y = 720;
  const x0 = 430;
  const largura = 880;

  const etapas = [
    "LANÇAMENTO",
    "ÓRBITA DA TERRA",
    "TRANSFERÊNCIA\nPARA A LUA",
    "ÓRBITA DA LUA",
    "RETORNO À TERRA"
  ];

  texto("PROGRESSO DA MISSÃO", 740, 675, AZUL, 11);
  linha({ x: x0, y }, { x: x0 + largura, y }, CINZA_ESCURO, 2);

  const fases = {
    "LANÇAMENTO": 0,
    "ÓRBITA DA TERRA": 1,
    "TRANSFERÊNCIA PARA A LUA": 2,
    "ÓRBITA DA LUA": 3,
    "RETORNO À TERRA": 4,
    "SIMULAÇÃO CONCLUÍDA": 5
  };

  const faseAtual = fases[fase];

  etapas.forEach((nome, i) => {
    const px = x0 + (largura / 4) * i;

    let cor = CINZA;

    if (fase === "SIMULAÇÃO CONCLUÍDA") cor = VERDE;
    else if (i < faseAtual) cor = VERDE;
    else if (i === faseAtual) cor = AMARELO;

    circulo(px, y, 6, cor);

    const linhas = nome.split("\n");

    linhas.forEach((linhaTxt, j) => {
      texto(linhaTxt, px - 50, y + 25 + j * 14, cor, 11);
    });

    if (fase === "SIMULAÇÃO CONCLUÍDA" || i < faseAtual) {
      texto("✓ Concluído", px - 35, y + 55, VERDE, 11);
    } else if (i === faseAtual) {
      texto("Em andamento", px - 38, y + 55, AMARELO, 11);
    }
  });
}

function desenharEscalaTempo() {
  const x = 1185;
  const y = 20;

  ctx.strokeStyle = "#081023";
  ctx.strokeRect(x, y, 190, 88);

  texto("ESCALA DE TEMPO", x + 18, y + 18, AZUL, 11);
  texto("1 segundo simulado", x + 18, y + 43, BRANCO, 11);
  texto("25 segundos reais", x + 18, y + 61, BRANCO, 11);
  texto("(Aceleração 25x)", x + 18, y + 79, VERDE, 11);
}

function desenharBotaoReiniciar() {
  ctx.fillStyle = VERDE;
  ctx.fillRect(botaoReiniciar.x, botaoReiniciar.y, botaoReiniciar.largura, botaoReiniciar.altura);

  texto("REINICIAR SIMULAÇÃO", botaoReiniciar.x + 18, botaoReiniciar.y + 20, "#000000", 14);
  texto("SIMULAÇÃO CONCLUÍDA COM SUCESSO", 520, 90, VERDE, 17, true);
}

// =========================
// CONTROLE DA SIMULAÇÃO
// =========================
function reiniciarSimulacao() {
  fase = "LANÇAMENTO";
  tempo = 0;
  progresso = 0;
  velocidade = VEL_ORBITAL;

  voltasTerra = 0;
  voltasLua = 0;

  anguloTerra = -Math.PI / 2;
  anguloLua = 0;

  nave = { ...terraPos };
  distTerraKm = 0;
  distLuaKm = 0;

  pontoSaidaTransferencia = { ...pontoSaidaTerra };
  pontoSaidaRetorno = { ...pontoSaidaLuaEsquerda };
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;

  const mouse = {
    x: (event.clientX - rect.left) * escalaX,
    y: (event.clientY - rect.top) * escalaY
  };

  const clicouNoBotao =
    mouse.x >= botaoReiniciar.x &&
    mouse.x <= botaoReiniciar.x + botaoReiniciar.largura &&
    mouse.y >= botaoReiniciar.y &&
    mouse.y <= botaoReiniciar.y + botaoReiniciar.altura;

  if (fase === "SIMULAÇÃO CONCLUÍDA" && clicouNoBotao) {
    reiniciarSimulacao();
  }
});

// =========================
// LOOP PRINCIPAL
// =========================
function loop() {
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  desenharEstrelas();

  if (fase !== "SIMULAÇÃO CONCLUÍDA") {
    tempo += dt;
  }

  if (fase === "LANÇAMENTO") {
    progresso += 0.015;

    nave = bezier(terraPos, { x: 830, y: 535 }, pontoSaidaTerra, progresso);

    if (progresso >= 1) {
      fase = "ÓRBITA DA TERRA";
      progresso = 0;
      anguloTerra = Math.atan2(nave.y - terraPos.y, nave.x - terraPos.x);
    }
  } else if (fase === "ÓRBITA DA TERRA") {
    anguloTerra -= 0.035;

    nave = {
      x: terraPos.x + Math.cos(anguloTerra) * raioOrbitaTerraNave,
      y: terraPos.y + Math.sin(anguloTerra) * raioOrbitaTerraNave
    };

    voltasTerra = Math.abs(anguloTerra) / (2 * Math.PI);

    if (voltasTerra >= voltasTerraObjetivo) {
      fase = "TRANSFERÊNCIA PARA A LUA";
      progresso = 0;
      pontoSaidaTransferencia = { ...nave };
    }
  } else if (fase === "TRANSFERÊNCIA PARA A LUA") {
    progresso += 0.003;

    nave = bezier(pontoSaidaTransferencia, { x: 690, y: 330 }, pontoEntradaLuaDireita, progresso);

    if (progresso >= 1) {
      fase = "ÓRBITA DA LUA";
      progresso = 0;
      anguloLua = 0;
    }
  } else if (fase === "ÓRBITA DA LUA") {
    anguloLua -= 0.035;

    nave = {
      x: luaPos.x + Math.cos(anguloLua) * raioOrbitaLua,
      y: luaPos.y + Math.sin(anguloLua) * raioOrbitaLua
    };

    voltasLua = Math.abs(anguloLua) / (2 * Math.PI);

    if (voltasLua >= voltasLuaObjetivo) {
      fase = "RETORNO À TERRA";
      progresso = 0;
      pontoSaidaRetorno = { ...pontoSaidaLuaEsquerda };
    }
  } else if (fase === "RETORNO À TERRA") {
    progresso += 0.003;

    nave = bezier(pontoSaidaRetorno, { x: 1030, y: 330 }, pontoEntradaTerra, progresso);

    if (progresso >= 1) {
      progresso = 1;
      nave = { ...pontoEntradaTerra };
      velocidade = 0;
      fase = "SIMULAÇÃO CONCLUÍDA";
    }
  }

  linhaTracejada(terraPos, luaPos, "#505069");
  circuloTracejado(terraPos, raioOrbitaTerra, AZUL);
  circuloTracejado(luaPos, raioOrbitaLua, CINZA);

  desenharTrajetoriaFixa();
  desenharTerra();
  desenharLua();

  texto("LUA", luaPos.x - 15, luaPos.y - 48, BRANCO, 11);
  texto("TERRA", terraPos.x - 25, terraPos.y + 70, BRANCO, 11);

  texto("384400 km", terraPos.x + 15, 340, CINZA, 11);
  texto("(média)", terraPos.x + 20, 356, CINZA, 11);

  let ang = -Math.PI / 2;

  if (fase === "ÓRBITA DA TERRA") {
    ang = anguloTerra - Math.PI / 2;
  } else if (fase === "ÓRBITA DA LUA") {
    ang = anguloLua - Math.PI / 2;
  } else if (fase === "TRANSFERÊNCIA PARA A LUA") {
    ang = Math.atan2(pontoEntradaLuaDireita.y - nave.y, pontoEntradaLuaDireita.x - nave.x);
  } else if (fase === "RETORNO À TERRA") {
    ang = Math.atan2(pontoEntradaTerra.y - nave.y, pontoEntradaTerra.x - nave.x);
  }

  desenharFoguete(nave, ang);

  if (fase !== "SIMULAÇÃO CONCLUÍDA") {
    distTerraKm = distancia(nave, terraPos) * 800;
    distLuaKm = distancia(nave, luaPos) * 800;
  }

  desenharPainel();
  desenharEscalaTempo();
  desenharProgresso();

  if (fase === "SIMULAÇÃO CONCLUÍDA") {
    desenharBotaoReiniciar();
  }

  requestAnimationFrame(loop);
}

loginForm.addEventListener("submit", function(event) {
  event.preventDefault();

  loginScreen.classList.add("hidden");
  simulacaoPage.classList.remove("hidden");

  if (!simulacaoIniciada) {
    simulacaoIniciada = true;
    loop();
  }
});
