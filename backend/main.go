package main

import (
	"log"
	"time"

	"repair-platform/config"
	"repair-platform/models"
	"repair-platform/routes"
	"repair-platform/utils"
)

func main() {
	config.InitConfig()

	config.InitDB()
	defer config.CloseDB()

	err := config.DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Product{},
		&models.CartItem{},
		&models.Order{},
		&models.OrderItem{},
		&models.Comment{},
		&models.News{},
		&models.Banner{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	seedData()

	router := routes.SetupRouter()

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func seedData() {
	var count int64
	config.DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("Seed data already exists, skipping...")
		return
	}

	log.Println("Creating seed data...")

	hashedPassword, _ := utils.HashPassword("123456")

	admin := models.User{
		Username: "admin",
		Password: hashedPassword,
		Email:    "admin@repair.com",
		Phone:    "13800138000",
		RealName: "系统管理员",
		Role:     "admin",
	}
	config.DB.Create(&admin)

	staff := models.User{
		Username: "staff",
		Password: hashedPassword,
		Email:    "staff@repair.com",
		Phone:    "13800138001",
		RealName: "维修员工",
		Role:     "staff",
	}
	config.DB.Create(&staff)

	user := models.User{
		Username: "user",
		Password: hashedPassword,
		Email:    "user@repair.com",
		Phone:    "13800138002",
		RealName: "普通用户",
		Role:     "user",
	}
	config.DB.Create(&user)

	categories := []models.Category{
		{Name: "家电维修", Description: "电视、冰箱、洗衣机等家电维修", Sort: 1},
		{Name: "水电维修", Description: "水管、电路、灯具维修", Sort: 2},
		{Name: "家具安装", Description: "衣柜、床、桌椅等家具安装", Sort: 3},
		{Name: "管道疏通", Description: "马桶、下水道疏通服务", Sort: 4},
		{Name: "空调服务", Description: "空调安装、移机、清洗", Sort: 5},
	}
	config.DB.Create(&categories)

	products := []models.Product{
		{
			Name:         "电视机维修",
			CategoryID:   1,
			Price:        99.00,
			OriginalPrice: 150.00,
			Stock:        999,
			Description:  "专业电视机维修，屏幕更换、主板维修、电源故障处理",
			Detail:       "<h3>服务内容</h3><p>专业电视机维修服务，包括：</p><ul><li>屏幕维修更换</li><li>主板故障维修</li><li>电源故障处理</li><li>遥控器故障排查</li></ul>",
			Status:       1,
			Sales:        156,
			Sort:         1,
		},
		{
			Name:         "冰箱维修",
			CategoryID:   1,
			Price:        120.00,
			OriginalPrice: 180.00,
			Stock:        999,
			Description:  "冰箱不制冷、漏水、噪音大等问题维修",
			Detail:       "<h3>服务内容</h3><p>专业冰箱维修服务，包括：</p><ul><li>制冷系统维修</li><li>压缩机更换</li><li>漏水问题处理</li><li>温控器调试</li></ul>",
			Status:       1,
			Sales:        89,
			Sort:         2,
		},
		{
			Name:         "水管漏水维修",
			CategoryID:   2,
			Price:        80.00,
			OriginalPrice: 120.00,
			Stock:        999,
			Description:  "快速上门处理水管漏水、破裂问题",
			Detail:       "<h3>服务内容</h3><p>专业水管维修服务，包括：</p><ul><li>漏水检测维修</li><li>水管破裂更换</li><li>水龙头更换</li><li>阀门维修更换</li></ul>",
			Status:       1,
			Sales:        234,
			Sort:         1,
		},
		{
			Name:         "电路故障维修",
			CategoryID:   2,
			Price:        100.00,
			OriginalPrice: 150.00,
			Stock:        999,
			Description:  "电路跳闸、插座没电、灯具故障维修",
			Detail:       "<h3>服务内容</h3><p>专业电路维修服务，包括：</p><ul><li>跳闸故障排查</li><li>插座安装维修</li><li>灯具安装维修</li><li>线路改造</li></ul>",
			Status:       1,
			Sales:        178,
			Sort:         2,
		},
		{
			Name:         "衣柜安装",
			CategoryID:   3,
			Price:        150.00,
			OriginalPrice: 200.00,
			Stock:        999,
			Description:  "专业衣柜安装服务，网购家具上门安装",
			Detail:       "<h3>服务内容</h3><p>专业家具安装服务，包括：</p><ul><li>衣柜组装</li><li>鞋柜安装</li><li>书柜安装</li><li>电视柜安装</li></ul>",
			Status:       1,
			Sales:        67,
			Sort:         1,
		},
		{
			Name:         "马桶疏通",
			CategoryID:   4,
			Price:        80.00,
			OriginalPrice: 120.00,
			Stock:        999,
			Description:  "快速疏通马桶堵塞问题",
			Detail:       "<h3>服务内容</h3><p>专业管道疏通服务，包括：</p><ul><li>马桶疏通</li><li>地漏疏通</li><li>洗菜池疏通</li><li>卫生间下水道疏通</li></ul>",
			Status:       1,
			Sales:        321,
			Sort:         1,
		},
		{
			Name:         "空调清洗",
			CategoryID:   5,
			Price:        120.00,
			OriginalPrice: 180.00,
			Stock:        999,
			Description:  "专业空调深度清洗服务",
			Detail:       "<h3>服务内容</h3><p>专业空调清洗服务，包括：</p><ul><li>过滤网清洗</li><li>蒸发器清洗</li><li>外壳清洁</li><li>杀菌消毒</li></ul>",
			Status:       1,
			Sales:        245,
			Sort:         1,
		},
		{
			Name:         "空调加氟",
			CategoryID:   5,
			Price:        150.00,
			OriginalPrice: 200.00,
			Stock:        999,
			Description:  "空调制冷效果差？专业加氟服务",
			Detail:       "<h3>服务内容</h3><p>专业空调加氟服务，包括：</p><ul><li>冷媒检测</li><li>冷媒补充</li><li>泄漏检测</li><li>压力调试</li></ul>",
			Status:       1,
			Sales:        167,
			Sort:         2,
		},
	}
	config.DB.Create(&products)

	banners := []models.Banner{
		{
			Title: "专业家电维修服务",
			Image: "",
			Link:  "/products?category=1",
			Sort:  1,
			Status: 1,
		},
		{
			Title: "水电维修快速上门",
			Image: "",
			Link:  "/products?category=2",
			Sort:  2,
			Status: 1,
		},
		{
			Title: "管道疏通24小时服务",
			Image: "",
			Link:  "/products?category=4",
			Sort:  3,
			Status: 1,
		},
	}
	config.DB.Create(&banners)

	news := []models.News{
		{
			Title:  "夏季空调使用注意事项",
			Author: "维修小助手",
			Summary: "夏季是空调使用高峰期，正确使用空调不仅能延长寿命，还能省电...",
			Content: "<h3>夏季空调使用注意事项</h3><p>1. 温度设置不宜过低，建议26℃左右</p><p>2. 定期清洗过滤网，保证空气质量</p><p>3. 不要频繁开关空调，减少能耗</p><p>4. 保持室外机通风良好</p>",
			Status: 1,
			IsTop:  1,
			Views:  1256,
		},
		{
			Title:  "家庭用电安全小知识",
			Author: "维修小助手",
			Summary: "家庭用电安全不容忽视，了解这些小知识让您和家人更安全...",
			Content: "<h3>家庭用电安全小知识</h3><p>1. 不要用湿手触碰插座和电器</p><p>2. 大功率电器不要共用一个插座</p><p>3. 定期检查电线是否有老化破损</p><p>4. 离开家时记得关闭不必要的电器</p>",
			Status: 1,
			IsTop:  0,
			Views:  892,
		},
		{
			Title:  "冰箱不制冷的常见原因",
			Author: "维修小助手",
			Summary: "冰箱不制冷是常见故障，了解这些原因可以帮助您快速解决问题...",
			Content: "<h3>冰箱不制冷的常见原因</h3><p>1. 温控器设置不当</p><p>2. 门封条老化导致冷气泄漏</p><p>3. 压缩机故障</p><p>4. 制冷剂泄漏</p><p>5. 过滤网堵塞</p>",
			Status: 1,
			IsTop:  0,
			Views:  654,
		},
	}
	config.DB.Create(&news)

	now := time.Now()
	comments := []models.Comment{
		{
			UserID:  3,
			Title:   "服务很专业",
			Content: "昨天预约了空调清洗服务，师傅上门很准时，清洗得很干净，价格也合理。",
			Status:  0,
			CreatedAt: now.Add(-48 * time.Hour),
		},
		{
			UserID:  3,
			Title:   "水管漏水问题已解决",
			Content: "家里厨房水管漏水，联系平台后很快就有师傅上门，问题当天就解决了，非常满意！",
			Status:  1,
			Reply:   "感谢您的评价！我们会继续努力提供优质服务。",
			RepliedAt: &now,
			CreatedAt: now.Add(-72 * time.Hour),
		},
	}
	config.DB.Create(&comments)

	log.Println("Seed data created successfully!")
	log.Println("Default accounts:")
	log.Println("  - Admin: username=admin, password=123456")
	log.Println("  - Staff: username=staff, password=123456")
	log.Println("  - User:  username=user,  password=123456")
}
