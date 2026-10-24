package com.sosmulher.api.controller;

import com.sosmulher.api.dto.CreateAlertRequest;
import com.sosmulher.api.entity.Alert;
import com.sosmulher.api.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateAlertRequest req) {
        if (req.getUserId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId é obrigatório."));
        }
        Alert alert = alertService.createAlert(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(alert);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> listByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(alertService.listByUser(userId));
    }

    @GetMapping("/{alertId}/status")
    public ResponseEntity<?> getStatus(@PathVariable Integer alertId) {
        Alert alert = alertService.getStatus(alertId);
        if (alert == null) return ResponseEntity.status(404).body(Map.of("error", "Alert not found"));
        return ResponseEntity.ok(alert);
    }

    @PutMapping("/{alertId}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Integer alertId) {
        Alert alert = alertService.resolve(alertId);
        if (alert == null) return ResponseEntity.status(404).body(Map.of("error", "Alert not found"));
        return ResponseEntity.ok(alert);
    }

    @PostMapping("/{alertId}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Integer alertId) {
        Alert alert = alertService.cancel(alertId);
        if (alert == null) return ResponseEntity.status(404).body(Map.of("error", "Alert not found"));
        return ResponseEntity.ok(alert);
    }

    @PutMapping("/{alertId}/webhook/respond")
    public ResponseEntity<?> webhookRespond(@PathVariable Integer alertId,
                                            @RequestBody Map<String, String> body) {
        String digit = body.get("digit");
        Alert alert = alertService.webhookRespond(alertId, digit);
        if (alert == null) return ResponseEntity.status(404).body(Map.of("error", "Alert not found"));
        return ResponseEntity.ok(alert);
    }

    @GetMapping("/{alertId}/confirm")
    public ResponseEntity<String> confirmViaLink(@PathVariable Integer alertId) {
        Alert alert = alertService.getStatus(alertId);
        boolean alreadyResolved = alert != null && "resolved_by_contact".equals(alert.getStatus());
        if (alert != null && !alreadyResolved) alertService.confirmViaLink(alertId);

        String html = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>SOS Mulher — Confirmado</title>
            <style>*{box-sizing:border-box;margin:0;padding:0}
            body{font-family:sans-serif;background:#0f172a;color:#f1f5f9;
                 display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
            .card{background:#1e293b;border-radius:20px;padding:36px 28px;max-width:400px;width:100%;border:1px solid #334155}
            h1{color:#22c55e;font-size:24px;margin:16px 0 12px}
            p{color:#94a3b8;line-height:1.6;margin-bottom:8px}
            .emergency{margin-top:20px;padding:14px;background:#e6394620;border-radius:12px;color:#fca5a5;font-weight:500}
            </style></head>
            <body><div class="card">
            <div style="font-size:56px">""" + (alreadyResolved ? "✅" : "🛡️") + """</div>
            <h1>""" + (alreadyResolved ? "Alerta já resolvido" : "Confirmação recebida!") + """</h1>
            <p>""" + (alreadyResolved
                ? "Este alerta já foi encerrado anteriormente."
                : "O sistema registrou que você está a caminho.") + """</p>
            <div class="emergency">📞 Em situação grave, ligue <strong>190</strong> ou <strong>180</strong>.</div>
            </div></body></html>
            """;
        return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=utf-8")
                .body(html);
    }
}
