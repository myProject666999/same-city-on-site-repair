package routes

import (
	"repair-platform/controllers"
	"repair-platform/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		api.POST("/register", controllers.Register)
		api.POST("/login", controllers.Login)

		api.GET("/categories", controllers.GetCategoryList)
		api.GET("/categories/:id", controllers.GetCategoryDetail)

		api.GET("/products", controllers.GetProductList)
		api.GET("/products/:id", controllers.GetProductDetail)

		api.GET("/banners", controllers.GetBannerList)

		api.GET("/news", controllers.GetNewsList)
		api.GET("/news/:id", controllers.GetNewsDetail)

		auth := api.Group("")
		auth.Use(middleware.JWTAuth())
		{
			auth.GET("/profile", controllers.GetProfile)
			auth.PUT("/profile", controllers.UpdateProfile)
			auth.PUT("/password", controllers.UpdatePassword)
			auth.POST("/avatar", controllers.UploadAvatar)

			auth.GET("/cart", controllers.GetCartList)
			auth.POST("/cart", controllers.AddToCart)
			auth.PUT("/cart/:id", controllers.UpdateCart)
			auth.DELETE("/cart/:id", controllers.RemoveFromCart)

			auth.POST("/orders", controllers.CreateOrder)
			auth.GET("/orders", controllers.GetOrderList)
			auth.GET("/orders/:id", controllers.GetOrderDetail)
			auth.POST("/orders/:id/pay", controllers.PayOrder)
			auth.POST("/orders/:id/cancel", controllers.CancelOrder)
			auth.POST("/orders/:id/refund", controllers.RefundOrder)

			auth.GET("/comments", controllers.GetCommentList)
			auth.GET("/comments/:id", controllers.GetCommentDetail)
			auth.POST("/comments", controllers.CreateComment)

			staff := auth.Group("")
			staff.Use(middleware.StaffAuth())
			{
				staff.POST("/categories", controllers.CreateCategory)
				staff.PUT("/categories/:id", controllers.UpdateCategory)
				staff.DELETE("/categories/:id", controllers.DeleteCategory)

				staff.POST("/products", controllers.CreateProduct)
				staff.PUT("/products/:id", controllers.UpdateProduct)
				staff.DELETE("/products/:id", controllers.DeleteProduct)
				staff.POST("/products/upload", controllers.UploadProductImage)

				staff.GET("/admin/orders", controllers.GetOrderList)
				staff.GET("/admin/orders/:id", controllers.GetOrderDetail)
				staff.DELETE("/admin/orders/:id", controllers.DeleteOrder)
				staff.POST("/admin/orders/:id/complete", controllers.CompleteOrder)
				staff.POST("/admin/orders/:id/cancel", controllers.CancelOrder)

				staff.GET("/admin/comments", controllers.GetCommentList)
				staff.PUT("/admin/comments/:id/reply", controllers.ReplyComment)
				staff.DELETE("/admin/comments/:id", controllers.DeleteComment)

				staff.POST("/news", controllers.CreateNews)
				staff.PUT("/news/:id", controllers.UpdateNews)
				staff.DELETE("/news/:id", controllers.DeleteNews)
				staff.POST("/news/upload", controllers.UploadNewsImage)

				staff.POST("/banners", controllers.CreateBanner)
				staff.PUT("/banners/:id", controllers.UpdateBanner)
				staff.DELETE("/banners/:id", controllers.DeleteBanner)

				admin := staff.Group("")
				admin.Use(middleware.AdminAuth())
				{
					admin.GET("/users", controllers.GetUserList)
					admin.POST("/users", controllers.CreateUser)
					admin.PUT("/users/:id", controllers.UpdateUser)
					admin.DELETE("/users/:id", controllers.DeleteUser)
					admin.PUT("/users/:id/password", controllers.AdminUpdatePassword)
					admin.POST("/users/:id/avatar", controllers.AdminUploadUserAvatar)
				}
			}
		}
	}

	return r
}
