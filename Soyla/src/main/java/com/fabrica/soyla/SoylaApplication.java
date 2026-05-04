package com.fabrica.soyla;

import java.net.URI;
import java.net.URISyntaxException;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SoylaApplication {

	public static void main(String[] args) {
		configureRenderDatabaseConnection();
		SpringApplication.run(SoylaApplication.class, args);
	}

	private static void configureRenderDatabaseConnection() {
		String databaseUrl = System.getenv("DATABASE_URL");
		if (databaseUrl == null || databaseUrl.isBlank()) {
			return;
		}

		if (!(databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://"))) {
			return;
		}

		try {
			URI uri = new URI(databaseUrl);
			String host = uri.getHost();
			int port = uri.getPort() > 0 ? uri.getPort() : 5432;
			String databaseName = uri.getPath() != null ? uri.getPath().replaceFirst("^/", "") : "";

			if (host == null || databaseName.isBlank()) {
				return;
			}

			System.setProperty(
				"spring.datasource.url",
				"jdbc:postgresql://" + host + ":" + port + "/" + databaseName
			);

			String userInfo = uri.getUserInfo();
			if (userInfo == null || userInfo.isBlank()) {
				return;
			}

			String[] credentials = userInfo.split(":", 2);
			if (credentials.length > 0 && !credentials[0].isBlank()) {
				System.setProperty("spring.datasource.username", credentials[0]);
			}

			if (credentials.length > 1 && !credentials[1].isBlank()) {
				System.setProperty("spring.datasource.password", credentials[1]);
			}
		} catch (URISyntaxException exception) {
			throw new IllegalStateException("No se pudo interpretar DATABASE_URL", exception);
		}
	}

}
