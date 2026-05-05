import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, message } from 'antd';
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  UserOutlined,
  OrderedListOutlined,
  AppstoreOutlined,
  MessageOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { orderAPI, productAPI, newsAPI, userAPI, commentAPI, categoryAPI } from '../../services/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalCategories: 0,
    totalNews: 0,
    totalComments: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, newsRes, categoriesRes, commentsRes] = await Promise.all([
        orderAPI.getList({ page_size: 1 }),
        productAPI.getList({ page_size: 1 }),
        newsAPI.getList({ page_size: 1, status: '' }),
        categoryAPI.getList(),
        commentAPI.getList({ page_size: 1 }),
      ]);

      setStats({
        totalOrders: ordersRes.data.code === 200 ? ordersRes.data.data.total : 0,
        totalProducts: productsRes.data.code === 200 ? productsRes.data.data.total : 0,
        totalUsers: 0,
        totalCategories: categoriesRes.data.code === 200 ? categoriesRes.data.data.length : 0,
        totalNews: newsRes.data.code === 200 ? newsRes.data.data.total : 0,
        totalComments: commentsRes.data.code === 200 ? commentsRes.data.data.total : 0,
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="admin-page-title">仪表盘</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="订单总数"
              value={stats.totalOrders}
              prefix={<OrderedListOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="商品总数"
              value={stats.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="商品分类"
              value={stats.totalCategories}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="新闻总数"
              value={stats.totalNews}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="留言总数"
              value={stats.totalComments}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Card title="系统说明">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>管理员可以管理所有模块，包括用户管理、商品管理、订单管理等</li>
            <li>员工可以管理商品、订单、新闻、留言等模块</li>
            <li>普通用户可以浏览商品、下单、查看订单、发布留言等</li>
            <li>订单状态说明：待支付(0)、已支付(1)、服务中(2)、已完成(3)、已取消(4)、退货中(5)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
