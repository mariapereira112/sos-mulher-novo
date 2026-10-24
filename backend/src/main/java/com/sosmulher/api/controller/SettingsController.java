package com.sosmulher.api.controller;

import com.sosmulher.api.dto.UpsertSettingsRequest;
import com.sosmulher.api.entity.Settings;
import com.sosmulher.api.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/{userId}/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsRepository settingsRepository;

    @GetMapping
    public ResponseEntity<?> get(@PathVariable Integer userId) {
        Optional<Settings> opt = settingsRepository.findByUserId(userId);
        if (opt.isEmpty()) {
            // Retorna defaults sem salvar
            return ResponseEntity.ok(Map.of(
                "id", 0, "userId", userId,
                "gpsEnabled", true, "notificationsEnabled", true,
                "cameraMicEnabled", false, "discreteMode", false,
                "biometricsEnabled", false, "sosTimer", "1500"
            ));
        }
        return ResponseEntity.ok(opt.get());
    }

    @PutMapping
    public ResponseEntity<?> upsert(@PathVariable Integer userId,
                                    @RequestBody UpsertSettingsRequest req) {
        Settings settings = settingsRepository.findByUserId(userId)
                .orElseGet(() -> { Settings s = new Settings(); s.setUserId(userId); return s; });

        if (req.getGpsEnabled() != null)           settings.setGpsEnabled(req.getGpsEnabled());
        if (req.getNotificationsEnabled() != null)  settings.setNotificationsEnabled(req.getNotificationsEnabled());
        if (req.getCameraMicEnabled() != null)      settings.setCameraMicEnabled(req.getCameraMicEnabled());
        if (req.getDiscreteMode() != null)          settings.setDiscreteMode(req.getDiscreteMode());
        if (req.getBiometricsEnabled() != null)     settings.setBiometricsEnabled(req.getBiometricsEnabled());
        if (req.getCoercionCode() != null)          settings.setCoercionCode(req.getCoercionCode());
        if (req.getSosTimer() != null)              settings.setSosTimer(req.getSosTimer());
        if (req.getPhotoUrl() != null)              settings.setPhotoUrl(req.getPhotoUrl());
        if (req.getHighContrast() != null)          settings.setHighContrast(req.getHighContrast());
        if (req.getLargeText() != null)             settings.setLargeText(req.getLargeText());
        if (req.getReduceMotion() != null)          settings.setReduceMotion(req.getReduceMotion());

        return ResponseEntity.ok(settingsRepository.save(settings));
    }
}
