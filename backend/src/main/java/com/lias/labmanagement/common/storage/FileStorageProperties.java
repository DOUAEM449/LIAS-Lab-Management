package com.lias.labmanagement.common.storage;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.file-storage")
public class FileStorageProperties {
    private String baseDir;
    private long maxSizeMb;
}
