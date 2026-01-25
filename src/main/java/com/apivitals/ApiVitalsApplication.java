package com.apivitals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ApiVitalsApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiVitalsApplication.class, args);
	}

}
