package com.sosmulher.api.service;

import com.sosmulher.api.dto.CreateAlertRequest;
import com.sosmulher.api.entity.Alert;
import com.sosmulher.api.entity.AlertNotification;
import com.sosmulher.api.entity.EmergencyContact;
import com.sosmulher.api.repository.AlertNotificationRepository;
import com.sosmulher.api.repository.AlertRepository;
import com.sosmulher.api.repository.EmergencyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final AlertNotificationRepository notificationRepository;
    private final EmergencyContactRepository contactRepository;

    public Alert createAlert(CreateAlertRequest req) {
        Alert alert = new Alert();
        alert.setUserId(req.getUserId());
        alert.setLatitude(req.getLatitude());
        alert.setLongitude(req.getLongitude());
        alert.setTimerDuration(req.getTimerDuration() != null ? req.getTimerDuration() : 30);
        alert.setStatus("sms_sent");
        alert = alertRepository.save(alert);

        // Registrar notificações para cada contato de emergência
        List<EmergencyContact> contacts = contactRepository.findByUserId(req.getUserId());
        for (EmergencyContact contact : contacts) {
            AlertNotification notif = new AlertNotification();
            notif.setAlertId(alert.getId());
            notif.setContactId(contact.getId());
            notif.setChannel("sms");
            notificationRepository.save(notif);
        }

        return alert;
    }

    public List<Alert> listByUser(Integer userId) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Alert getStatus(Integer alertId) {
        return alertRepository.findById(alertId).orElse(null);
    }

    public Alert resolve(Integer alertId) {
        Alert alert = alertRepository.findById(alertId).orElse(null);
        if (alert == null) return null;
        alert.setStatus("resolved_by_contact");
        return alertRepository.save(alert);
    }

    public Alert cancel(Integer alertId) {
        Alert alert = alertRepository.findById(alertId).orElse(null);
        if (alert == null) return null;
        alert.setStatus("cancelled");
        return alertRepository.save(alert);
    }

    public Alert webhookRespond(Integer alertId, String digit) {
        Alert alert = alertRepository.findById(alertId).orElse(null);
        if (alert == null) return null;
        if ("1".equals(digit)) {
            alert.setStatus("resolved_by_contact");
            alertRepository.save(alert);
        }
        return alert;
    }

    public Map<String, String> confirmViaLink(Integer alertId) {
        resolve(alertId);
        return Map.of("message", "Alerta resolvido via link de confirmação.");
    }
}
