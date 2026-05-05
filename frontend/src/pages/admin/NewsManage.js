import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Upload, message, Space, Popconfirm, Image, Row, Col, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { newsAPI } from '../../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const NewsManage = () => {
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState(undefined);

  useEffect(() => {
    fetchNews();
  }, [currentPage, searchKeyword, searchStatus]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        status: searchStatus,
      };
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      const response = await newsAPI.getList(params);
      if (response.data.code === 200) {
        setNews(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, is_top: false });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      content: record.content || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await newsAPI.delete(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        fetchNews();
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
      const response = await newsAPI.uploadImage(formData);
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
        const response = await newsAPI.update(editingItem.id, values);
        if (response.data.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchNews();
        } else {
          message.error(response.data.msg || '更新失败');
        }
      } else {
        const response = await newsAPI.create(values);
        if (response.data.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchNews();
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

  const getStatusTag = (status) => {
    return status === 1 ? (
      <Tag color="green">已发布</Tag>
    ) : (
      <Tag color="orange">草稿</Tag>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '封面图',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (text) => (
        <Image
          width={60}
          height={40}
          src={text || 'https://picsum.photos/60/40'}
          fallback="https://picsum.photos/60/40"
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: '新闻标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <span>{text}</span>
          {record.is_top && <Tag color="red">置顶</Tag>}
        </Space>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => getStatusTag(status),
    },
    {
      title: '阅读量',
      dataIndex: 'views',
      key: 'views',
      width: 80,
      render: (views) => views || 0,
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
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
            onClick={() => window.open(`/news/${record.id}`, '_blank')}
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
            title="确定要删除该新闻吗？"
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
      <div style={{ marginBottom: 16 }}>
        <h2 className="admin-page-title" style={{ margin: '0 0 16px 0' }}>新闻管理</h2>
        
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="搜索新闻标题"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              placeholder="新闻状态"
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 130 }}
              allowClear
            >
              <Option value={1}>已发布</Option>
              <Option value={0}>草稿</Option>
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增新闻
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={news}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1300 }}
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
        title={editingItem ? '编辑新闻' : '新增新闻'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="title"
                label="新闻标题"
                rules={[{ required: true, message: '请输入新闻标题' }]}
              >
                <Input placeholder="请输入新闻标题" maxLength={200} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="author"
                label="作者"
              >
                <Input placeholder="请输入作者" maxLength={50} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="image"
                label="封面图"
              >
                <Upload {...uploadProps} listType="picture">
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="status"
                label="状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="发布" unCheckedChildren="草稿" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="is_top"
                label="是否置顶"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="新闻摘要"
          >
            <TextArea
              placeholder="请输入新闻摘要"
              rows={2}
              maxLength={300}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="新闻内容（富文本）"
            rules={[{ required: true, message: '请输入新闻内容' }]}
          >
            <ReactQuill
              theme="snow"
              style={{ height: 300, marginBottom: 50 }}
              placeholder="请输入新闻内容"
            />
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

export default NewsManage;
