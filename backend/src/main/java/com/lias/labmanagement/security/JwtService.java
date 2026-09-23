package com.lias.labmanagement.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Generates and validates JWT access / refresh tokens used for stateless
 * authentication across the whole REST API.
 */
@Component
@RequiredArgsConstructor
public class JwtService {

    /**
     * Taille minimale de la clé, en octets. L'algorithme n'est jamais nommé ici :
     * jjwt le déduit de la longueur de la clé. En 0.12.6,
     * {@link Keys#hmacShaKeyFor} refuse une clé de moins de 256 bits, retient
     * HS256 de 256 à 383 bits, HS384 de 384 à 511, et HS512 à partir de 512 bits,
     * soit 64 octets. En deçà, les jetons seraient signés en HS256 ou HS384 sans
     * qu'aucune erreur ne soit levée.
     */
    static final int MIN_KEY_BYTES = 64;

    private final JwtProperties jwtProperties;

    /**
     * Vérifie la clé au démarrage plutôt qu'à la première connexion : une clé
     * absente, mal encodée ou trop courte doit empêcher l'application de démarrer,
     * et non produire une erreur au premier utilisateur qui tente de se connecter.
     */
    @PostConstruct
    void verifySigningKey() {
        validateSecret(jwtProperties.getSecret());
    }

    /** Décode et contrôle la clé. Lève une erreur explicite, jamais la valeur elle-même. */
    static byte[] validateSecret(String secret) {
        // Spring ne leve rien sur un placeholder non resolu : il transmet le texte brut
        // « ${JWT_SECRET} ». Sans ce cas explicite, l'erreur remontee serait un
        // « base64 invalide » trompeur alors que la variable est simplement absente.
        boolean unresolved = secret != null
                && secret.trim().startsWith("${") && secret.trim().endsWith("}");
        if (secret == null || secret.isBlank() || unresolved) {
            throw new IllegalStateException(
                    "app.jwt.secret n'est pas configure : definissez la variable "
                    + "d'environnement JWT_SECRET (base64, 64 octets minimum une fois decodee). "
                    + "Generer : openssl rand -base64 72");
        }
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT_SECRET n'est pas un base64 valide.", e);
        }
        if (keyBytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET est trop courte : " + keyBytes.length + " octets une fois decodee, "
                    + MIN_KEY_BYTES + " requis pour HS512.");
        }
        return keyBytes;
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtProperties.getSecret()));
    }

    public String generateAccessToken(CustomUserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", userDetails.getId().toString());
        claims.put("role", userDetails.getRole().name());
        claims.put("type", "access");
        return buildToken(claims, userDetails.getUsername(), jwtProperties.getAccessTokenExpirationMs());
    }

    public String generateRefreshToken(CustomUserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", userDetails.getId().toString());
        claims.put("type", "refresh");
        return buildToken(claims, userDetails.getUsername(), jwtProperties.getRefreshTokenExpirationMs());
    }

    private String buildToken(Map<String, Object> claims, String subject, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuer(jwtProperties.getIssuer())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey())
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UUID extractUserId(String token) {
        String uid = extractClaim(token, claims -> claims.get("uid", String.class));
        return uid == null ? null : UUID.fromString(uid);
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String email = extractEmail(token);
            return email.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }
}
