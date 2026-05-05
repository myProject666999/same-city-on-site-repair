import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, Select, Input, Pagination, Badge, Dropdown, Avatar, Menu, message } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { categoryAPI, productAPI } from '../services/api';

const { Header, Content } = Layout;
const { Search } = Input;
const { Option } = Select;

const ProductList = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || undefined);
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchCategories();
    if (user) {
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartCount(cartItems.length);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, keyword]);

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
      const params = {
        page: currentPage,
        page_size: pageSize,
        status: 1,
      };
      if (selectedCategory) {
        params.category_id = selectedCategory;
      }
      if (keyword) {
        params.keyword = keyword;
      }
      const response = await productAPI.getList(params);
      if (response.data.code === 200) {
        setProducts(response.data.data.list);
        setTotal(response.data.data.total);
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

  const handleSearch = (value) => {
    setKeyword(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
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
          <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              placeholder="选择分类"
              style={{ width: 200 }}
              allowClear
              value={selectedCategory || undefined}
              onChange={handleCategoryChange}
            >
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
            <Search
              placeholder="搜索商品"
              allowClear
              enterButton="搜索"
              size="middle"
              onSearch={handleSearch}
              style={{ width: 300 }}
            />
          </div>

          <Row gutter={[16, 16]}>
            {products.map(product => (
              <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
                <Card
                  hoverable
                  loading={loading}
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

          {total > 0 && (
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
        </div>
      </Content>
    </Layout>
  );
};

export default ProductList;
