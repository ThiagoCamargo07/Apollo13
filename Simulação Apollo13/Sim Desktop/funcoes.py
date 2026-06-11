import pygame
import math
import random

# =========================
# CONFIGURAÇÕES GERAIS
# =========================
LARGURA, ALTURA = 1400, 800
PAINEL = 390

# =========================
# CORES
# =========================
FUNDO = (2, 6, 22)
PAINEL_COR = (4, 8, 28)
AZUL = (60, 200, 255)
AMARELO = (255, 210, 70)
VERDE = (80, 255, 120)
VERMELHO = (255, 35, 35)
BRANCO = (235, 235, 235)
CINZA = (130, 130, 150)
CINZA_ESCURO = (60, 60, 90)

# =========================
# DADOS DA MISSÃO
# =========================
DIST_TERRA_LUA = 384400
VEL_ORBITAL = 7800
VEL_ESCAPE = 11200
TEMPO_MEDIO = 72

# =========================
# POSIÇÕES VISUAIS
# =========================
terra_pos = (850, 570)
lua_pos = (850, 115)

raio_terra = 55
raio_lua = 30

raio_orbita_terra = 90
raio_orbita_lua = 52
raio_orbita_terra_nave = raio_orbita_terra - 12

ponto_saida_terra = (790, 505)
ponto_entrada_lua_direita = (lua_pos[0] + raio_orbita_lua, lua_pos[1])
ponto_saida_lua_esquerda = (lua_pos[0] - raio_orbita_lua, lua_pos[1])
ponto_entrada_terra = (terra_pos[0] + 35, terra_pos[1] - raio_orbita_terra_nave)

# =========================
# FONTES
# =========================
fonte = pygame.font.SysFont("consolas", 14)
fonte_pequena = pygame.font.SysFont("consolas", 11)
fonte_titulo = pygame.font.SysFont("consolas", 17, bold=True)


def gerar_estrelas():
    estrelas = []

    for _ in range(320):
        estrelas.append((
            random.randint(PAINEL + 5, LARGURA - 5),
            random.randint(0, ALTURA),
            random.choice([1, 1, 1, 2])
        ))

    return estrelas


def texto(tela, msg, x, y, cor=BRANCO, fonte_usada=fonte):
    img = fonte_usada.render(str(msg), True, cor)
    tela.blit(img, (x, y))


def bezier(p0, p1, p2, t):
    t = max(0, min(1, t))

    x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
    y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]

    return x, y


