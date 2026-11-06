package com.xeroxshop.dto;

import java.util.List;

public record CsvImportResponse(
    int totalRows,
    int importedCount,
    int skippedCount,
    List<String> messages,
    List<String> errors
) {}
