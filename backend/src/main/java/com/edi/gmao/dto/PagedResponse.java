package com.edi.gmao.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "Structure de pagination standard")
public class PagedResponse<T> {

    @Schema(description = "Elements de la page courante")
    private List<T> content;
    @Schema(description = "Index de page (0-based)", example = "0")
    private int page;
    @Schema(description = "Taille de page demandee", example = "20")
    private int size;
    @Schema(description = "Nombre total d'elements", example = "125")
    private long totalElements;
    @Schema(description = "Nombre total de pages", example = "7")
    private int totalPages;
    @Schema(description = "Indique si la page est la premiere", example = "true")
    private boolean first;
    @Schema(description = "Indique si la page est la derniere", example = "false")
    private boolean last;
    @Schema(description = "Informations de tri appliquees")
    private List<String> sort;
}