def distancia_px(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def linha_tracejada(tela, p1, p2, cor, tam=8):
    x1, y1 = p1
    x2, y2 = p2

    dx = x2 - x1
    dy = y2 - y1
    dist = math.hypot(dx, dy)

    if dist == 0:
        return

    passos = max(1, int(dist / tam))

    for i in range(0, passos, 2):
        t1 = i / passos
        t2 = min((i + 1) / passos, 1)

        a = (x1 + dx * t1, y1 + dy * t1)
        b = (x1 + dx * t2, y1 + dy * t2)

        pygame.draw.line(tela, cor, a, b, 1)


def circulo_tracejado(tela, centro, raio, cor):
    partes = 90

    for i in range(partes):
        if i % 2 == 0:
            a1 = 2 * math.pi * i / partes
            a2 = 2 * math.pi * (i + 1) / partes

            p1 = (centro[0] + math.cos(a1) * raio,centro[1] + math.sin(a1) * raio)
            p2 = (centro[0] + math.cos(a2) * raio,centro[1] + math.sin(a2) * raio)

            pygame.draw.line(tela, cor, p1, p2, 1)


def desenhar_terra(tela):
    pygame.draw.circle(tela, (5, 40, 120), terra_pos, raio_terra + 7)
    pygame.draw.circle(tela, (0, 75, 185), terra_pos, raio_terra)
    pygame.draw.circle(tela, (0, 220, 255), terra_pos, raio_terra, 2)

    pygame.draw.ellipse(tela, (60, 180, 90), (terra_pos[0] - 38, terra_pos[1] - 20, 50, 26))
    pygame.draw.ellipse(tela, (70, 190, 100), (terra_pos[0] + 5, terra_pos[1] + 8, 38, 22))
    pygame.draw.ellipse(tela, (235, 235, 235), (terra_pos[0] - 25, terra_pos[1] - 38, 50, 12))


def desenhar_lua(tela):
    pygame.draw.circle(tela, (135, 135, 135), lua_pos, raio_lua)
    pygame.draw.circle(tela, (230, 230, 230), lua_pos, raio_lua, 2)

    pygame.draw.circle(tela, (90, 90, 90), (lua_pos[0] - 9, lua_pos[1] - 6), 6)
    pygame.draw.circle(tela, (95, 95, 95), (lua_pos[0] + 10, lua_pos[1] + 8), 5)
    pygame.draw.circle(tela, (80, 80, 80), (lua_pos[0] + 2, lua_pos[1] - 15), 3)


def desenhar_foguete(tela, pos, angulo):
    x, y = pos
    tam = 22

    ponta = (x + math.cos(angulo) * tam,y + math.sin(angulo) * tam)

    esq = (x + math.cos(angulo + 2.5) * tam * 0.75,y + math.sin(angulo + 2.5) * tam * 0.75)

    dir = (x + math.cos(angulo - 2.5) * tam * 0.75,y + math.sin(angulo - 2.5) * tam * 0.75)

    pygame.draw.polygon(tela, BRANCO, [ponta, esq, dir])
    pygame.draw.polygon(tela, (170, 170, 170), [ponta, esq, dir], 1)


def desenhar_trajetoria_fixa(tela):
    pygame.draw.circle(tela, VERMELHO, terra_pos, raio_orbita_terra - 15, 2)
    pygame.draw.circle(tela, VERMELHO, terra_pos, raio_orbita_terra - 8, 2)

    pygame.draw.circle(tela, VERMELHO, lua_pos, raio_orbita_lua, 2)

    pontos_ida = []
    for i in range(160):
        t = i / 159
        pontos_ida.append(
            bezier(
                ponto_saida_terra,
                (690, 330),
                ponto_entrada_lua_direita,
                t
            )
        )

    pontos_volta = []
    for i in range(160):
        t = i / 159
        pontos_volta.append(
            bezier(
                ponto_saida_lua_esquerda,
                (1030, 330),
                ponto_entrada_terra,
                t
            )
        )

    for i in range(1, len(pontos_ida)):
        pygame.draw.line(tela, VERMELHO, pontos_ida[i - 1], pontos_ida[i], 2)

    for i in range(1, len(pontos_volta)):
        pygame.draw.line(tela, VERMELHO, pontos_volta[i - 1], pontos_volta[i], 2)


def desenhar_painel(
    tela,
    fase,
    tempo,
    velocidade,
    voltas_terra,
    voltas_lua,
    voltas_terra_objetivo,
    voltas_lua_objetivo,
    dist_terra,
    dist_lua
):
    pygame.draw.rect(tela, PAINEL_COR, (0, 0, PAINEL, ALTURA))
    pygame.draw.line(tela, (55, 60, 100), (PAINEL, 0), (PAINEL, ALTURA), 2)

    texto(tela, "SIMULAÇÃO APOLLO 13", 20, 20, AZUL, fonte_titulo)
    pygame.draw.line(tela, CINZA_ESCURO, (15, 48), (PAINEL - 15, 48), 1)

    texto(tela, "DADOS REAIS APROXIMADOS", 20, 70, AMARELO)
    texto(tela, "Distância média Terra-Lua: 384400 km", 20, 100)
    texto(tela, "Velocidade orbital baixa: 7800 m/s", 20, 130)
    texto(tela, "Velocidade de escape Terra: 11200 m/s", 20, 160)
    texto(tela, "Tempo médio ida Lua: 72 horas", 20, 190)

    pygame.draw.line(tela, CINZA_ESCURO, (15, 225), (PAINEL - 15, 225), 1)

    texto(tela, "SIMULAÇÃO", 20, 250, AZUL)
    texto(tela, f"Fase atual: {fase}", 20, 280, AMARELO)
    texto(tela, f"Tempo simulado: {tempo:.0f} s ({tempo / 3600:.0f}h {int((tempo % 3600) / 60)}m)", 20, 310)
    texto(tela, f"Velocidade atual: {velocidade:.0f} m/s", 20, 340)

    cor_terra = VERDE if voltas_terra >= voltas_terra_objetivo else BRANCO
    cor_lua = VERDE if voltas_lua >= voltas_lua_objetivo else BRANCO

    texto(tela, f"Voltas ao redor da Terra: {voltas_terra:.1f} / {voltas_terra_objetivo}", 20, 370, cor_terra)
    texto(tela, f"Voltas ao redor da Lua: {voltas_lua:.1f} / {voltas_lua_objetivo}", 20, 400, cor_lua)

    pygame.draw.line(tela, CINZA_ESCURO, (15, 435), (PAINEL - 15, 435), 1)

    texto(tela, "DISTÂNCIAS E ALTITUDES", 20, 460, AZUL)
    texto(tela, f"Distância até a Terra: {dist_terra:.0f} km", 20, 490)
    texto(tela, f"Distância até a Lua: {dist_lua:.0f} km", 20, 520)
    texto(tela, f"Altitude em relação à Terra: {max(dist_terra - 6371, 0):.0f} km", 20, 550)
    texto(tela, f"Altitude em relação à Lua: {max(dist_lua - 1737, 0):.0f} km", 20, 580)

    pygame.draw.line(tela, CINZA_ESCURO, (15, 615), (PAINEL - 15, 615), 1)

    texto(tela, "PARÂMETROS DA SIMULAÇÃO", 20, 640, AZUL)
    texto(tela, "Velocidade fixa: 7800 m/s", 20, 670)
    texto(tela, "dt: 25 s por frame", 20, 700)
    texto(tela, "Rastro dinâmico: DESATIVADO", 20, 730)


def desenhar_progresso(tela, fase):
    y = 720
    x0 = 430
    largura = 880

    etapas = [
        "LANÇAMENTO",
        "ÓRBITA DA TERRA",
        "TRANSFERÊNCIA\nPARA A LUA",
        "ÓRBITA DA LUA",
        "RETORNO À TERRA"]

    texto(tela, "PROGRESSO DA MISSÃO", 740, 675, AZUL, fonte_pequena)
    pygame.draw.line(tela, CINZA_ESCURO, (x0, y), (x0 + largura, y), 2)

    fase_atual = {
        "LANÇAMENTO": 0,
        "ÓRBITA DA TERRA": 1,
        "TRANSFERÊNCIA PARA A LUA": 2,
        "ÓRBITA DA LUA": 3,
        "RETORNO À TERRA": 4,
        "SIMULAÇÃO CONCLUÍDA": 5
    }[fase]

    for i, nome in enumerate(etapas):
        x = x0 + int((largura / 4) * i)

        if fase == "SIMULAÇÃO CONCLUÍDA":
            cor = VERDE
        elif i < fase_atual:
            cor = VERDE
        elif i == fase_atual:
            cor = AMARELO
        else:
            cor = CINZA

        pygame.draw.circle(tela, cor, (x, y), 6)

        linhas = nome.split("\n")
        for j, linha in enumerate(linhas):
            texto(tela, linha, x - 50, y + 20 + j * 13, cor, fonte_pequena)

        if fase == "SIMULAÇÃO CONCLUÍDA":
            texto(tela, "✓ Concluído", x - 35, y + 48, VERDE, fonte_pequena)
        elif i < fase_atual:
            texto(tela, "✓ Concluído", x - 35, y + 48, VERDE, fonte_pequena)
        elif i == fase_atual:
            texto(tela, "Em andamento", x - 38, y + 48, AMARELO, fonte_pequena)


def desenhar_escala_tempo(tela):
    x = 1185
    y = 20

    pygame.draw.rect(tela, (8, 12, 35), (x, y, 190, 88), 1)
    texto(tela, "ESCALA DE TEMPO", x + 18, y + 12, AZUL, fonte_pequena)
    texto(tela, "1 segundo simulado", x + 18, y + 37, BRANCO, fonte_pequena)
    texto(tela, "25 segundos reais", x + 18, y + 55, BRANCO, fonte_pequena)
    texto(tela, "(Aceleração 25x)", x + 18, y + 73, VERDE, fonte_pequena)