package com.lias.labmanagement.equipment.dto;

import java.util.UUID;

/** A member (active, non-frozen) who has not received a given equipment item — CdC §2.15. */
public record NonRecipientResponse(
        UUID memberId,
        String fullName
) {
}
