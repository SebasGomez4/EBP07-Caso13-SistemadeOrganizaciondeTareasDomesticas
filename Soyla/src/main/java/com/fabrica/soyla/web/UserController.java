package com.fabrica.soyla.web;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fabrica.soyla.service.SoylaService;
import com.fabrica.soyla.web.ApiModels.UpdateProfileRequest;
import com.fabrica.soyla.web.ApiModels.UserProfileResponse;

@RestController
@Validated
@RequestMapping("/api/users")
public class UserController {

    private final SoylaService soylaService;

    public UserController(SoylaService soylaService) {
        this.soylaService = soylaService;
    }

    @GetMapping("/{email}")
    public UserProfileResponse getProfile(@PathVariable String email) {
        return soylaService.getProfile(email);
    }

    @PutMapping("/{email}")
    public UserProfileResponse updateProfile(
        @PathVariable String email,
        @RequestBody @jakarta.validation.Valid UpdateProfileRequest request
    ) {
        return soylaService.updateProfile(email, request);
    }
}
