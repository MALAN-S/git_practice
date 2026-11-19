package com.xeroxshop.controller;

import com.xeroxshop.dto.UserRequest;
import com.xeroxshop.dto.UserResponse;
import com.xeroxshop.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest req) {
        return ResponseEntity.ok(userService.createUser(req));
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<UserResponse> updatePermissions(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String permissions = body.getOrDefault("permissions", "");
        return ResponseEntity.ok(userService.updateUserPermissions(id, permissions));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
