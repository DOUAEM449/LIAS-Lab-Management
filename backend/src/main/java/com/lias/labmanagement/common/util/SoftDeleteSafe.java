package com.lias.labmanagement.common.util;

import jakarta.persistence.EntityNotFoundException;

import java.util.function.Function;

/**
 * Every entity uses {@code @SQLRestriction("deleted = false")} for soft
 * deletes, which makes Hibernate treat an archived row as "no longer
 * exists" for anyone still holding a reference to it (e.g. a
 * {@code PublicationAuthor} pointing at a since-archived {@code Member}).
 * Accessing a lazy {@code @ManyToOne} association's id never hits the
 * database (Hibernate proxies cache it), but accessing any other property
 * forces initialization and throws {@link EntityNotFoundException} once the
 * row is filtered out by the restriction.
 * <p>
 * Wrap that kind of access with {@link #resolve} instead of letting it
 * bubble up as an uncaught 500 for the whole containing list/response.
 */
public final class SoftDeleteSafe {

    private SoftDeleteSafe() {
    }

    /**
     * @param association the (possibly lazy-proxied) related entity, already fetched
     * @param mapper      accesses properties on it beyond its id
     * @param fallback    value used when the association has been archived/removed
     */
    public static <A, R> R resolve(A association, Function<A, R> mapper, R fallback) {
        try {
            return mapper.apply(association);
        } catch (EntityNotFoundException e) {
            return fallback;
        }
    }
}
