CREATE DATABASE IF NOT EXISTS capstoneGroup1DB;
USE capstoneGroup1DB;


CREATE TABLE IF NOT EXISTS Birdbox(
    boxID INT PRIMARY KEY,
    boxName VARCHAR(40) NOT NULL,
    boxLocation VARCHAR(255) NOT NULL,
    isOnline BOOLEAN NOT NULL DEFAULT FALSE,
    lastOnline TIMESTAMP,
    latCoord FLOAT,
    longCoord FLOAT
);

CREATE TABLE IF NOT EXISTS AppUser(
    userID INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    pass VARCHAR(150) NOT NULL UNIQUE,
    firstName VARCHAR(50),
    lastName VARCHAR(50)
);

CREATE TABLE Video (
    videoID INT AUTO_INCREMENT PRIMARY KEY,
    filePath VARCHAR(255) NOT NULL,
    originalName VARCHAR(255),
    mimeType VARCHAR(100),
    fileSize INT,
    durationSeconds FLOAT,
    capturedAt TIMESTAMP,
    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Observation (
    observationID INT AUTO_INCREMENT PRIMARY KEY,
    observationSpecies VARCHAR(100),
    observationTime TIMESTAMP,
    confidence INT,
    verification BOOLEAN DEFAULT NULL,
    verificationText VARCHAR(50),
    boxID INT NOT NULL,

    FOREIGN KEY (boxID)
        REFERENCES Birdbox(boxID)
        ON DELETE CASCADE
);

CREATE TABLE ObservationImage (
    imageID INT AUTO_INCREMENT PRIMARY KEY,
    observationID INT NOT NULL,
    filePath VARCHAR(255) NOT NULL,
    originalName VARCHAR(255),
    mimeType VARCHAR(100),
    fileSize INT,
    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (observationID)
        REFERENCES Observation(observationID)
        ON DELETE CASCADE
);

