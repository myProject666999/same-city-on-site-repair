import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, InputNumber, Image, Descriptions, Badge, Dropdown, Avatar, Menu, message, Divider } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';

const { Header, Content } = Layout;

const ProductDetail = () => {
  const { id } = useParams();
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchProduct();
    if (user) {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartCount(cartItems.length);
    }
  }, [id, user]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getDetail(id);
      if (response.data.code === 200) {
        setProduct(response.data.data);
      } else {
        message.error('商品不存在');
        navigate('/products');
      }
    } catch (error) {
      console.error('获取商品详情失败:', error);
      message.error('获取商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const addToCart = () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    if (!product) return;
    
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
      });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    setCartCount(cartItems.length);
    message.success('已添加到购物车');
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

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>商品不存在</div>
    );
  }

  return (
    <Layout>
      <Header className="home-header">
        <div className="logo">同城上门维修</div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['products']}
          items={headerMenuItems}
          style={{ minWidth: 0, flex: 1, background: 'transparent' }}
        />
        <div className="user-actions">
          <Link to="/cart">
            <Badge count={cartCount} showZero>
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
          <Row gutter={32}>
            <Col xs={24} md={12}>
              <Card>
                <Image
                  width="100%"
                  src={product.image || 'https://picsum.photos/400/400'}
                  fallback="https://picsum.photos/400/400"
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card>
                <h1 style={{ marginBottom: 16 }}>{product.name}</h1>
                <Divider />
                
                <div style={{ marginBottom: 24 }}>
                  <span className="price-text" style={{ fontSize: 32 }}>¥{product.price}</span>
                  {product.originalPrice && (
                    <span className="original-price" style={{ fontSize: 18 }}>¥{product.originalPrice}</span>
                  )}
                </div>

                <Descriptions column={1} size="small" style={{ marginBottom: 24 }}>
                  <Descriptions.Item label="商品分类">
                    {product.category?.name || '未分类'}
                  </Descriptions.Item>
                  <Descriptions.Item label="库存">
                    {product.stock || 999} 件
                  </Descriptions.Item>
                  <Descriptions.Item label="销量">
                    {product.sales || 0} 件
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 16 }}>购买数量：</span>
                  <InputNumber
                    min={1}
                    max={product.stock || 999}
                    value={quantity}
                    onChange={setQuantity}
                    size="large"
                  />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    onClick={addToCart}
                    style={{ minWidth: 150 }}
                  >
                    加入购物车
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    onClick={() => {
                      addToCart();
                      navigate('/cart');
                    }}
                    style={{ minWidth: 150, background: '#fa8c16', borderColor: '#fa8c16' }}
                  >
                    立即购买
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Card title="商品详情" style={{ marginTop: 24 }}>
            {product.description ? (
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            ) : product.detail ? (
              <div dangerouslySetInnerHTML={{ __html: product.detail }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
                暂无商品详情
              </div>
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default ProductDetail;
