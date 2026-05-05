package config

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB
var JWTSecret = []byte("repair-platform-jwt-secret-key-2024")

func InitConfig() {
	log.Println("Configuration initialized")
}

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open("./repair.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connected successfully")
}

func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}
