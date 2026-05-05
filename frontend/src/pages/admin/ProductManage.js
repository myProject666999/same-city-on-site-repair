import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload, message, Space, Popconfirm, Image, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { productAPI, categoryAPI } from '../../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Option } = Select;
const { TextArea } = Input;

const ProductManage = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState(undefined);
  const [searchStatus, setSearchStatus] = useState(undefined);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchKeyword, searchCategory, searchStatus]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getList();
      if (response.data.code === 200) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      if (searchCategory) {
        params.category_id = searchCategory;
      }
      if (searchStatus !== undefined) {
        params.status = searchStatus;
      }
      const response = await productAPI.getList(params);
      if (response.data.code === 200) {
        setProducts(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      ...record,
      detail: record.detail || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await productAPI.delete(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        fetchProducts();
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
      const response = await productAPI.uploadImage(formData);
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
        const response = await productAPI.update(editingItem.id, values);
        if (response.data.code === 200) {
          message.success('更新成功');
          setModalVisible(false);
          fetchProducts();
        } else {
          message.error(response.data.msg || '更新失败');
        }
      } else {
        const response = await productAPI.create(values);
        if (response.data.code === 200) {
          message.success('创建成功');
          setModalVisible(false);
          fetchProducts();
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
      title: '商品图片',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (text) => (
        <Image
          width={60}
          height={60}
          src={text || 'https://picsum.photos/60/60'}
          fallback="https://picsum.photos/60/60"
        />
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 100,
      render: (_, record) => record.category?.name || '-',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (text) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{text}</span>,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span style={{ color: status === 1 ? '#52c41a' : '#999' }}>
          {status === 1 ? '上架' : '下架'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
            title="确定要删除该商品吗？"
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
        <h2 className="admin-page-title" style={{ margin: '0 0 16px 0' }}>商品管理</h2>
        
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="搜索商品名称"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="选择分类"
              value={searchCategory}
              onChange={setSearchCategory}
              style={{ width: 150 }}
              allowClear
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="商品状态"
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 120 }}
              allowClear
            >
              <Option value={1}>上架</Option>
              <Option value={0}>下架</Option>
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增商品
            </Button>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={products}
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
        title={editingItem ? '编辑商品' : '新增商品'}
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
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="商品名称"
                rules={[{ required: true, message: '请输入商品名称' }]}
              >
                <Input placeholder="请输入商品名称" maxLength={100} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="category_id"
                label="商品分类"
                rules={[{ required: true, message: '请选择商品分类' }]}
              >
                <Select placeholder="请选择商品分类">
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="price"
                label="售价"
                rules={[{ required: true, message: '请输入售价' }]}
              >
                <InputNumber
                  placeholder="请输入售价"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="original_price"
                label="原价"
              >
                <InputNumber
                  placeholder="请输入原价"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="stock"
                label="库存"
                initialValue={999}
              >
                <InputNumber
                  placeholder="请输入库存"
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="image"
                label="商品图片"
              >
                <Upload {...uploadProps} listType="picture">
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="商品状态"
                initialValue={1}
              >
                <Select>
                  <Option value={1}>上架</Option>
                  <Option value={0}>下架</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="商品描述"
          >
            <TextArea
              placeholder="请输入商品描述"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="detail"
            label="商品详情（富文本）"
          >
            <ReactQuill
              theme="snow"
              style={{ height: 200, marginBottom: 50 }}
              placeholder="请输入商品详情内容"
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

export default ProductManage;
