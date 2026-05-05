import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Button, Form, Input, message, Dropdown, Avatar, Menu, Badge, Divider, List, Modal, Pagination, Tag } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, OrderedListOutlined, AppstoreOutlined, CommentOutlined, EditOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { commentAPI } from '../services/api';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { TextArea } = Input;

const Comments = () => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  useEffect(() => {
    fetchComments();
  }, [currentPage]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      const response = await commentAPI.getList(params);
      if (response.data.code === 200) {
        setComments(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取留言列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    message.success('退出成功');
    navigate('/');
  };

  const onCreateFinish = async (values) => {
    try {
      const response = await commentAPI.create(values);
      if (response.data.code === 200) {
        message.success('留言发布成功');
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchComments();
      } else {
        message.error(response.data.msg || '发布失败');
      }
    } catch (error) {
      message.error('发布失败，请稍后重试');
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

  const StatusTag = ({ status }) => {
    if (status === 1) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>已回复</Tag>;
    }
    return <Tag color="orange" icon={<ClockCircleOutlined />}>待回复</Tag>;
  };

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
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <h2 style={{ margin: 0 }}>我的留言</h2>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                发布留言
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 50 }}>加载中...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <CommentOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
              <p style={{ color: '#999', marginBottom: 16 }}>暂无留言</p>
              <Button type="primary" onClick={() => setCreateModalVisible(true)}>
                发布第一条留言
              </Button>
            </div>
          ) : (
            <>
              <List
                dataSource={comments}
                renderItem={(item) => (
                  <Card key={item.id} style={{ marginBottom: 16 }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                      <Col>
                        <h4 style={{ margin: 0 }}>{item.title}</h4>
                      </Col>
                      <Col>
                        <StatusTag status={item.status} />
                        <span style={{ color: '#999', marginLeft: 16 }}>
                          {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{item.content}</p>
                    </div>
                    {item.reply && (
                      <div className="reply-box">
                        <p style={{ marginBottom: 8, fontWeight: 'bold' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          管理员回复：
                        </p>
                        <div dangerouslySetInnerHTML={{ __html: item.reply }} />
                      </div>
                    )}
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

      <Modal
        title="发布留言"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={onCreateFinish}
        >
          <Form.Item
            name="title"
            label="留言标题"
            rules={[{ required: true, message: '请输入留言标题' }]}
          >
            <Input placeholder="请输入留言标题" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="content"
            label="留言内容"
            rules={[{ required: true, message: '请输入留言内容' }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入留言内容"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Row justify="end">
            <Button onClick={() => setCreateModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              发布
            </Button>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
};

export default Comments;
