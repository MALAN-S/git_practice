package com.xeroxshop.service;

import com.xeroxshop.dto.UserRequest;
import com.xeroxshop.dto.UserResponse;
import com.xeroxshop.model.User;
import com.xeroxshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole()))
                .collect(Collectors.toList());
    }

    public UserResponse createUser(UserRequest req) {
        if (userRepository.findByUsername(req.username()).isPresent()) {
            throw new RuntimeException("Username already exists: " + req.username());
        }

        User user = new User();
        user.setUsername(req.username());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(req.role() != null ? req.role().toUpperCase() : "STAFF");
        user.setCreatedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());

        User saved = userRepository.save(user);
        return new UserResponse(saved.getId(), saved.getUsername(), saved.getRole());
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }
}

