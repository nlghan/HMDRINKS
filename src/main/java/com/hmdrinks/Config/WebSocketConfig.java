package com.hmdrinks.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Cấu hình message broker
        config.enableSimpleBroker("/topic"); // Định nghĩa kênh topic
        config.setApplicationDestinationPrefixes("/app"); // Tiền tố cho các endpoint
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đăng ký endpoint cho client kết nối
        registry.addEndpoint("/ws").setAllowedOrigins("http://localhost:5173").withSockJS();
    }
}
