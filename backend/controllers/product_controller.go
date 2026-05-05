package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"repair-platform/config"
	"repair-platform/models"
	"repair-platform/utils"

	"github.com/gin-gonic/gin"
)

func GetCategoryList(c *gin.Context) {
	var categories []models.Category
	config.DB.Order("sort ASC, created_at DESC").Find(&categories)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": categories,
	})
}

func GetCategoryDetail(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := config.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "分类不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": category,
	})
}

func CreateCategory(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Sort        int    `json:"sort"`
		ParentID    *uint  `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	category := models.Category{
		Name:        req.Name,
		Description: req.Description,
		Sort:        req.Sort,
		ParentID:    req.ParentID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := config.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建分类失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": category,
	})
}

func UpdateCategory(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Sort        int    `json:"sort"`
		ParentID    *uint  `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var category models.Category
	if err := config.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "分类不存在",
		})
		return
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Sort != 0 {
		updates["sort"] = req.Sort
	}
	if req.ParentID != nil {
		updates["parent_id"] = req.ParentID
	}

	if err := config.DB.Model(&category).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新分类失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

func DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := config.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "分类不存在",
		})
		return
	}

	var count int64
	config.DB.Model(&models.Product{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "该分类下有商品，不能删除",
		})
		return
	}

	if err := config.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除分类失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}

func GetProductList(c *gin.Context) {
	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if ps := c.Query("page_size"); ps != "" {
		fmt.Sscanf(ps, "%d", &pageSize)
	}

	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")
	status := c.Query("status")

	var products []models.Product
	var total int64

	query := config.DB.Model(&models.Product{}).Preload("Category")

	if keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("sort ASC, created_at DESC").Find(&products)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":      products,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func GetProductDetail(c *gin.Context) {
	id := c.Param("id")

	var product models.Product
	if err := config.DB.Preload("Category").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "商品不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": product,
	})
}

func CreateProduct(c *gin.Context) {
	var req struct {
		Name          string  `json:"name" binding:"required"`
		CategoryID    uint    `json:"category_id" binding:"required"`
		Price         float64 `json:"price"`
		OriginalPrice float64 `json:"original_price"`
		Stock         int     `json:"stock"`
		Image         string  `json:"image"`
		Images        string  `json:"images"`
		Description   string  `json:"description"`
		Detail        string  `json:"detail"`
		Status        int     `json:"status"`
		Sort          int     `json:"sort"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	product := models.Product{
		Name:          req.Name,
		CategoryID:    req.CategoryID,
		Price:         req.Price,
		OriginalPrice: req.OriginalPrice,
		Stock:         req.Stock,
		Image:         req.Image,
		Images:        req.Images,
		Description:   req.Description,
		Detail:        req.Detail,
		Status:        req.Status,
		Sort:          req.Sort,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建商品失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": product,
	})
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Name          string  `json:"name"`
		CategoryID    uint    `json:"category_id"`
		Price         float64 `json:"price"`
		OriginalPrice float64 `json:"original_price"`
		Stock         int     `json:"stock"`
		Image         string  `json:"image"`
		Images        string  `json:"images"`
		Description   string  `json:"description"`
		Detail        string  `json:"detail"`
		Status        int     `json:"status"`
		Sort          int     `json:"sort"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "商品不存在",
		})
		return
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.CategoryID != 0 {
		updates["category_id"] = req.CategoryID
	}
	if req.Price != 0 {
		updates["price"] = req.Price
	}
	if req.OriginalPrice != 0 {
		updates["original_price"] = req.OriginalPrice
	}
	if req.Stock != 0 {
		updates["stock"] = req.Stock
	}
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.Images != "" {
		updates["images"] = req.Images
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Detail != "" {
		updates["detail"] = req.Detail
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}
	if req.Sort != 0 {
		updates["sort"] = req.Sort
	}

	if err := config.DB.Model(&product).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新商品失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")

	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "商品不存在",
		})
		return
	}

	if err := config.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除商品失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}

func UploadProductImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请选择要上传的图片",
		})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "只支持jpg、jpeg、png、gif格式的图片",
		})
		return
	}

	uploadDir := "./uploads/products"
	filePath, err := utils.UploadFile(file, uploadDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "上传失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "上传成功",
		"data": gin.H{
			"url": filePath,
		},
	})
}

func GetBannerList(c *gin.Context) {
	var banners []models.Banner
	config.DB.Where("status = 1").Order("sort ASC, created_at DESC").Find(&banners)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": banners,
	})
}

func CreateBanner(c *gin.Context) {
	var req struct {
		Title  string `json:"title"`
		Image  string `json:"image"`
		Link   string `json:"link"`
		Sort   int    `json:"sort"`
		Status int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	banner := models.Banner{
		Title:     req.Title,
		Image:     req.Image,
		Link:      req.Link,
		Sort:      req.Sort,
		Status:    req.Status,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := config.DB.Create(&banner).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建轮播图失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": banner,
	})
}

func UpdateBanner(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Title  string `json:"title"`
		Image  string `json:"image"`
		Link   string `json:"link"`
		Sort   int    `json:"sort"`
		Status int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var banner models.Banner
	if err := config.DB.First(&banner, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "轮播图不存在",
		})
		return
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.Link != "" {
		updates["link"] = req.Link
	}
	if req.Sort != 0 {
		updates["sort"] = req.Sort
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if err := config.DB.Model(&banner).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新轮播图失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

func DeleteBanner(c *gin.Context) {
	id := c.Param("id")

	idUint, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	if err := config.DB.Delete(&models.Banner{}, idUint).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除轮播图失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}
