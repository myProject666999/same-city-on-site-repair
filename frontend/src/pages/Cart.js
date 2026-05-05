import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, InputNumber, Checkbox, Empty, message, Modal, Form, Input, Dropdown, Avatar, Menu, Badge, List, Divider } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';

const { Header, Content } = Layout;
const { TextArea } = Input;

const Cart = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [checkoutForm] = Form.useForm();

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  const fetchCartItems = () => {
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(items);
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const updateQuantity = (id, quantity) => {
    const items = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: quantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const removeItem = (id) => {
    const items = cartItems.filter(item => item.id !== id);
    setCartItems(items);
    localStorage.setItem('cartItems', JSON.stringify(items));
    setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    message.success('已移除商品');
  };

  const toggleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(cartItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      message.warning('请选择要购买的商品');
      return;
    }
    setCheckoutModalVisible(true);
  };

  const onCheckoutFinish = async (values) => {
    setLoading(true);
    try {
      const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.id));
      
      const orderData = {
        items: itemsToCheckout.map(item => ({
          product_id: item.id,
          price: item.price,
          quantity: item.quantity,
        })),
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        receiver_address: values.receiver_address,
        remark: values.remark,
      };

      const response = await orderAPI.create(orderData);
      
      if (response.data.code === 200) {
        message.success('下单成功！');
        const remainingItems = cartItems.filter(item => !selectedItems.includes(item.id));
        setCartItems(remainingItems);
        localStorage.setItem('cartItems', JSON.stringify(remainingItems));
        setSelectedItems([]);
        setCheckoutModalVisible(false);
        navigate('/orders');
      } else {
        message.error(response.data.msg || '下单失败');
      }
    } catch (error) {
      console.error('下单失败:', error);
      message.error('下单失败，请稍后重试');
    } finally {
      setLoading(false);
    }
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
            <Badge count={cartItems.length} showZero>
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
          <h2 style={{ marginBottom: 24 }}>购物车</h2>
          
          {cartItems.length === 0 ? (
            <Empty
              description="购物车是空的"
              style={{ padding: '100px 0' }}
            >
              <Button type="primary" onClick={() => navigate('/products')}>
                去逛逛
              </Button>
            </Empty>
          ) : (
            <>
              <Card>
                <Row style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  <Col span={1}>
                    <Checkbox
                      checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                      indeterminate={selectedItems.length > 0 && selectedItems.length < cartItems.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </Col>
                  <Col span={8}>商品信息</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>单价</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>数量</Col>
                  <Col span={4} style={{ textAlign: 'center' }}>小计</Col>
                  <Col span={3} style={{ textAlign: 'center' }}>操作</Col>
                </Row>

                <List
                  dataSource={cartItems}
                  renderItem={(item) => (
                    <Row
                      key={item.id}
                      style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                      align="middle"
                    >
                      <Col span={1}>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                      </Col>
                      <Col span={8}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            src={item.image || 'https://picsum.photos/80/80'}
                            alt={item.name}
                            style={{ width: 80, height: 80, objectFit: 'cover', marginRight: 16 }}
                          />
                          <Link to={`/products/${item.id}`}>{item.name}</Link>
                        </div>
                      </Col>
                      <Col span={4} style={{ textAlign: 'center' }}>
                        <span className="price-text">¥{item.price}</span>
                      </Col>
                      <Col span={4} style={{ textAlign: 'center' }}>
                        <InputNumber
                          min={1}
                          max={99}
                          value={item.quantity}
                          onChange={(value) => updateQuantity(item.id, value)}
                        />
                      </Col>
                      <Col span={4} style={{ textAlign: 'center' }}>
                        <span className="price-text">¥{(item.price * item.quantity).toFixed(2)}</span>
                      </Col>
                      <Col span={3} style={{ textAlign: 'center' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(item.id)}
                        >
                          删除
                        </Button>
                      </Col>
                    </Row>
                  )}
                />
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Row align="middle" justify="end">
                  <Col>
                    已选择 <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedItems.length}</span> 件商品
                    <Divider type="vertical" />
                    合计：
                    <span className="price-text" style={{ fontSize: 24, marginLeft: 8 }}>
                      ¥{getSelectedTotal().toFixed(2)}
                    </span>
                  </Col>
                  <Col style={{ marginLeft: 24 }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleCheckout}
                      disabled={selectedItems.length === 0}
                      style={{ minWidth: 120 }}
                    >
                      去结算
                    </Button>
                  </Col>
                </Row>
              </Card>
            </>
          )}
        </div>
      </Content>

      <Modal
        title="确认订单"
        open={checkoutModalVisible}
        onCancel={() => setCheckoutModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={checkoutForm}
          layout="vertical"
          onFinish={onCheckoutFinish}
        >
          <Form.Item
            name="receiver_name"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            name="receiver_phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="receiver_address"
            label="上门地址"
            rules={[{ required: true, message: '请输入上门地址' }]}
          >
            <TextArea rows={3} placeholder="请输入详细的上门地址" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={2} placeholder="备注信息（选填）" />
          </Form.Item>

          <Divider />

          <Row align="middle" justify="end">
            <Col>
              合计：
              <span className="price-text" style={{ fontSize: 24, marginLeft: 8 }}>
                ¥{getSelectedTotal().toFixed(2)}
              </span>
            </Col>
          </Row>

          <Divider />

          <Row justify="end">
            <Button onClick={() => setCheckoutModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              确认下单
            </Button>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Cart;
