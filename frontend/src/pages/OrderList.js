import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, Tabs, Tag, Empty, message, Dropdown, Avatar, Menu, Badge, List, Divider, Modal, Pagination } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, EyeOutlined, PayCircleOutlined, StopOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
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

const OrderList = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, currentPage]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const response = await orderAPI.getList(params);
      if (response.data.code === 200) {
        setOrders(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const viewDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const payOrder = async (orderId) => {
    try {
      const response = await orderAPI.pay(orderId);
      if (response.data.code === 200) {
        message.success('支付成功');
        fetchOrders();
      } else {
        message.error(response.data.msg || '支付失败');
      }
    } catch (error) {
      message.error('支付失败，请稍后重试');
    }
  };

  const cancelOrder = async (orderId) => {
    Modal.confirm({
      title: '确认取消订单？',
      content: '取消后订单将无法恢复，确定要取消吗？',
      okText: '确认取消',
      okType: 'danger',
      cancelText: '再想想',
      onOk: async () => {
        try {
          const response = await orderAPI.cancel(orderId, {});
          if (response.data.code === 200) {
            message.success('订单已取消');
            fetchOrders();
          } else {
            message.error(response.data.msg || '取消失败');
          }
        } catch (error) {
          message.error('取消失败，请稍后重试');
        }
      },
    });
  };

  const refundOrder = async (orderId) => {
    Modal.prompt({
      title: '申请退货',
      content: '请输入退货原因',
      okText: '提交申请',
      cancelText: '取消',
      rules: [{ required: true, message: '请输入退货原因' }],
      onOk: async (reason) => {
        try {
          const response = await orderAPI.refund(orderId, { reason });
          if (response.data.code === 200) {
            message.success('退货申请已提交');
            fetchOrders();
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

  const tabItems = [
    { key: 'all', label: '全部订单' },
    { key: '0', label: '待支付' },
    { key: '1', label: '已支付' },
    { key: '3', label: '已完成' },
    { key: '5', label: '退货中' },
  ];

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
          <h2 style={{ marginBottom: 24 }}>我的订单</h2>
          
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
          ) : orders.length === 0 ? (
            <Empty
              description="暂无订单"
              style={{ padding: '100px 0' }}
            >
              <Button type="primary" onClick={() => navigate('/products')}>
                去逛逛
              </Button>
            </Empty>
          ) : (
            <>
              <List
                dataSource={orders}
                renderItem={(order) => {
                  const status = OrderStatus[order.status] || OrderStatus[0];
                  return (
                    <Card key={order.id} style={{ marginBottom: 16 }}>
                      <Row justify="space-between" align="middle" style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                        <Col>
                          <span>订单号：{order.order_no}</span>
                          <span style={{ marginLeft: 24 }}>
                            {dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        </Col>
                        <Col>
                          <Tag color={status.color}>
                            {status.icon} {status.text}
                          </Tag>
                        </Col>
                      </Row>

                      {order.items?.map((item, index) => (
                        <Row key={index} align="middle" style={{ marginBottom: 12 }}>
                          <Col span={2}>
                            <img
                              src={item.product_image || 'https://picsum.photos/60/60'}
                              alt={item.product_name}
                              style={{ width: 60, height: 60, objectFit: 'cover' }}
                            />
                          </Col>
                          <Col span={14}>
                            <div>{item.product_name}</div>
                          </Col>
                          <Col span={3} style={{ textAlign: 'center' }}>
                            x{item.quantity}
                          </Col>
                          <Col span={5} style={{ textAlign: 'right' }}>
                            ¥{item.subtotal.toFixed(2)}
                          </Col>
                        </Row>
                      ))}

                      <Divider />

                      <Row justify="space-between" align="middle">
                        <Col>
                          <span>联系人：{order.user_name}</span>
                          <span style={{ marginLeft: 16 }}>电话：{order.phone}</span>
                          {order.service_time && (
                            <span style={{ marginLeft: 16 }}>服务时间：{order.service_time}</span>
                          )}
                        </Col>
                        <Col>
                          <span style={{ marginRight: 24 }}>
                            共 {order.items?.length || 0} 件商品
                          </span>
                          <span>
                            订单金额：<span className="price-text">¥{order.total_price.toFixed(2)}</span>
                          </span>
                        </Col>
                      </Row>

                      <Row justify="end" style={{ marginTop: 16 }} gutter={8}>
                        <Col>
                          <Button icon={<EyeOutlined />} onClick={() => viewDetail(order)}>
                            查看详情
                          </Button>
                        </Col>
                        {order.status === 0 && (
                          <>
                            <Col>
                              <Button onClick={() => cancelOrder(order.id)}>
                                取消订单
                              </Button>
                            </Col>
                            <Col>
                              <Button type="primary" onClick={() => payOrder(order.id)}>
                                去支付
                              </Button>
                            </Col>
                          </>
                        )}
                        {(order.status === 1 || order.status === 2) && (
                          <Col>
                            <Button onClick={() => refundOrder(order.id)}>
                              申请退货
                            </Button>
                          </Col>
                        )}
                      </Row>
                    </Card>
                  );
                }}
              />

              {total > pageSize && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Content>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div>
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col>
                <span>订单号：{selectedOrder.order_no}</span>
              </Col>
              <Col>
                <Tag color={OrderStatus[selectedOrder.status]?.color}>
                  {OrderStatus[selectedOrder.status]?.icon} {OrderStatus[selectedOrder.status]?.text}
                </Tag>
              </Col>
            </Row>

            <Divider />

            <h4 style={{ marginBottom: 16 }}>商品信息</h4>
            {selectedOrder.items?.map((item, index) => (
              <Row key={index} align="middle" style={{ marginBottom: 12, padding: 12, background: '#fafafa' }}>
                <Col span={3}>
                  <img
                    src={item.product_image || 'https://picsum.photos/60/60'}
                    alt={item.product_name}
                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                  />
                </Col>
                <Col span={12}>
                  <div>{item.product_name}</div>
                </Col>
                <Col span={3} style={{ textAlign: 'center' }}>
                  ¥{item.price.toFixed(2)}
                </Col>
                <Col span={3} style={{ textAlign: 'center' }}>
                  x{item.quantity}
                </Col>
                <Col span={3} style={{ textAlign: 'right' }}>
                  ¥{item.subtotal.toFixed(2)}
                </Col>
              </Row>
            ))}

            <Divider />

            <h4 style={{ marginBottom: 16 }}>配送信息</h4>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>联系人：</strong>{selectedOrder.user_name}</p>
                <p><strong>联系电话：</strong>{selectedOrder.phone}</p>
                <p><strong>上门地址：</strong>{selectedOrder.address}</p>
                {selectedOrder.service_time && (
                  <p><strong>服务时间：</strong>{selectedOrder.service_time}</p>
                )}
              </Col>
              <Col span={12}>
                <p><strong>订单金额：</strong><span className="price-text">¥{selectedOrder.total_price.toFixed(2)}</span></p>
                <p><strong>下单时间：</strong>{dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                {selectedOrder.pay_time && (
                  <p><strong>支付时间：</strong>{dayjs(selectedOrder.pay_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                )}
                {selectedOrder.complete_time && (
                  <p><strong>完成时间：</strong>{dayjs(selectedOrder.complete_time).format('YYYY-MM-DD HH:mm:ss')}</p>
                )}
              </Col>
            </Row>

            {selectedOrder.remark && (
              <>
                <Divider />
                <p><strong>备注：</strong>{selectedOrder.remark}</p>
              </>
            )}

            {selectedOrder.cancel_reason && (
              <>
                <Divider />
                <p><strong>取消/退货原因：</strong>{selectedOrder.cancel_reason}</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default OrderList;
