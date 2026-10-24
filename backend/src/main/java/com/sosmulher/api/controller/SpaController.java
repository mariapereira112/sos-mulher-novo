package com.sosmulher.api.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Redireciona qualquer rota do React Router para o index.html,
 * permitindo que o SPA funcione com URLs diretas (ex: /history, /contacts).
 *
 * Rotas da API (/api/**) e arquivos estáticos (.js, .css, .png...)
 * são interceptados pelo Spring antes de chegar aqui.
 */
@Controller
public class SpaController {

    @GetMapping(value = {
        "/",
        "/login",
        "/onboarding",
        "/restricted",
        "/history",
        "/community",
        "/contacts",
        "/profile",
    })
    public String spa() {
        return "forward:/index.html";
    }
}
