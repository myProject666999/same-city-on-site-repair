import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, Tag, message, Dropdown, Avatar, Menu, Badge, Divider, Descriptions, Modal } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, ArrowLeftOutlined, PayCircleOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import dayjs from 'dayjs';

const { Header, Content } = Layout;

const OrderStatus = {
  0: { text: '待支付', color: 'orange', icon: <PayCircleOutlined /> },
  1: { text: '已支付', color: 'blue', icon: <PayCircleOutlined /> },
  2: { text: '服务中', color: 'cyan', icon: <OrderedListOutlined /> },
  3: { text: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  4: { text: '已取消', color: 'default', icon: <StopOutlined /> },
  5: { text: '退货中', color: 'purple', icon: <StopOutlined /> },
};

const OrderDetail = () => {
  const { id } = useParams();
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getDetail(id);
      if (response.data.code === 200) {
        setOrder(response.data.data);
      } else {
        message.error('订单不存在');
        navigate('/orders');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const payOrder = async () => {
    try {
      const response = await orderAPI.pay(order.id);
      if (response.data.code === 200) {
        message.success('支付成功');
        fetchOrderDetail();
      } else {
        message.error(response.data.msg || '支付失败');
      }
    } catch (error) {
      message.error('支付失败，请稍后重试');
    }
  };

  const cancelOrder = () => {
    Modal.confirm({
      title: '确认取消订单？',
      content: '取消后订单将无法恢复，确定要取消吗？',
      okText: '确认取消',
      okType: 'danger',
      cancelText: '再想想',
      onOk: async () => {
        try {
          const response = await orderAPI.cancel(order.id, {});
          if (response.data.code === 200) {
            message.success('订单已取消');
            fetchOrderDetail();
          } else {
            message.error(response.data.msg || '取消失败');
          }
        } catch (error) {
          message.error('取消失败，请稍后重试');
        }
      },
    });
  };

  const refundOrder = () => {
    Modal.prompt({
      title: '申请退货',
      content: '请输入退货原因',
      okText: '提交申请',
      cancelText: '取消',
      rules: [{ required: true, message: '请输入退货原因' }],
      onOk: async (reason) => {
        try {
          const response = await orderAPI.refund(order.id, { reason });
          if (response.data.code === 200) {
            message.success('退货申请已提交');
            fetchOrderDetail();
          } else {
            message.error(response.data.msg || '申请失败');
          }
        } catch (error) {
          message.error('申请失败，请稍后重试');
        }
      },
    });
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人中心</Link>,
    },
    {
      key: 'orders',
      icon: <OrderedListOutlined />,
      label: <Link to="/orders">我的订单</Link>,
    },
    {
      key: 'comments',
      icon: <AppstoreOutlined />,
      label: <Link to="/comments">我的留言</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const headerMenuItems = [
    { key: 'home', label: <Link to="/">首页</Link> },
    { key: 'products', label: <Link to="/products">商品列表</Link> },
    { key: 'news', label: <Link to="/news">新闻资讯</Link> },
  ];

  if (isStaff()) {
    headerMenuItems.push({
      key: 'admin',
      label: <Link to="/admin/dashboard">管理后台</Link>,
    });
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>订单不存在</div>
    );
  }

  const status = OrderStatus[order.status] || OrderStatus[0];

  return (
    <Layout>
      <Header className="home-header">
        <div className="logo">同城上门维修</div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[]}
          items={headerMenuItems}
          style={{ minWidth: 0, flex: 1, background: 'transparent' }}
        />
        <div className="user-actions">
          <Link to="/cart">
            <Badge count={0} showZero>
              <ShoppingCartOutlined style={{ fontSize: 20 }} />
            </Badge>
          </Link>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar size={32} src={user.avatar} icon={<UserOutlined />} />
                <span style={{ marginLeft: 8 }}>{user.username}</span>
              </div>
            </Dropdown>
          ) : (
            <>
              <Link to="/login">登录</Link>
              <Link to="/register">注册</Link>
            </>
          )}
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        <div className="main-content">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/orders')}
            style={{ marginBottom: 16 }}
          >
            返回订单列表
          </Button>

          <Card>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <h2 style={{ margin: 0 }}>订单详情</h2>
              </Col>
              <Col>
                <Tag color={status.color} style={{ fontSize: 16, padding: '4px 16px' }}>
                  {status.icon} {status.text}
                </Tag>
              </Col>
            </Row>

            <Divider />

            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">{order.user_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{order.phone}</Descriptions.Item>
              <Descriptions.Item label="上门地址" span={2}>
                {order.address}
              </Descriptions.Item>
              {order.service_time && (
                <Descriptions.Item label="服务时间" span={2}>
                  {order.service_time}
                </Descriptions.Item>
              )}
              {order.pay_method && (
                <Descriptions.Item label="支付方式">
                  {order.pay_method}
                </Descriptions.Item>
              )}
              {order.pay_time && (
                <Descriptions.Item label="支付时间">
                  {dayjs(order.pay_time).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {order.complete_time && (
                <Descriptions.Item label="完成时间">
                  {dayjs(order.complete_time).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              )}
              {order.remark && (
                <Descriptions.Item label="备注" span={2}>
                  {order.remark}
                </Descriptions.Item>
              )}
              {order.cancel_reason && (
                <Descriptions.Item label="取消/退货原因" span={2}>
                  {order.cancel_reason}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <h3 style={{ marginBottom: 16 }}>商品信息</h3>
            <Card style={{ marginBottom: 16 }}>
              {order.items?.map((item, index) => (
                <div key={index}>
                  <Row align="middle" style={{ padding: '12px 0' }}>
                    <Col span={3}>
                      <img
                        src={item.product_image || 'https://picsum.photos/80/80'}
                        alt={item.product_name}
                        style={{ width: 80, height: 80, objectFit: 'cover' }}
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.product_name}</div>
                    </Col>
                    <Col span={3} style={{ textAlign: 'center' }}>
                      ¥{item.price.toFixed(2)}
                    </Col>
                    <Col span={3} style={{ textAlign: 'center' }}>
                      x{item.quantity}
                    </Col>
                    <Col span={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      ¥{item.subtotal.toFixed(2)}
                    </Col>
                  </Row>
                  {index < order.items.length - 1 && <Divider />}
                </div>
              ))}
            </Card>

            <Divider />

            <Row justify="end" align="middle">
              <Col>
                <span style={{ fontSize: 16 }}>
                  共 {order.items?.length || 0} 件商品，订单金额：
                  <span className="price-text" style={{ fontSize: 24, marginLeft: 8 }}>
                    ¥{order.total_price.toFixed(2)}
                  </span>
                </span>
              </Col>
            </Row>

            <Divider />

            <Row justify="end" gutter={8}>
              {order.status === 0 && (
                <>
                  <Col>
                    <Button onClick={cancelOrder}>
                      取消订单
                    </Button>
                  </Col>
                  <Col>
                    <Button type="primary" onClick={payOrder}>
                      去支付
                    </Button>
                  </Col>
                </>
              )}
              {(order.status === 1 || order.status === 2) && (
                <Col>
                  <Button onClick={refundOrder}>
                    申请退货
                  </Button>
                </Col>
              )}
            </Row>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default OrderDetail;
