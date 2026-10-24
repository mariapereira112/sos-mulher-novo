package com.sosmulher.api.service;

import com.sosmulher.api.dto.LoginRequest;
import com.sosmulher.api.dto.LoginResponse;
import com.sosmulher.api.entity.User;
import com.sosmulher.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest req) {
        String trimmed = req.getIdentifier().trim();
        boolean isEmail = trimmed.contains("@");

        Optional<User> userOpt = isEmail
                ? userRepository.findByEmailIgnoreCase(trimmed)
                : userRepository.findByNameIgnoreCase(trimmed);

        if (userOpt.isEmpty()) {
            String msg = isEmail
                    ? "E-mail não encontrado. Verifique o endereço ou crie uma conta."
                    : "Nome não encontrado. Verifique o nome ou use seu e-mail.";
            throw new AuthException(404, msg);
        }

        User user = userOpt.get();
        if (user.getPasswordHash() == null) {
            throw new AuthException(401, "Esta conta não possui senha. Use 'Redefinir senha'.");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new AuthException(401, "Senha incorreta. Tente novamente.");
        }

        return new LoginResponse(user.getId(), user.getName(), user.getPhone());
    }

    public Map<String, String> recoverAccount(String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) return null;
        User user = userOpt.get();
        // Simulação local: retorna token fictício para demo
        return Map.of(
            "message", "E-mail de recuperação enviado (modo local — sem envio real).",
            "token", "LOCAL_RECOVERY_TOKEN_" + user.getId(),
            "userId", user.getId().toString()
        );
    }

    public static class AuthException extends RuntimeException {
        private final int statusCode;
        public AuthException(int statusCode, String message) {
            super(message);
            this.statusCode = statusCode;
        }
        public int getStatusCode() { return statusCode; }
    }
}
