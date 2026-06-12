package com.edi.gmao.dto.breakdown;

import com.edi.gmao.entity.BreakdownStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BreakdownStatusUpdateRequest {

    @NotNull
    private BreakdownStatus status;
}
