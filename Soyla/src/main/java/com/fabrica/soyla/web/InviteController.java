package com.fabrica.soyla.web;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fabrica.soyla.service.SoylaService;
import com.fabrica.soyla.web.ApiModels.InviteJoinRequest;
import com.fabrica.soyla.web.ApiModels.InviteResponse;
import com.fabrica.soyla.web.ApiModels.JoinInviteResponse;

@RestController
@Validated
@RequestMapping("/api/invites")
public class InviteController {

    private final SoylaService soylaService;

    public InviteController(SoylaService soylaService) {
        this.soylaService = soylaService;
    }

    @GetMapping("/{code}")
    public InviteResponse getInvite(@PathVariable String code) {
        return soylaService.lookupInvite(code);
    }

    @PostMapping("/{code}/join")
    public JoinInviteResponse joinInvite(
        @PathVariable String code,
        @RequestBody @jakarta.validation.Valid InviteJoinRequest request
    ) {
        return soylaService.joinInvite(code, request);
    }
}
