CREATE TABLE IF NOT EXISTS `i_radar_collected_fines` (
  `radar_name` VARCHAR(255) NOT NULL,
  `collected_amount` INT(11) NOT NULL DEFAULT 0,
  `last_collector_name` VARCHAR(255) DEFAULT NULL,
  `last_collector_identifier` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`radar_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `i_speeding_infractions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `identifier` VARCHAR(255) NOT NULL,
  `player_name` VARCHAR(255) NOT NULL,
  `radar_type` VARCHAR(50) NOT NULL,
  `radar_name` VARCHAR(255) NOT NULL,
  `player_speed` INT(11) NOT NULL,
  `speed_limit` INT(11) NOT NULL,
  `fine_amount` INT(11) NOT NULL,
  `points_added` INT(11) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `i_player_penalty_points` (
  `identifier` VARCHAR(255) NOT NULL,
  `points` INT(11) NOT NULL DEFAULT 0,
  `last_decay` INT(11) NOT NULL DEFAULT 0,
  `revocation_count` INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `i_revoked_licenses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `identifier` VARCHAR(255) NOT NULL,
  `license_type` VARCHAR(255) NOT NULL,
  `revoked_until` INT(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;