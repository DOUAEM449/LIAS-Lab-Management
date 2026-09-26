package com.lias.labmanagement.members.service;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.common.enums.RoleName;
import com.lias.labmanagement.members.entity.Member;
import com.lias.labmanagement.members.repository.MemberRepository;
import com.lias.labmanagement.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Archiving a member, end to end on a real Hibernate session. The archived row is hidden by
 * {@code @SQLRestriction("deleted = false")} from every ordinary query — which is precisely
 * what let the account pass for a technical one and kept it working, and what made the
 * restore path unable to find the member it was meant to bring back.
 */
@SpringBootTest(properties = "spring.config.import=")
@ActiveProfiles("test")
class MemberArchiveIntegrationTest {

    @Autowired private MemberService memberService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CustomUserDetailsService userDetailsService;

    private Member newMember() {
        String email = "archive-" + UUID.randomUUID().toString().substring(0, 8) + "@example.org";
        User user = userRepository.save(User.builder()
                .email(email)
                .passwordHash("not-used-by-this-test")
                .role(RoleName.PERMANENT_MEMBER)
                .enabled(true)
                .build());
        return memberRepository.save(Member.builder()
                .firstName("Test").lastName("Archive")
                .email(email)
                .currentStatus(MemberStatus.PERMANENT)
                .user(user)
                .build());
    }

    @Test
    void anArchivedMemberCanNoLongerAuthenticate() {
        Member member = newMember();
        assertThat(userDetailsService.loadUserByUsername(member.getEmail()).isEnabled()).isTrue();

        memberService.delete(member.getId());

        assertThat(userDetailsService.loadUserByUsername(member.getEmail()).isEnabled()).isFalse();
    }

    @Test
    void restoringAnArchivedMemberBringsTheProfileAndTheAccessBack() {
        Member member = newMember();
        memberService.delete(member.getId());

        memberService.restore(member.getId());

        assertThat(memberRepository.findById(member.getId())).isPresent();
        assertThat(userDetailsService.loadUserByUsername(member.getEmail()).isEnabled()).isTrue();
    }
}
