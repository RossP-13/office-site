-- Renwood test data for manual SQL upload
-- Inserts a new birdbox and four observations.

INSERT INTO Birdbox (boxID, boxName, boxLocation, isOnline, lastOnline, latCoord, longCoord)
VALUES (3, 'renwood', 'Renwood Test Location', FALSE, '2026-04-04 00:00:00', 42.791888435839496, -78.45413126913245);

INSERT INTO Observation (observationID, observationSpecies, observationTime, confidence, verification, boxID)
VALUES
INSERT INTO Observation (observationID, observationSpecies, observationTime, confidence, verification, boxID)
VALUES
(11, 'COMMON IORA', NOW() - INTERVAL 2 HOUR, 5, NULL, 3),
(12, 'JAVA SPARROW', NOW() - INTERVAL 6 HOUR, 15, NULL, 3),
(13, 'VIOLET GREEN SWALLOW', NOW() - INTERVAL 12 HOUR, 7, NULL, 3),
(14, 'JAVA SPARROW', NOW() - INTERVAL 20 HOUR, 13, NULL, 3);

INSERT INTO ObservationImage (imageID, observationID, filePath, originalName, mimeType, fileSize, uploadedAt)
VALUES
(11, 11, 'images/renwood202603250736.jpg.jpg', 'renwood202603250736.jpg.jpg', 'image/jpeg', NULL, '2026-03-25 07:36:00'),
(12, 12, 'images/renwood202603291538.jpg.jpg', 'renwood202603291538.jpg.jpg', 'image/jpeg', NULL, '2026-03-29 15:38:00'),
(13, 13, 'images/renwood202604021814.jpg.jpg', 'renwood202604021814.jpg.jpg', 'image/jpeg', NULL, '2026-04-02 18:14:00'),
(14, 14, 'images/renwood202604041829.jpg.jpg', 'renwood202604041829.jpg.jpg', 'image/jpeg', NULL, '2026-04-04 18:29:00');


INSERT INTO Observation (observationID, observationSpecies, observationTime, confidence, verification, boxID)
VALUES
(15, 'Kestrel', NOW() - INTERVAL 1 HOUR, 85, TRUE, 3),
(16, 'Kestrel', NOW() - INTERVAL 5 HOUR, 70, TRUE, 3),
(17, 'Kestrel', NOW() - INTERVAL 9 HOUR, 69, NULL, 3),
(18, 'Kestrel', NOW() - INTERVAL 18 HOUR, 13, NULL, 3);

INSERT INTO ObservationImage (imageID, observationID, filePath, originalName, mimeType, fileSize, uploadedAt)
VALUES
(15, 15, 'images/renwood202603250736.jpg.jpg', 'renwood202603250737.jpg.jpg', 'image/jpeg', NULL, '2026-03-25 07:36:05'),
(16, 16, 'images/renwood202603291538.jpg.jpg', 'renwood202603291539.jpg.jpg', 'image/jpeg', NULL, '2026-03-29 15:38:05'),
(17, 17, 'images/renwood202604021814.jpg.jpg', 'renwood202604021815.jpg.jpg', 'image/jpeg', NULL, '2026-04-02 18:14:05'),
(18, 18, 'images/renwood202604041829.jpg.jpg', 'renwood202604041826.jpg.jpg', 'image/jpeg', NULL, '2026-04-04 18:29:05');


INSERT INTO AppUser (userID, username, pass, firstName, lastName)
VALUES (1, 'glt-admin2', 'showtime2', 'DB', 'Tester');