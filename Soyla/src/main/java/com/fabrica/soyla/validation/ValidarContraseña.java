package com.fabrica.soyla.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
@Documented
public @interface ValidarContraseña {
    String message() default "La contraseña debe tener al menos 8 caracteres, " +
            "1 mayúscula, 1 minúscula, 1 número y 1 carácter especial";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
