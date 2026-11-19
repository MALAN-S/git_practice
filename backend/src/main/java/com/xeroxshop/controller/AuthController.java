package com.xeroxshop.controller;

import com.xeroxshop.dto.LoginRequest;
import com.xeroxshop.model.User;
import com.xeroxshop.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Simple authentication controller.
 *
 * For the starter project we use HTTP Basic (configured in SecurityConfig) and
 * return a dummy JWT‑like string. In a real system you would replace this with
 * proper JWT generation.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // Authenticate via Spring Security (throws exception if bad)
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            // Fetch user details to return role
            User user = userRepository.findByUsername(request.username())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String dummyToken = "Bearer dummy-token-for-" + request.username();
            return ResponseEntity.ok().body(Map.of(
                    "token", dummyToken,
                    "username", user.getUsername(),
                    "role", user.getRole(),
                    "permissions", user.getPermissions() != null ? user.getPermissions() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "Invalid username or password"
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer dummy-token-for-")) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String username = authHeader.replace("Bearer dummy-token-for-", "");
        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok().body(Map.of(
                        "username", user.getUsername(),
                        "role", user.getRole()
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("error", "User not found")));
    }
}
