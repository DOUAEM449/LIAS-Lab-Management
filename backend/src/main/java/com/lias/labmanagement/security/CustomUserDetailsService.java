package com.lias.labmanagement.security;

import com.lias.labmanagement.auth.entity.User;
import com.lias.labmanagement.auth.repository.UserRepository;
import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.members.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedFalse(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with email: " + email));
        MemberStatus memberStatus = memberRepository.findByUserId(user.getId())
                .map(com.lias.labmanagement.members.entity.Member::getCurrentStatus)
                .orElse(null);
        return new CustomUserDetails(user, memberStatus);
    }
}
