package com.fabrica.soyla.web;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fabrica.soyla.service.SoylaService;
import com.fabrica.soyla.web.ApiModels.AuthRequest;
import com.fabrica.soyla.web.ApiModels.AuthResponse;
import com.fabrica.soyla.web.ApiModels.ConfirmEmailResponse;
import com.fabrica.soyla.web.ApiModels.RegisterRequest;
import com.fabrica.soyla.web.ApiModels.ResendConfirmationRequest;

@RestController
@Validated
@RequestMapping("/api/auth")
public class AuthController {

    private final SoylaService soylaService;

    public AuthController(SoylaService soylaService) {
        this.soylaService = soylaService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody @jakarta.validation.Valid RegisterRequest request) {
        return soylaService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @jakarta.validation.Valid AuthRequest request) {
        return soylaService.login(request);
    }

    @GetMapping("/confirm")
    public ConfirmEmailResponse confirmEmail(@RequestParam String token) {
        return soylaService.confirmEmail(token);
    }

    @PostMapping("/resend-confirmation")
    public AuthResponse resendConfirmation(@RequestBody @jakarta.validation.Valid ResendConfirmationRequest request) {
        return soylaService.resendConfirmation(request);
    }
}
