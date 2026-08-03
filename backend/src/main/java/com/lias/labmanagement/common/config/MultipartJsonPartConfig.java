package com.lias.labmanagement.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

/**
 * Several endpoints accept a JSON DTO alongside a file upload via
 * {@code @RequestPart("data") SomeDto} inside a {@code multipart/form-data}
 * request (membership requests, documents, events, meetings, agreements,
 * partners, publications). Browser-based API clients — Swagger UI in
 * particular — frequently send that "data" text part without an explicit
 * {@code Content-Type: application/json} header (defaulting instead to
 * {@code application/octet-stream} or {@code text/plain}), which made
 * Spring's {@code @RequestPart} resolver reject it with
 * {@code HttpMediaTypeNotSupportedException} — surfaced to callers as an
 * opaque 500 because nothing downstream expects that part's content type to
 * vary. Rather than depend on every client tagging that part correctly,
 * widen the Jackson converter to also read those two content types as JSON.
 */
@Configuration
public class MultipartJsonPartConfig implements WebMvcConfigurer {

    @Override
    public void extendMessageConverters(@NonNull List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter jacksonConverter) {
                List<MediaType> supported = new ArrayList<>(jacksonConverter.getSupportedMediaTypes());
                supported.add(MediaType.APPLICATION_OCTET_STREAM);
                supported.add(MediaType.TEXT_PLAIN);
                jacksonConverter.setSupportedMediaTypes(supported);
            }
        }
    }
}
