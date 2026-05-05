package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"`
	Email     string         `json:"email"`
	Phone     string         `json:"phone"`
	RealName  string         `json:"real_name"`
	Avatar    string         `json:"avatar"`
	Role      string         `json:"role" gorm:"default:'user'"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type Category struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Sort        int            `json:"sort" gorm:"default:0"`
	ParentID    *uint          `json:"parent_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Products    []Product      `json:"products,omitempty"`
}

type Product struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Name          string         `json:"name" gorm:"not null"`
	CategoryID    uint           `json:"category_id"`
	Category      Category       `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Price         float64        `json:"price"`
	OriginalPrice float64        `json:"original_price"`
	Stock         int            `json:"stock" gorm:"default:999"`
	Image         string         `json:"image"`
	Images        string         `json:"images"`
	Description   string         `json:"description"`
	Detail        string         `json:"detail"`
	Status        int            `json:"status" gorm:"default:1"`
	Sales         int            `json:"sales" gorm:"default:0"`
	Sort          int            `json:"sort" gorm:"default:0"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

type CartItem struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	ProductID uint      `json:"product_id"`
	Product   Product   `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Order struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	OrderNo      string         `json:"order_no" gorm:"uniqueIndex;not null"`
	UserID       uint           `json:"user_id"`
	User         User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	ReceiverName string         `json:"receiver_name"`
	ReceiverPhone string        `json:"receiver_phone"`
	ReceiverAddress string      `json:"receiver_address"`
	TotalAmount  float64        `json:"total_amount"`
	Status       int            `json:"status" gorm:"default:0"`
	PayMethod    string         `json:"pay_method"`
	PayTime      *time.Time     `json:"pay_time"`
	CompleteTime *time.Time     `json:"complete_time"`
	Remark       string         `json:"remark"`
	CancelReason string         `json:"cancel_reason"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	Items        []OrderItem    `json:"items,omitempty" gorm:"foreignKey:OrderID"`
}

type OrderItem struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	OrderID      uint      `json:"order_id"`
	ProductID    uint      `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductImage string    `json:"product_image"`
	Price        float64   `json:"price"`
	Quantity     int       `json:"quantity"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Comment struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id"`
	User        User           `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Title       string         `json:"title"`
	Content     string         `json:"content"`
	Reply       string         `json:"reply"`
	ReplyUserID *uint          `json:"reply_user_id"`
	Status      int            `json:"status" gorm:"default:0"`
	RepliedAt   *time.Time     `json:"replied_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type News struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Title     string         `json:"title" gorm:"not null"`
	Image     string         `json:"image"`
	Content   string         `json:"content"`
	Summary   string         `json:"summary"`
	Author    string         `json:"author"`
	Views     int            `json:"views" gorm:"default:0"`
	Status    int            `json:"status" gorm:"default:1"`
	IsTop     int            `json:"is_top" gorm:"default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

type Banner struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	Image     string    `json:"image"`
	Link      string    `json:"link"`
	Sort      int       `json:"sort" gorm:"default:0"`
	Status    int       `json:"status" gorm:"default:1"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
