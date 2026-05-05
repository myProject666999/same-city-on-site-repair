import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Carousel, Row, Col, Card, Button, Badge, Dropdown, Avatar, message } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, SettingOutlined, OrderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { bannerAPI, categoryAPI, productAPI } from '../services/api';

const { Header, Content } = Layout;

const Home = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchProducts();
    if (user) {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartCount(cartItems.length);
    }
  }, [user]);

  const fetchBanners = async () => {
    try {
      const response = await bannerAPI.getList();
      if (response.data.code === 200) {
        setBanners(response.data.data);
      }
    } catch (error) {
      console.error('获取轮播图失败:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getList();
      if (response.data.code === 200) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getList({ page_size: 12, status: 1 });
      if (response.data.code === 200) {
        setProducts(response.data.data.list);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const addToCart = (product) => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
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

  return (
    <Layout>
      <Header className="home-header">
        <div className="logo">同城上门维修</div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['home']}
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

      <Content style={{ padding: 0 }}>
        <div className="main-content" style={{ padding: 0, maxWidth: '100%', background: '#f5f5f5' }}>
          {banners.length > 0 && (
            <Carousel autoplay className="banner-carousel" style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 24 }}>
              {banners.map(banner => (
                <div key={banner.id}>
                  <img
                    src={banner.image || 'https://picsum.photos/1200/300'}
                    alt={banner.title}
                    style={{ width: '100%', height: 300, objectFit: 'cover' }}
                  />
                </div>
              ))}
            </Carousel>
          )}

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
            <div className="category-nav" style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>商品分类</h3>
              <Row gutter={[16, 16]}>
                {categories.map(category => (
                  <Col xs={12} sm={8} md={6} lg={4} key={category.id}>
                    <Button
                      type="text"
                      block
                      onClick={() => navigate(`/products?category=${category.id}`)}
                      style={{ textAlign: 'center', padding: '12px 0' }}
                    >
                      {category.name}
                    </Button>
                  </Col>
                ))}
              </Row>
            </div>

            <div style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>热门推荐</h3>
              <Row gutter={[16, 16]}>
                {products.map(product => (
                  <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
                    <Card
                      hoverable
                      cover={
                        <Link to={`/products/${product.id}`}>
                          <img
                            alt={product.name}
                            src={product.image || 'https://picsum.photos/400/300'}
                            style={{ height: 200, objectFit: 'cover' }}
                          />
                        </Link>
                      }
                      actions={[
                        <Button type="primary" size="small" onClick={() => addToCart(product)}>
                          加入购物车
                        </Button>,
                      ]}
                    >
                      <Link to={`/products/${product.id}`}>
                        <Card.Meta
                          title={product.name}
                          description={
                            <div>
                              <span className="price-text">¥{product.price}</span>
                              {product.originalPrice && (
                                <span className="original-price">¥{product.originalPrice}</span>
                              )}
                            </div>
                          }
                        />
                      </Link>
                    </Card>
                  </Col>
                ))}
              </Row>
              {products.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: 48 }}>暂无商品</div>
              )}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;
