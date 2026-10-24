package com.sosmulher.api.service;

import com.sosmulher.api.dto.*;
import com.sosmulher.api.entity.User;
import com.sosmulher.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public User createUser(CreateUserRequest req) {
        if (req.getName() == null || req.getName().isBlank()
                || req.getPhone() == null || req.getPhone().isBlank()) {
            throw new IllegalArgumentException("Nome e telefone são obrigatórios.");
        }
        if ("Homem".equals(req.getGender())) {
            throw new GenderRestrictedException();
        }

        User user = new User();
        user.setName(req.getName().trim());
        user.setPhone(req.getPhone().trim());
        user.setEmail(req.getEmail() != null ? req.getEmail().trim() : null);
        user.setCpf(req.getCpf() != null ? req.getCpf().trim() : null);
        user.setGender(req.getGender());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        return userRepository.save(user);
    }

    public User getUser(Integer id) {
        return userRepository.findById(id).orElse(null);
    }

    public User updateUser(Integer id, UpdateUserRequest req) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;
        if (req.getName() != null)   user.setName(req.getName());
        if (req.getPhone() != null)  user.setPhone(req.getPhone());
        if (req.getEmail() != null)  user.setEmail(req.getEmail().isBlank() ? null : req.getEmail());
        if (req.getCpf() != null)    user.setCpf(req.getCpf().isBlank() ? null : req.getCpf());
        if (req.getGender() != null) user.setGender(req.getGender());
        return userRepository.save(user);
    }

    public User completeOnboarding(Integer id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return null;
        user.setOnboardingCompleted(true);
        return userRepository.save(user);
    }

    public User updateEmail(Integer userId, String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("E-mail já está sendo usado por outra conta.");
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;
        user.setEmail(email);
        return userRepository.save(user);
    }

    public Map<String, String> updatePassword(UpdatePasswordRequest req) {
        User user = userRepository.findById(req.getUserId()).orElse(null);
        if (user == null) throw new IllegalArgumentException("Usuário não encontrado.");
        if (user.getPasswordHash() != null) {
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Senha atual incorreta.");
            }
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return Map.of("message", "Senha atualizada com sucesso.");
    }

    public boolean deleteUser(Integer id) {
        if (!userRepository.existsById(id)) return false;
        userRepository.deleteById(id);
        return true;
    }

    public static class GenderRestrictedException extends RuntimeException {
        public GenderRestrictedException() { super("GENDER_RESTRICTED"); }
    }
}
