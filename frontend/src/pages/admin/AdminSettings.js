import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, message, Avatar, Tabs, Divider, Row, Col } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

const { TabPane } = Tabs;

const AdminSettings = () => {
  const { user, login } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar);

  const handleProfileSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(values);
      if (response.data.code === 200) {
        message.success('个人信息更新成功');
        const userInfo = response.data.data;
        login(userInfo);
      } else {
        message.error(response.data.msg || '更新失败');
      }
    } catch (error) {
      message.error('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await userAPI.updatePassword(values);
      if (response.data.code === 200) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error(response.data.msg || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await userAPI.uploadAvatar(formData);
      if (response.data.code === 200) {
        const url = response.data.data.url;
        setAvatarUrl(url);
        onSuccess(url);
        message.success('头像上传成功');
        const userResponse = await userAPI.getProfile();
        if (userResponse.data.code === 200) {
          login(userResponse.data.data);
        }
      } else {
        onError(new Error(response.data.msg || '上传失败'));
      }
    } catch (error) {
      onError(error);
      message.error('上传失败');
    }
  };

  const uploadProps = {
    customRequest: handleAvatarUpload,
    accept: 'image/*',
    maxCount: 1,
    showUploadList: false,
  };

  return (
    <div>
      <h2 className="admin-page-title" style={{ margin: '0 0 24px 0' }}>个人设置</h2>

      <Card>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Avatar
              size={120}
              src={avatarUrl}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <div>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>更换头像</Button>
              </Upload>
            </div>
            <p style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
              建议头像尺寸：200 x 200 像素
            </p>
          </Col>

          <Col xs={24} md={16}>
            <Tabs defaultActiveKey="profile">
              <TabPane tab="基本信息" key="profile">
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{
                    username: user?.username,
                    email: user?.email,
                    phone: user?.phone,
                    real_name: user?.real_name,
                  }}
                  onFinish={handleProfileSubmit}
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                  >
                    <Input disabled placeholder="用户名不可修改" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                          { type: 'email', message: '请输入正确的邮箱地址' },
                        ]}
                      >
                        <Input placeholder="请输入邮箱" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="phone"
                        label="电话"
                        rules={[
                          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                        ]}
                      >
                        <Input placeholder="请输入电话" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="real_name"
                    label="真实姓名"
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="修改密码" key="password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordSubmit}
                >
                  <Form.Item
                    name="old_password"
                    label="原密码"
                    rules={[{ required: true, message: '请输入原密码' }]}
                    extra="请输入当前登录密码"
                  >
                    <Input.Password
                      placeholder="请输入原密码"
                      prefix={<LockOutlined />}
                    />
                  </Form.Item>

                  <Divider />

                  <Form.Item
                    name="new_password"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码长度不能少于6位' },
                    ]}
                    extra="密码长度不能少于6位"
                  >
                    <Input.Password
                      placeholder="请输入新密码"
                      prefix={<LockOutlined />}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirm_password"
                    label="确认新密码"
                    dependencies={['new_password']}
                    rules={[
                      { required: true, message: '请再次输入新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('new_password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      placeholder="请再次输入新密码"
                      prefix={<LockOutlined />}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AdminSettings;
