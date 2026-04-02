CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int NOT NULL,
	`subjectId` int,
	`evidenceType` enum('photo','document','physical','digital','forensic','sensor_data','video','audio') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` varchar(512),
	`fileType` varchar(64),
	`fileSize` int,
	`collectedAt` timestamp,
	`collectedBy` varchar(255),
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`chainOfCustody` json,
	`metadata` json,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `probability_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int NOT NULL,
	`zoneName` varchar(128),
	`zoneType` enum('primary','secondary','tertiary','exclusion') NOT NULL DEFAULT 'primary',
	`probability` decimal(5,4),
	`geoJson` json,
	`centerLat` decimal(10,7),
	`centerLng` decimal(10,7),
	`areaKm2` decimal(10,4),
	`algorithm` varchar(64),
	`confidence` decimal(5,4),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `probability_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_operations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('planning','active','suspended','closed','cold_case') NOT NULL DEFAULT 'planning',
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`environment` enum('urban','suburban','wilderness','maritime','mountain','desert','arctic') NOT NULL DEFAULT 'wilderness',
	`centerLat` decimal(10,7),
	`centerLng` decimal(10,7),
	`radiusKm` decimal(8,2),
	`boundaryGeoJson` json,
	`probabilityScore` decimal(5,2),
	`weatherConditions` json,
	`terrainData` json,
	`notes` text,
	`startedAt` timestamp,
	`closedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_operations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`teamType` enum('ground','k9','aerial','marine','technical','gpr','drone','mounted') NOT NULL DEFAULT 'ground',
	`status` enum('available','deployed','returning','off_duty') NOT NULL DEFAULT 'available',
	`memberCount` int,
	`operationId` int,
	`currentLat` decimal(10,7),
	`currentLng` decimal(10,7),
	`assignedZoneId` int,
	`equipment` json,
	`contactInfo` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensor_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int NOT NULL,
	`sensorType` enum('drone_thermal','drone_lidar','drone_visual','gpr','acoustic','seismic','trail_camera','sonar','cell_ping','satellite') NOT NULL,
	`lat` decimal(10,7) NOT NULL,
	`lng` decimal(10,7) NOT NULL,
	`altitude` decimal(8,2),
	`reading` json,
	`anomalyDetected` boolean DEFAULT false,
	`anomalyConfidence` decimal(5,4),
	`capturedAt` timestamp NOT NULL,
	`processedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensor_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sightings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int NOT NULL,
	`subjectId` int,
	`lat` decimal(10,7) NOT NULL,
	`lng` decimal(10,7) NOT NULL,
	`sightedAt` timestamp NOT NULL,
	`sightingType` enum('visual','auditory','physical_evidence','electronic','scent','footprint','other') NOT NULL DEFAULT 'visual',
	`confidence` int NOT NULL,
	`description` text,
	`reporterName` varchar(255),
	`reporterContact` varchar(255),
	`photoUrl` varchar(512),
	`verified` boolean DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sightings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int,
	`subjectType` enum('human','animal','vehicle','object') NOT NULL,
	`subjectSubtype` varchar(64),
	`name` varchar(255) NOT NULL,
	`description` text,
	`photoUrl` varchar(512),
	`lastKnownLat` decimal(10,7),
	`lastKnownLng` decimal(10,7),
	`lastKnownAlt` decimal(8,2),
	`lastSeenAt` timestamp,
	`directionOfTravel` varchar(16),
	`circumstances` varchar(64),
	`status` enum('missing','located','deceased','suspended') NOT NULL DEFAULT 'missing',
	`attributes` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeline_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`operationId` int NOT NULL,
	`eventType` enum('status_change','sighting','team_deployed','team_recalled','probability_update','weather_update','evidence_found','note','decision','resource_change') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`metadata` json,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeline_events_id` PRIMARY KEY(`id`)
);
