import React from 'react';
import { Layout, Menu, Dropdown, Avatar, message, Button } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  UserOutlined,
  MessageOutlined,
  FileTextOutlined,
  PictureOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to="/">返回前台</Link>,
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

  const getMenuItems = () => {
    const items = [
      {
        key: '/admin/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/admin/dashboard">仪表盘</Link>,
      },
      {
        key: '/admin/categories',
        icon: <AppstoreOutlined />,
        label: <Link to="/admin/categories">分类管理</Link>,
      },
      {
        key: '/admin/products',
        icon: <ShoppingOutlined />,
        label: <Link to="/admin/products">商品管理</Link>,
      },
      {
        key: '/admin/orders',
        icon: <OrderedListOutlined />,
        label: <Link to="/admin/orders">订单管理</Link>,
      },
      {
        key: '/admin/comments',
        icon: <MessageOutlined />,
        label: <Link to="/admin/comments">留言管理</Link>,
      },
      {
        key: '/admin/news',
        icon: <FileTextOutlined />,
        label: <Link to="/admin/news">新闻管理</Link>,
      },
      {
        key: '/admin/banners',
        icon: <PictureOutlined />,
        label: <Link to="/admin/banners">轮播图管理</Link>,
      },
    ];

    if (isAdmin()) {
      items.splice(4, 0, {
        key: '/admin/users',
        icon: <UserOutlined />,
        label: <Link to="/admin/users">用户管理</Link>,
      });
    }

    items.push({
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">个人设置</Link>,
    });

    return items;
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    return [path];
  };

  return (
    <Layout className="admin-layout">
      <Sider width={200} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={getMenuItems()}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>
            同城上门维修平台管理系统
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar size={32} src={user?.avatar} icon={<UserOutlined />} />
              <span style={{ marginLeft: 8, marginRight: 8 }}>
                {user?.username}
                <span style={{ marginLeft: 4, color: '#999', fontSize: 12 }}>
                  ({user?.role === 'admin' ? '管理员' : '员工'})
                </span>
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
