import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Input, Button, Pagination, Empty, message, Dropdown, Avatar, Menu, Badge, List, Divider, Image } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, SearchOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { newsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Search } = Input;

const NewsList = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNews();
  }, [currentPage, keyword]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (keyword) {
        params.keyword = keyword;
      }
      const response = await newsAPI.getList(params);
      if (response.data.code === 200) {
        setNews(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取新闻列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const handleSearch = (value) => {
    setKeyword(value);
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
          defaultSelectedKeys={['news']}
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
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <h2 style={{ margin: 0 }}>新闻资讯</h2>
            </Col>
            <Col>
              <Search
                placeholder="搜索新闻"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
          ) : news.length === 0 ? (
            <Empty description="暂无新闻" style={{ padding: '100px 0' }} />
          ) : (
            <>
              <List
                dataSource={news}
                renderItem={(item) => (
                  <Card key={item.id} style={{ marginBottom: 16 }} hoverable>
                    <Row gutter={24} align="middle">
                      {item.image && (
                        <Col xs={24} md={6}>
                          <Link to={`/news/${item.id}`}>
                            <Image
                              src={item.image}
                              alt={item.title}
                              style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                              fallback="https://picsum.photos/200/120"
                            />
                          </Link>
                        </Col>
                      )}
                      <Col xs={24} md={item.image ? 18 : 24}>
                        <Link to={`/news/${item.id}`}>
                          <h3 style={{ marginBottom: 8, color: '#1890ff' }}>{item.title}</h3>
                        </Link>
                        <p style={{ color: '#666', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.summary || item.content?.replace(/<[^>]+>/g, '').substring(0, 200)}
                        </p>
                        <Row justify="space-between">
                          <Col>
                            <span style={{ color: '#999' }}>
                              <CalendarOutlined style={{ marginRight: 4 }} />
                              {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                            </span>
                            {item.author && (
                              <span style={{ color: '#999', marginLeft: 16 }}>作者：{item.author}</span>
                            )}
                          </Col>
                          <Col>
                            <span style={{ color: '#999' }}>
                              <EyeOutlined style={{ marginRight: 4 }} />
                              {item.views || 0} 阅读
                            </span>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card>
                )}
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
    </Layout>
  );
};

export default NewsList;
