package com.fabrica.soyla.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    public void enviarConfirmacionRegistro(String destinatario, String nombre, String token) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom("noreply@soyla.com");
            helper.setTo(destinatario);
            helper.setSubject("¡Bienvenido a Soyla!");
            // El enlace incluye un token JWT que expirará en 24 horas
                    String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
                    // No incluimos el token en la URL del botón porque el frontend no tiene /confirm
                    String enlace = "https://soyla.vercel.app";

                    // Registrar en logs la URL completa con token para diagnóstico si hace falta
                    logger.info("Enlace de confirmación (con token) generado: {}", enlace + "?token=" + encodedToken);

                    String html = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px;'>" +
                        "<h1 style='color: #5B4FCF;'>¡Bienvenido a Soyla, " + nombre + "!</h1>" +
                        "<p style='color: #444; font-size: 16px;'>Tu cuenta ha sido creada exitosamente.</p>" +
                        "<p style='color: #444; font-size: 16px;'>El enlace de confirmación expirará en 24 horas. Dirigite a la app para completar la confirmación.</p>" +
                        "<br>" +
                        "<a href='" + enlace + "' " +
                        "style='background-color: #5B4FCF; color: white; padding: 12px 24px; " +
                        "text-decoration: none; border-radius: 6px; font-size: 16px;'>" +
                        "Dirigite a la app" +
                        "</a>" +
                        "<br><br>" +
                        "<p style='color: #888; font-size: 13px;'>El equipo de Soyla</p>" +
                        "</div>";

                    helper.setText(html, true);

            mailSender.send(mensaje);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo de confirmación: " + e.getMessage());
        }
    }
}