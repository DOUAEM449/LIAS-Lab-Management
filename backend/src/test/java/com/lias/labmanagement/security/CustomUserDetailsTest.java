package com.lias.labmanagement.security;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The account-freeze rule (CdC §8): a RETIRED or FORMER member can no longer
 * authenticate, regardless of the raw {@code users.enabled} flag, and technical
 * accounts with no linked member profile stay usable.
 */
class CustomUserDetailsTest {

    private User user(RoleName role, boolean enabled) {
        User u = User.builder()
                .email("x@lias.ma").passwordHash("hash").role(role)
                .enabled(enabled).mustChangePassword(false).build();
        u.setId(UUID.randomUUID());
        return u;
    }

    @Test
    void activeMemberIsEnabledAndExposesItsRoleAuthority() {
        CustomUserDetails details = new CustomUserDetails(user(RoleName.PERMANENT_MEMBER, true), MemberStatus.PERMANENT);

        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_PERMANENT_MEMBER");
        assertThat(details.isAccountNonExpired()).isTrue();
        assertThat(details.isAccountNonLocked()).isTrue();
        assertThat(details.isCredentialsNonExpired()).isTrue();
    }

    @Test
    void retiredMemberIsFrozen() {
        CustomUserDetails details = new CustomUserDetails(user(RoleName.RETIRED_MEMBER, true), MemberStatus.RETIRED);
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    void formerMemberIsFrozen() {
        CustomUserDetails details = new CustomUserDetails(user(RoleName.FORMER_MEMBER, true), MemberStatus.FORMER);
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    void technicalAccountWithoutMemberProfileStaysUsable() {
        CustomUserDetails details = new CustomUserDetails(user(RoleName.SYSTEM_ADMIN, true), null);

        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getMemberStatus()).isNull();
        assertThat(details.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_SYSTEM_ADMIN");
    }

    @Test
    void archivedMemberIsRefusedEvenThoughNoProfileIsVisible() {
        // Same shape as a technical account (no visible profile, raw flag enabled), yet the
        // profile exists and is archived: the person has left and must not get back in.
        CustomUserDetails details = new CustomUserDetails(user(RoleName.PHD_STUDENT, true), null, true);
        assertThat(details.isEnabled()).isFalse();
    }

    @Test
    void administrativelyDisabledAccountIsNotEnabledWhateverTheStatus() {
        CustomUserDetails details = new CustomUserDetails(user(RoleName.PERMANENT_MEMBER, false), MemberStatus.PERMANENT);
        assertThat(details.isEnabled()).isFalse();
    }
}
