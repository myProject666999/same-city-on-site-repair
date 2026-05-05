package controllers

import (
	"fmt"
	"net/http"
	"time"

	"repair-platform/config"
	"repair-platform/models"
	"repair-platform/utils"

	"github.com/gin-gonic/gin"
)

func GetCartList(c *gin.Context) {
	userID := c.GetUint("user_id")

	var cartItems []models.CartItem
	config.DB.Where("user_id = ?", userID).Preload("Product").Find(&cartItems)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": cartItems,
	})
}

func AddToCart(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		ProductID uint `json:"product_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var product models.Product
	if err := config.DB.First(&product, req.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "商品不存在",
		})
		return
	}

	var existingCartItem models.CartItem
	if config.DB.Where("user_id = ? AND product_id = ?", userID, req.ProductID).First(&existingCartItem).Error == nil {
		existingCartItem.Quantity += req.Quantity
		if err := config.DB.Save(&existingCartItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "添加购物车失败",
			})
			return
		}
	} else {
		cartItem := models.CartItem{
			UserID:    userID,
			ProductID: req.ProductID,
			Quantity:  req.Quantity,
		}
		if err := config.DB.Create(&cartItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "添加购物车失败",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "添加成功",
	})
}

func UpdateCart(c *gin.Context) {
	userID := c.GetUint("user_id")
	cartItemID := c.Param("id")

	var req struct {
		Quantity int `json:"quantity" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var cartItem models.CartItem
	if err := config.DB.Where("id = ? AND user_id = ?", cartItemID, userID).First(&cartItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "购物车项不存在",
		})
		return
	}

	if req.Quantity <= 0 {
		config.DB.Delete(&cartItem)
	} else {
		cartItem.Quantity = req.Quantity
		config.DB.Save(&cartItem)
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

func RemoveFromCart(c *gin.Context) {
	userID := c.GetUint("user_id")
	cartItemID := c.Param("id")

	var cartItem models.CartItem
	if err := config.DB.Where("id = ? AND user_id = ?", cartItemID, userID).First(&cartItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "购物车项不存在",
		})
		return
	}

	if err := config.DB.Delete(&cartItem).Error; err != nil {
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

func CreateOrder(c *gin.Context) {
	userID := c.GetUint("user_id")

	type OrderItemRequest struct {
		ProductID uint   `json:"product_id" binding:"required"`
		ProductName string `json:"product_name"`
		ProductImage string `json:"product_image"`
		Price    float64 `json:"price" binding:"required"`
		Quantity int     `json:"quantity" binding:"required"`
	}

	var req struct {
		CartItemIDs     []uint              `json:"cart_item_ids"`
		Items           []OrderItemRequest  `json:"items"`
		ReceiverName    string              `json:"receiver_name" binding:"required"`
		ReceiverPhone   string              `json:"receiver_phone" binding:"required"`
		ReceiverAddress string              `json:"receiver_address" binding:"required"`
		Remark          string              `json:"remark"`
		PayMethod       string              `json:"pay_method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误: " + err.Error(),
		})
		return
	}

	var orderItemsToCreate []models.OrderItem
	var totalAmount float64

	if len(req.CartItemIDs) > 0 {
		var cartItems []models.CartItem
		if err := config.DB.Where("id IN ? AND user_id = ?", req.CartItemIDs, userID).Preload("Product").Find(&cartItems).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "购物车项不存在",
			})
			return
		}

		if len(cartItems) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "请选择要下单的商品",
			})
			return
		}

		for _, item := range cartItems {
			totalAmount += item.Product.Price * float64(item.Quantity)
			orderItemsToCreate = append(orderItemsToCreate, models.OrderItem{
				ProductID:    item.ProductID,
				ProductName:  item.Product.Name,
				ProductImage: item.Product.Image,
				Price:        item.Product.Price,
				Quantity:     item.Quantity,
			})
		}

		order := models.Order{
			OrderNo:         utils.GenerateOrderNo(),
			UserID:          userID,
			ReceiverName:    req.ReceiverName,
			ReceiverPhone:   req.ReceiverPhone,
			ReceiverAddress: req.ReceiverAddress,
			TotalAmount:     totalAmount,
			Status:          0,
			PayMethod:       req.PayMethod,
			Remark:          req.Remark,
		}

		tx := config.DB.Begin()
		if err := tx.Create(&order).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "创建订单失败",
			})
			return
		}

		for i := range orderItemsToCreate {
			orderItemsToCreate[i].OrderID = order.ID
			if err := tx.Create(&orderItemsToCreate[i]).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"code": 500,
					"msg":  "创建订单项失败",
				})
				return
			}
		}

		var cartItemIDs []uint
		for _, item := range cartItems {
			cartItemIDs = append(cartItemIDs, item.ID)
		}
		if err := tx.Where("id IN ?", cartItemIDs).Delete(&models.CartItem{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "清理购物车失败",
			})
			return
		}

		tx.Commit()

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"msg":  "下单成功",
			"data": gin.H{
				"order_id": order.ID,
				"order_no": order.OrderNo,
			},
		})
	} else if len(req.Items) > 0 {
		for _, item := range req.Items {
			if item.ProductID <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"code": 400,
					"msg":  "商品ID不能为空",
				})
				return
			}
			if item.Quantity <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"code": 400,
					"msg":  "商品数量必须大于0",
				})
				return
			}
			if item.Price < 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"code": 400,
					"msg":  "商品价格不能为负数",
				})
				return
			}

			var product models.Product
			if err := config.DB.First(&product, item.ProductID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"code": 404,
					"msg":  fmt.Sprintf("商品不存在: ID=%d", item.ProductID),
				})
				return
			}

			totalAmount += product.Price * float64(item.Quantity)
			orderItemsToCreate = append(orderItemsToCreate, models.OrderItem{
				ProductID:    item.ProductID,
				ProductName:  product.Name,
				ProductImage: product.Image,
				Price:        product.Price,
				Quantity:     item.Quantity,
			})
		}

		if len(orderItemsToCreate) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "请选择要下单的商品",
			})
			return
		}

		order := models.Order{
			OrderNo:         utils.GenerateOrderNo(),
			UserID:          userID,
			ReceiverName:    req.ReceiverName,
			ReceiverPhone:   req.ReceiverPhone,
			ReceiverAddress: req.ReceiverAddress,
			TotalAmount:     totalAmount,
			Status:          0,
			PayMethod:       req.PayMethod,
			Remark:          req.Remark,
		}

		tx := config.DB.Begin()
		if err := tx.Create(&order).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "创建订单失败",
			})
			return
		}

		for i := range orderItemsToCreate {
			orderItemsToCreate[i].OrderID = order.ID
			if err := tx.Create(&orderItemsToCreate[i]).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"code": 500,
					"msg":  "创建订单项失败",
				})
				return
			}
		}

		tx.Commit()

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"msg":  "下单成功",
			"data": gin.H{
				"order_id": order.ID,
				"order_no": order.OrderNo,
			},
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请选择要下单的商品",
		})
		return
	}
}

func GetOrderList(c *gin.Context) {
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

	status := c.Query("status")
	keyword := c.Query("keyword")

	var orders []models.Order
	var total int64

	query := config.DB.Model(&models.Order{}).Preload("User").Preload("Items")

	if role == "user" {
		query = query.Where("user_id = ?", userID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if keyword != "" {
		query = query.Where("order_no LIKE ? OR receiver_name LIKE ? OR receiver_phone LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Count(&total)

	offset := (page - 1) * pageSize
	query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&orders)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": gin.H{
			"list":      orders,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

func GetOrderDetail(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")
	orderID := c.Param("id")

	var order models.Order
	query := config.DB.Preload("Items")

	if role == "user" {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "订单不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "获取成功",
		"data": order,
	})
}

func PayOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "订单不存在",
		})
		return
	}

	if order.Status != 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "订单状态不正确",
		})
		return
	}

	now := time.Now()
	order.Status = 1
	order.PayTime = &now

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "支付失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "支付成功",
	})
}

func CancelOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	role := c.GetString("role")
	orderID := c.Param("id")

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	var order models.Order
	query := config.DB

	if role == "user" {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "订单不存在",
		})
		return
	}

	if order.Status != 0 && order.Status != 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "订单状态不正确，无法取消",
		})
		return
	}

	order.Status = 4
	order.CancelReason = req.Reason

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "取消订单失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "订单已取消",
	})
}

func CompleteOrder(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "订单不存在",
		})
		return
	}

	if order.Status != 1 && order.Status != 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "订单状态不正确",
		})
		return
	}

	now := time.Now()
	order.Status = 3
	order.CompleteTime = &now

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "操作失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "操作成功",
	})
}

func DeleteOrder(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "订单不存在",
		})
		return
	}

	tx := config.DB.Begin()

	if err := tx.Where("order_id = ?", order.ID).Delete(&models.OrderItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除订单项失败",
		})
		return
	}

	if err := tx.Delete(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除订单失败",
		})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}

func RefundOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderID := c.Param("id")

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "参数错误",
		})
		return
	}

	var order models.Order
	if err := config.DB.Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "订单不存在",
		})
		return
	}

	if order.Status != 1 && order.Status != 2 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "订单状态不正确，无法申请退货",
		})
		return
	}

	order.Status = 5
	order.CancelReason = req.Reason

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "申请退货失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "退货申请已提交",
	})
}
