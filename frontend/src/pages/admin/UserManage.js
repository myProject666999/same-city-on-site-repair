import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload, message, Space, Popconfirm, Image, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { userAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const UserManage = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchRole, setSearchRole] = useState(undefined);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchKeyword, searchRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      if (searchRole) {
        params.role = searchRole;
      }
      const response = await userAPI.getList(params);
      if (response.data.code === 200) {
        setUsers(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role) => {
    const roleMap = {
      user: { color: 'blue', text: '普通用户' },
      staff: { color: 'orange', text: '员工' },
      admin: { color: 'red', text: '管理员' },
    };
    const info = roleMap[role] || { color: 'default', text: '未知' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      phone: record.phone,
      real_name: record.real_name,
      role: record.role,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await userAPI.delete(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        fetchUsers();
      } else {
        message.error(response.data.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请稍后重试');
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const response = await userAPI.resetPassword(id, { password: '123456' });
      if (response.data.code === 200) {
        message.success('密码已重置为: 123456');
      } else {
        message.error(response.data.msg || '重置失败');
      }
    } catch (error) {
      message.error('重置失败，请稍后重试');
    }
  };

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await userAPI.uploadAvatar(formData);
      if (response.data.code === 200) {
        onSuccess(response.data.data.url);
        message.success('上传成功');
      } else {
        onError(new Error(response.data.msg || '上传失败'));
      }
    } catch (error) {
      onError(error);
      message.error('上传失败');
    }
  };

  const onFinish = async (values) => {
    try {
      const response = await userAPI.update(editingItem.id, values);
      if (response.data.code === 200) {
        message.success('更新成功');
        setModalVisible(false);
        fetchUsers();
      } else {
        message.error(response.data.msg || '更新失败');
      }
    } catch (error) {
      message.error('操作失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (text, record) => (
        <Image
          width={40}
          height={40}
          src={text || 'https://picsum.photos/40/40'}
          fallback="https://picsum.photos/40/40"
          style={{ borderRadius: '50%' }}
        />
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (text) => text || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => getRoleTag(role),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要重置密码吗？"
            description="密码将被重置为: 123456"
            onConfirm={() => handleResetPassword(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<ReloadOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
          {record.role !== 'admin' && (
            <Popconfirm
              title="确定要删除该用户吗？"
              description="删除后无法恢复，请谨慎操作"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 className="admin-page-title" style={{ margin: '0 0 16px 0' }}>用户管理</h2>
        
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="搜索用户名/邮箱/电话"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              placeholder="用户角色"
              value={searchRole}
              onChange={setSearchRole}
              style={{ width: 130 }}
              allowClear
            >
              <Option value="user">普通用户</Option>
              <Option value="staff">员工</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page) => setCurrentPage(page),
        }}
      />

      <Modal
        title="编辑用户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="用户名"
              >
                <Input disabled placeholder="用户名不可修改" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="用户角色"
              >
                <Select>
                  <Option value="user">普通用户</Option>
                  <Option value="staff">员工</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="邮箱"
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="电话"
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

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;
