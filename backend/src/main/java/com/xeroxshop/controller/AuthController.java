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
        // Authenticate via Spring Security (throws exception if bad)
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        // If we reach here authentication succeeded. Generate a placeholder token.
        String dummyToken = "Bearer dummy-token-for-" + request.username();
        return ResponseEntity.ok().body(new AuthResponse(dummyToken));
    }

    // Simple DTO for the response
    record AuthResponse(String token) {}
}

