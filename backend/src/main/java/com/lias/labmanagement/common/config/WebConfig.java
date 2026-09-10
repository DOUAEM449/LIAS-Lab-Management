package com.lias.labmanagement.common.config;

import com.lias.labmanagement.common.storage.FileStorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves everything {@link com.lias.labmanagement.common.storage.FileStorageService}
 * writes to disk back over HTTP at {@code /files/**}. Whether a given file
 * actually resolves without authentication is decided by
 * {@link SecurityConfig} (only {@code /files/public/**} is open) — this
 * class only wires up the on-disk → URL mapping.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final FileStorageProperties fileStorageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String baseDir = Paths.get(fileStorageProperties.getBaseDir()).toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + baseDir + "/");
    }
}
