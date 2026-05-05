import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Upload, message, Space, Popconfirm, Image, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { bannerAPI } from '../../services/api';

const BannerManage = () => {
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerAPI.getList();
      if (response.data.code === 200) {
        setBanners(response.data.data);
      }
    } catch (error) {
      console.error('获取轮播图列表失败:', error);
      message.error('获取轮播图列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ sort: 0, status: 1 });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await bannerAPI.delete(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        fetchBanners();
      } else {
        message.error(response.data.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请稍后重试');
    }
  };

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await bannerAPI.uploadImage(formData);
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
      if (editingItem) {
        const response = await bannerAPI.update(editingItem.id, values);
        if (response.data.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchBanners();
        } else {
          message.error(response.data.msg || '更新失败');
        }
      } else {
        const response = await bannerAPI.create(values);
        if (response.data.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchBanners();
        } else {
          message.error(response.data.msg || '创建失败');
        }
      }
    } catch (error) {
      message.error('操作失败，请稍后重试');
    }
  };

  const uploadProps = {
    customRequest: handleUpload,
    accept: 'image/*',
    maxCount: 1,
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 200,
      render: (text) => (
        <Image
          width={180}
          height={80}
          src={text || 'https://picsum.photos/180/80'}
          fallback="https://picsum.photos/180/80"
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '跳转链接',
      dataIndex: 'link',
      key: 'link',
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span style={{ color: status === 1 ? '#52c41a' : '#999' }}>
          {status === 1 ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => window.open(record.image || record.link, '_blank')}
          >
            预览
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该轮播图吗？"
            description="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="admin-page-title" style={{ margin: 0 }}>轮播图管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增轮播图
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={false}
      />

      <Modal
        title={editingItem ? '编辑轮播图' : '新增轮播图'}
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
          <Form.Item
            name="title"
            label="轮播图标题"
          >
            <Input placeholder="请输入轮播图标题（可选）" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="image"
            label="轮播图图片"
            rules={[{ required: true, message: '请上传轮播图图片' }]}
            extra="建议图片尺寸: 1200 x 400 像素"
          >
            <Upload {...uploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="link"
            label="跳转链接"
          >
            <Input placeholder="请输入跳转链接（可选，如：/products/1）" />
          </Form.Item>

          <Form.Item
            name="sort"
            label="排序"
            initialValue={0}
          >
            <InputNumber
              min={0}
              max={999}
              placeholder="排序值越小越靠前"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue={1}
          >
            <Input.Group compact>
              <Form.Item noStyle name="status">
                <Select style={{ width: '100%' }}>
                  <Select.Option value={1}>启用</Select.Option>
                  <Select.Option value={0}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Input.Group>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingItem ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BannerManage;
