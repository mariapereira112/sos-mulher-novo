package com.sosmulher.api.controller;

import com.sosmulher.api.dto.CreateContactRequest;
import com.sosmulher.api.entity.EmergencyContact;
import com.sosmulher.api.repository.EmergencyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final EmergencyContactRepository contactRepository;

    @GetMapping
    public ResponseEntity<?> list(@PathVariable Integer userId) {
        return ResponseEntity.ok(contactRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable Integer userId,
                                    @RequestBody CreateContactRequest req) {
        if (req.getName() == null || req.getPhone() == null || req.getRelationship() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nome, telefone e relacionamento são obrigatórios."));
        }
        EmergencyContact contact = new EmergencyContact();
        contact.setUserId(userId);
        contact.setName(req.getName().trim());
        contact.setPhone(req.getPhone().trim());
        contact.setRelationship(req.getRelationship().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(contactRepository.save(contact));
    }

    @DeleteMapping("/{contactId}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Integer userId,
                                    @PathVariable Integer contactId) {
        var contact = contactRepository.findByIdAndUserId(contactId, userId);
        if (contact.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Contact not found"));
        }
        contactRepository.deleteByIdAndUserId(contactId, userId);
        return ResponseEntity.noContent().build();
    }
}
