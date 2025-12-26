CREATE TABLE IF NOT EXISTS `i_radars_storage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `radar_type` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `radar_type` (`radar_type`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;