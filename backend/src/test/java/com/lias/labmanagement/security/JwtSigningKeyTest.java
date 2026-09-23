package com.lias.labmanagement.security;

import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * La clé de signature est le secret le plus critique du système : quiconque la
 * détient peut forger un jeton pour n'importe quel compte, y compris celui de
 * l'administrateur, puisque l'identité de l'appelant est portée par le sujet du
 * jeton. Ces tests fixent deux propriétés.
 *
 * <p>D'abord qu'aucun fichier de configuration ne fournit de valeur de repli :
 * {@code application.yml} s'applique à tous les profils, une valeur par défaut y
 * serait donc active en production. Ensuite qu'une clé absente, mal encodée ou
 * trop courte arrête le démarrage avec un message exploitable, au lieu de laisser
 * l'application signer ses jetons et échouer plus tard.
 */
class JwtSigningKeyTest {

    /** Clé de test : 82 octets une fois décodée, sans rapport avec un secret réel. */
    private static final String VALID_SECRET = Base64.getEncoder().encodeToString(
            ("lias-integration-test-signing-key-not-a-secret-"
                    + "do-not-use-outside-tests-0123456789").getBytes(StandardCharsets.UTF_8));

    private static final List<String> CONFIG_FILES = List.of(
            "application.yml", "application-dev.yml", "application-prod.yml", "application-test.yml");

    @Test
    void aMissingOrBlankSecretIsRejectedWithAnActionableMessage() {
        for (String absent : new String[] {null, "", "   "}) {
            assertThatThrownBy(() -> JwtService.validateSecret(absent))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("JWT_SECRET");
        }
    }

    /**
     * Spring ne considère pas un placeholder non résolu comme une erreur : il lie la
     * chaîne brute. Sans ce cas traité à part, une variable absente produisait un
     * diagnostic de « base64 invalide », qui envoie chercher le défaut au mauvais endroit.
     */
    @Test
    void anUnresolvedPlaceholderIsReportedAsAMissingVariable() {
        assertThatThrownBy(() -> JwtService.validateSecret("${JWT_SECRET}"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("n'est pas configure")
                .hasMessageNotContaining("base64 valide");
    }

    @Test
    void aSecretTooShortForHs512IsRejected() {
        // 32 octets : accepte par hmacShaKeyFor, mais il retrograderait vers HS256.
        String tooShort = Base64.getEncoder().encodeToString(new byte[32]);

        assertThatThrownBy(() -> JwtService.validateSecret(tooShort))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32")
                .hasMessageContaining("HS512");
    }

    @Test
    void aSecretThatIsNotBase64IsRejected() {
        assertThatThrownBy(() -> JwtService.validateSecret("pas du base64 !!"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("base64");
    }

    @Test
    void aProperlySizedSecretIsAcceptedAndNeverEchoedBack() {
        byte[] decoded = JwtService.validateSecret(VALID_SECRET);

        assertThat(decoded.length).isGreaterThanOrEqualTo(JwtService.MIN_KEY_BYTES);
        // Une clef trop courte ne doit pas faire apparaitre la valeur fournie dans la trace.
        assertThatThrownBy(() -> JwtService.validateSecret(Base64.getEncoder()
                .encodeToString("secret-de-quarante-octets-tout-juste-1234".getBytes(StandardCharsets.UTF_8))))
                .hasMessageNotContaining("secret-de-quarante-octets");
    }

    @Test
    void noConfigurationFileDeclaresAFallbackForTheSigningKey() {
        for (String file : CONFIG_FILES) {
            String content = read(file);
            assertThat(content)
                    .as("valeur de repli reintroduite dans %s", file)
                    .doesNotContain("${JWT_SECRET:");
        }
        // Et la variable reste bien exigee par la configuration de base.
        assertThat(read("application.yml")).contains("${JWT_SECRET}");
    }

    private String read(String name) {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(name)) {
            assertThat(in).as("fichier de configuration %s introuvable", name).isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("lecture de " + name, e);
        }
    }
}
