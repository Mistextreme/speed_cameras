ALTER TABLE `i_speeding_infractions`
ADD COLUMN `owner_identifier` VARCHAR(255) NULL DEFAULT NULL AFTER `points_added`,
ADD COLUMN `owner_name` VARCHAR(255) NULL DEFAULT NULL AFTER `owner_identifier`;