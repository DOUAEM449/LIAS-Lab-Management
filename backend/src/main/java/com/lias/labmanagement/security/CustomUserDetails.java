package com.lias.labmanagement.security;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleName;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Adapts our {@link User} entity to Spring Security's {@link UserDetails}
 * contract and carries the identifiers needed across the request lifecycle
 * (JPA auditing, ownership checks, JWT claims).
 */
@Getter
public class CustomUserDetails implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final RoleName role;
    private final boolean enabled;
    private final boolean mustChangePassword;
    /** Denormalized status of the linked Member profile, if any (null for purely technical accounts). */
    private final MemberStatus memberStatus;

    public CustomUserDetails(User user) {
        this(user, null);
    }

    public CustomUserDetails(User user, MemberStatus memberStatus) {
        this(user, memberStatus, false);
    }

    public CustomUserDetails(User user, MemberStatus memberStatus, boolean archivedProfile) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.role = user.getRole();
        this.mustChangePassword = user.isMustChangePassword();
        this.memberStatus = memberStatus;
        // A RETIRED or FORMER member's account must be treated as frozen/disabled
        // regardless of the raw users.enabled flag (CdC §8: "Compte gelé"/"Compte désactivé").
        // The same goes for an archived member: archiving withdraws the person from the
        // laboratory, and their account must not outlive their profile.
        this.enabled = user.isEnabled() && !isFrozenStatus(memberStatus) && !archivedProfile;
    }

    private static boolean isFrozenStatus(MemberStatus status) {
        return status == MemberStatus.RETIRED || status == MemberStatus.FORMER;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
