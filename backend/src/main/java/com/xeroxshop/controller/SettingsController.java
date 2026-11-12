package com.xeroxshop.controller;

import com.xeroxshop.model.AppSetting;
import com.xeroxshop.repository.AppSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private AppSettingRepository appSettingRepository;

    @GetMapping
    public ResponseEntity<Map<String, String>> getSettings() {
        List<AppSetting> all = appSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        map.put("shopName", "Shop");
        map.put("tagline", "Xerox, Print & Stationery Store");
        map.put("timezone", "Asia/Kolkata (IST)");
        map.put("headerNote", "Welcome to our Xerox & Print Center");
        map.put("footerNote", "Thank you for visiting! Please come again.");
        map.put("billPrefix", "BILL");
        map.put("billCounter", "0");

        for (AppSetting s : all) {
            if (s.getValue() != null) {
                map.put(s.getKey(), s.getValue());
            }
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> updates) {
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            if (entry.getKey() != null && entry.getValue() != null) {
                appSettingRepository.save(new AppSetting(entry.getKey(), entry.getValue()));
            }
        }
        return getSettings();
    }

    @PostMapping("/reset-bill-counter")
    public ResponseEntity<Map<String, String>> resetBillCounter() {
        appSettingRepository.save(new AppSetting("billCounter", "0"));
        return getSettings();
    }
}

