package com.xeroxshop.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "app_settings")
public class AppSetting {

    @Id
    @Column(name = "setting_key", length = 50)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;
}

