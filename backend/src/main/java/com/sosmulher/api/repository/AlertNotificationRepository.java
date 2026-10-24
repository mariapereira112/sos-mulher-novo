package com.sosmulher.api.repository;

import com.sosmulher.api.entity.AlertNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertNotificationRepository extends JpaRepository<AlertNotification, Integer> {
    List<AlertNotification> findByAlertId(Integer alertId);
}
