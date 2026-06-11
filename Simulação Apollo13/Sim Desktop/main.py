import pygame
import math

pygame.init()

from funcoes import *

tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("Simulação NASA Apollo 13")

clock = pygame.time.Clock()
botao_reiniciar = pygame.Rect(20, 760, 180, 30)

fase = "LANÇAMENTO"
tempo = 0
dt = 25
progresso = 0
velocidade = VEL_ORBITAL

voltas_terra = 0
voltas_lua = 0
voltas_terra_objetivo = 3.30
voltas_lua_objetivo = 2.5

angulo_terra = -math.pi / 2
angulo_lua = 0

x, y = terra_pos

dist_terra_km = 0
dist_lua_km = 0

trajetoria = []

ponto_saida_transferencia = ponto_saida_terra
ponto_saida_retorno = ponto_saida_lua_esquerda

estrelas = gerar_estrelas()

rodando = True

while rodando:
    for evento in pygame.event.get():

        if evento.type == pygame.MOUSEBUTTONDOWN:
            if fase == "SIMULAÇÃO CONCLUÍDA" and botao_reiniciar.collidepoint(evento.pos):

                fase = "LANÇAMENTO"

                tempo = 0
                progresso = 0

                voltas_terra = 0
                voltas_lua = 0

                angulo_terra = -math.pi / 2
                angulo_lua = 0

                velocidade = VEL_ORBITAL
                x, y = terra_pos

                ponto_saida_transferencia = ponto_saida_terra
                ponto_saida_retorno = ponto_saida_lua_esquerda

                dist_terra_km = 0
                dist_lua_km = 0

                trajetoria.clear()

        if evento.type == pygame.QUIT:
            rodando = False

    tela.fill(FUNDO)

    for sx, sy, r in estrelas:
        pygame.draw.circle(tela, (150, 150, 170), (sx, sy), r)

    if fase != "SIMULAÇÃO CONCLUÍDA":
        tempo += dt

    if fase == "LANÇAMENTO":
        progresso += 0.015

        x, y = bezier(
            terra_pos,
            (830, 535),
            ponto_saida_terra,
            progresso)

        if progresso >= 1:
            fase = "ÓRBITA DA TERRA"
            progresso = 0
            angulo_terra = math.atan2(
                y - terra_pos[1],
                x - terra_pos[0])

    elif fase == "ÓRBITA DA TERRA":
        angulo_terra -= 0.035

        x = terra_pos[0] + math.cos(angulo_terra) * raio_orbita_terra_nave
        y = terra_pos[1] + math.sin(angulo_terra) * raio_orbita_terra_nave

        voltas_terra = abs(angulo_terra) / (2 * math.pi)

        if voltas_terra >= voltas_terra_objetivo:
            fase = "TRANSFERÊNCIA PARA A LUA"
            progresso = 0
            ponto_saida_transferencia = (x, y)

    elif fase == "TRANSFERÊNCIA PARA A LUA":
        progresso += 0.003

        x, y = bezier(ponto_saida_transferencia,(690, 330),ponto_entrada_lua_direita,progresso)

        if progresso >= 1:
            fase = "ÓRBITA DA LUA"
            progresso = 0
            angulo_lua = 0

    elif fase == "ÓRBITA DA LUA":
        angulo_lua -= 0.035

        x = lua_pos[0] + math.cos(angulo_lua) * raio_orbita_lua
        y = lua_pos[1] + math.sin(angulo_lua) * raio_orbita_lua

        voltas_lua = abs(angulo_lua) / (2 * math.pi)

        if voltas_lua >= voltas_lua_objetivo:
            fase = "RETORNO À TERRA"
            progresso = 0
            ponto_saida_retorno = (
                lua_pos[0] - raio_orbita_lua,
                lua_pos[1])

    elif fase == "RETORNO À TERRA":
        progresso += 0.003

        x, y = bezier(
            ponto_saida_retorno,
            (1030, 330),
            ponto_entrada_terra,
            progresso)

        if progresso >= 1:
            progresso = 1
            x, y = ponto_entrada_terra
            velocidade = 0
            fase = "SIMULAÇÃO CONCLUÍDA"

    nave_pos = (x, y)

    linha_tracejada(tela, terra_pos, lua_pos, (80, 80, 105), 10)

    circulo_tracejado(tela, terra_pos, raio_orbita_terra, AZUL)
    circulo_tracejado(tela, lua_pos, raio_orbita_lua, CINZA)

    desenhar_trajetoria_fixa(tela)

    desenhar_terra(tela)
    desenhar_lua(tela)

    texto(tela, "LUA", lua_pos[0] - 15, lua_pos[1] - 48, BRANCO, fonte_pequena)
    texto(tela, "TERRA", terra_pos[0] - 25, terra_pos[1] + 70, BRANCO, fonte_pequena)

    texto(tela, "384400 km", terra_pos[0] + 15, 340, CINZA, fonte_pequena)
    texto(tela, "(média)", terra_pos[0] + 20, 356, CINZA, fonte_pequena)

    if fase == "ÓRBITA DA TERRA":
        ang = angulo_terra - math.pi / 2

    elif fase == "ÓRBITA DA LUA":
        ang = angulo_lua - math.pi / 2

    elif fase == "TRANSFERÊNCIA PARA A LUA":
        ang = math.atan2(
            ponto_entrada_lua_direita[1] - y,
            ponto_entrada_lua_direita[0] - x)

    elif fase == "RETORNO À TERRA":
        ang = math.atan2(
            ponto_entrada_terra[1] - y,
            ponto_entrada_terra[0] - x)

    else:
        ang = -math.pi / 2

    desenhar_foguete(tela, nave_pos, ang)

    if fase != "SIMULAÇÃO CONCLUÍDA":
        dist_terra_km = distancia_px(nave_pos, terra_pos) * 800
        dist_lua_km = distancia_px(nave_pos, lua_pos) * 800

    desenhar_painel(
        tela,
        fase,
        tempo,
        velocidade,
        voltas_terra,
        voltas_lua,
        voltas_terra_objetivo,
        voltas_lua_objetivo,
        dist_terra_km,
        dist_lua_km)

    desenhar_escala_tempo(tela)
    desenhar_progresso(tela, fase)

    if fase == "SIMULAÇÃO CONCLUÍDA":
        pygame.draw.rect(tela,VERDE,botao_reiniciar,border_radius=8)

        texto(tela,"REINICIAR SIMULAÇÃO",botao_reiniciar.x + 18,botao_reiniciar.y + 8,(0, 0, 0))
        texto(tela,"SIMULAÇÃO CONCLUÍDA COM SUCESSO",520,90,VERDE,fonte_titulo)

    pygame.display.flip()
    clock.tick(60)

pygame.quit()