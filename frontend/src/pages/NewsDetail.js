import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, message, Dropdown, Avatar, Menu, Badge, Divider, Image } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, ArrowLeftOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { newsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Header, Content } = Layout;

const NewsDetail = () => {
  const { id } = useParams();
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    setLoading(true);
    try {
      const response = await newsAPI.getDetail(id);
      if (response.data.code === 200) {
        setNews(response.data.data);
      } else {
        message.error('新闻不存在');
        navigate('/news');
      }
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      message.error('获取新闻详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
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

  if (!news) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>新闻不存在</div>
    );
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
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/news')}
            style={{ marginBottom: 16 }}
          >
            返回新闻列表
          </Button>

          <Card>
            <h1 style={{ marginBottom: 16, fontSize: 24 }}>{news.title}</h1>
            
            <Row justify="space-between" align="middle" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Col>
                <span style={{ color: '#999' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(news.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </span>
                {news.author && (
                  <span style={{ color: '#999', marginLeft: 16 }}>作者：{news.author}</span>
                )}
              </Col>
              <Col>
                <span style={{ color: '#999' }}>
                  <EyeOutlined style={{ marginRight: 4 }} />
                  {news.views || 0} 阅读
                </span>
              </Col>
            </Row>

            {news.image && (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Image
                  src={news.image}
                  alt={news.title}
                  style={{ maxWidth: '100%', maxHeight: 400 }}
                  fallback="https://picsum.photos/600/400"
                />
              </div>
            )}

            {news.summary && (
              <div style={{ marginBottom: 24, padding: 16, background: '#fafafa', borderRadius: 4 }}>
                <strong>摘要：</strong>{news.summary}
              </div>
            )}

            <Divider />

            <div 
              style={{ fontSize: 16, lineHeight: 2 }}
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            <Divider />

            <Row justify="end">
              <Button onClick={() => navigate('/news')}>
                返回列表
              </Button>
            </Row>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default NewsDetail;
