package com.fabrica.soyla;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SoylaApplication {

	public static void main(String[] args) {
		SpringApplication.run(SoylaApplication.class, args);
	}

}
