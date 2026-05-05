package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"repair-platform/config"
	"repair-platform/models"
	"repair-platform/utils"

	"github.com/gin-gonic/gin"
)

func GetCommentList(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")

	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if ps := c.Query("page_size"); ps != "" {
		fmt.Sscanf(ps, "%d", &pageSize)
	}

	keyword := c.Query("keyword")
	status := c.Query("status")

	var comments []models.Comment
	var total int64

	query := config.DB.Model(&models.Comment{}).Preload("User")

	if role == "user" {
		query = query.Where("user_id = ?", userID)
	}

	if keyword != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&comments)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":      comments,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func GetCommentDetail(c *gin.Context) {
	id := c.Param("id")

	var comment models.Comment
	if err := config.DB.Preload("User").First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "留言不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": comment,
	})
}

func CreateComment(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	comment := models.Comment{
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
		Status:  0,
	}

	if err := config.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "发布留言失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "发布成功",
		"data": comment,
	})
}

func ReplyComment(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Reply string `json:"reply" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var comment models.Comment
	if err := config.DB.First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "留言不存在",
		})
		return
	}

	now := time.Now()
	comment.Reply = req.Reply
	comment.Status = 1
	comment.RepliedAt = &now

	if err := config.DB.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "回复失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "回复成功",
	})
}

func DeleteComment(c *gin.Context) {
	id := c.Param("id")

	var comment models.Comment
	if err := config.DB.First(&comment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "留言不存在",
		})
		return
	}

	if err := config.DB.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}

func GetNewsList(c *gin.Context) {
	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if ps := c.Query("page_size"); ps != "" {
		fmt.Sscanf(ps, "%d", &pageSize)
	}

	keyword := c.Query("keyword")
	status := c.Query("status")

	var news []models.News
	var total int64

	query := config.DB.Model(&models.News{})

	if keyword != "" {
		query = query.Where("title LIKE ? OR summary LIKE ? OR content LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("is_top DESC, created_at DESC").Find(&news)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":      news,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func GetNewsDetail(c *gin.Context) {
	id := c.Param("id")

	var news models.News
	if err := config.DB.First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "新闻不存在",
		})
		return
	}

	news.Views++
	config.DB.Save(&news)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": news,
	})
}

func CreateNews(c *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Image   string `json:"image"`
		Content string `json:"content" binding:"required"`
		Summary string `json:"summary"`
		Author  string `json:"author"`
		Status  int    `json:"status"`
		IsTop   int    `json:"is_top"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	news := models.News{
		Title:   req.Title,
		Image:   req.Image,
		Content: req.Content,
		Summary: req.Summary,
		Author:  req.Author,
		Views:   0,
		Status:  req.Status,
		IsTop:   req.IsTop,
	}

	if err := config.DB.Create(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建新闻失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "创建成功",
		"data": news,
	})
}

func UpdateNews(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Title   string `json:"title"`
		Image   string `json:"image"`
		Content string `json:"content"`
		Summary string `json:"summary"`
		Author  string `json:"author"`
		Status  int    `json:"status"`
		IsTop   int    `json:"is_top"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var news models.News
	if err := config.DB.First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "新闻不存在",
		})
		return
	}

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.Summary != "" {
		updates["summary"] = req.Summary
	}
	if req.Author != "" {
		updates["author"] = req.Author
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}
	if req.IsTop != 0 {
		updates["is_top"] = req.IsTop
	}

	if len(updates) > 0 {
		if err := config.DB.Model(&news).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "更新新闻失败",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

func DeleteNews(c *gin.Context) {
	id := c.Param("id")

	var news models.News
	if err := config.DB.First(&news, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "新闻不存在",
		})
		return
	}

	if err := config.DB.Delete(&news).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除新闻失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}

func UploadNewsImage(c *gin.Context) {
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

	uploadDir := "./uploads/news"
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
