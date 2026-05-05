import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, Form, Input, Avatar, Upload, message, Tabs, Dropdown, Menu, Badge, Modal, Divider } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, UploadOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const { Header, Content } = Layout;
const { TextArea } = Input;

const Profile = () => {
  const { user, logout, updateUser, isStaff } = useAuth();
  const navigate = useNavigate();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        real_name: user.real_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, profileForm]);

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const onProfileFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(values);
      if (response.data.code === 200) {
        message.success('个人信息更新成功');
        const profileResponse = await authAPI.getProfile();
        if (profileResponse.data.code === 200) {
          updateUser(profileResponse.data.data);
        }
      } else {
        message.error(response.data.msg || '更新失败');
      }
    } catch (error) {
      message.error('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordFinish = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authAPI.updatePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      if (response.data.code === 200) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error(response.data.msg || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isImage) {
      message.error('只能上传 jpg、png、gif 格式的图片');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB');
      return false;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await authAPI.uploadAvatar(formData);
      if (response.data.code === 200) {
        message.success('头像上传成功');
        const newAvatar = response.data.data.avatar;
        updateUser({ ...user, avatar: newAvatar });
      } else {
        message.error(response.data.msg || '上传失败');
      }
    } catch (error) {
      message.error('上传失败，请稍后重试');
    }

    return false;
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
    { key: 'profile', label: '个人信息', icon: <EditOutlined /> },
    { key: 'password', label: '修改密码', icon: <LockOutlined /> },
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
          <h2 style={{ marginBottom: 24 }}>个人中心</h2>

          <Row gutter={24}>
            <Col xs={24} md={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Upload
                    beforeUpload={handleAvatarUpload}
                    showUploadList={false}
                  >
                    <Avatar
                      size={120}
                      src={user?.avatar}
                      icon={<UserOutlined />}
                      style={{ cursor: 'pointer' }}
                    />
                  </Upload>
                  <p style={{ marginTop: 16, color: '#666' }}>
                    点击头像上传
                  </p>
                </div>
                <Divider />
                <div>
                  <p><strong>用户名：</strong>{user?.username}</p>
                  <p><strong>角色：</strong>
                    {user?.role === 'admin' ? '管理员' : user?.role === 'staff' ? '员工' : '普通用户'}
                  </p>
                  <p><strong>注册时间：</strong>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={18}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
              />

              {activeTab === 'profile' && (
                <Card>
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={onProfileFinish}
                  >
                    <Form.Item
                      name="username"
                      label="用户名"
                    >
                      <Input disabled />
                    </Form.Item>

                    <Form.Item
                      name="real_name"
                      label="真实姓名"
                    >
                      <Input placeholder="请输入真实姓名" />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[
                        { type: 'email', message: '请输入有效的邮箱地址' },
                      ]}
                    >
                      <Input placeholder="请输入邮箱地址" />
                    </Form.Item>

                    <Form.Item
                      name="phone"
                      label="手机号"
                      rules={[
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                      ]}
                    >
                      <Input placeholder="请输入手机号码" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        保存修改
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              )}

              {activeTab === 'password' && (
                <Card>
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={onPasswordFinish}
                  >
                    <Form.Item
                      name="old_password"
                      label="原密码"
                      rules={[
                        { required: true, message: '请输入原密码' },
                      ]}
                    >
                      <Input.Password placeholder="请输入原密码" />
                    </Form.Item>

                    <Form.Item
                      name="new_password"
                      label="新密码"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码至少6个字符' },
                      ]}
                    >
                      <Input.Password placeholder="请输入新密码（至少6个字符）" />
                    </Form.Item>

                    <Form.Item
                      name="confirm_password"
                      label="确认新密码"
                      rules={[
                        { required: true, message: '请确认新密码' },
                      ]}
                    >
                      <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={passwordLoading}>
                        修改密码
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              )}
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default Profile;
