import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Tag, Descriptions, Popconfirm, message, Space, Row, Col, Select, Image, Input } from 'antd';
import { EyeOutlined, DeleteOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { orderAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const OrderManage = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [searchStatus, setSearchStatus] = useState(undefined);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchStatus, searchKeyword]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (searchStatus !== undefined) {
        params.status = searchStatus;
      }
      if (searchKeyword) {
        params.keyword = searchKeyword;
      }
      const response = await orderAPI.getList(params);
      if (response.data.code === 200) {
        setOrders(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      0: { color: 'orange', text: '待支付' },
      1: { color: 'blue', text: '已支付' },
      2: { color: 'purple', text: '服务中' },
      3: { color: 'green', text: '已完成' },
      4: { color: 'default', text: '已取消' },
      5: { color: 'red', text: '退货中' },
    };
    const info = statusMap[status] || { color: 'default', text: '未知' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleViewDetail = (record) => {
    setCurrentOrder(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await orderAPI.delete(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        fetchOrders();
      } else {
        message.error(response.data.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请稍后重试');
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await orderAPI.complete(id);
      if (response.data.code === 200) {
        message.success('操作成功');
        fetchOrders();
      } else {
        message.error(response.data.msg || '操作失败');
      }
    } catch (error) {
      message.error('操作失败，请稍后重试');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      fixed: 'left',
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'username',
      width: 100,
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (text) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{text}</span>,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '收货人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'receiver_phone',
      key: 'receiver_phone',
      width: 120,
    },
    {
      title: '服务地址',
      dataIndex: 'receiver_address',
      key: 'receiver_address',
      width: 200,
      ellipsis: true,
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 1 && (
            <Popconfirm
              title="确定标记为服务中？"
              onConfirm={() => {
                orderAPI.updateStatus(record.id, { status: 2 }).then(() => {
                  message.success('操作成功');
                  fetchOrders();
                }).catch(() => message.error('操作失败'));
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                开始服务
              </Button>
            </Popconfirm>
          )}
          {record.status === 2 && (
            <Popconfirm
              title="确定标记为已完成？"
              onConfirm={() => handleComplete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                完成
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定要删除该订单吗？"
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
        <h2 className="admin-page-title" style={{ margin: '0 0 16px 0' }}>订单管理</h2>
        
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="搜索订单号/收货人"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              placeholder="订单状态"
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 150 }}
              allowClear
            >
              <Option value={0}>待支付</Option>
              <Option value={1}>已支付</Option>
              <Option value={2}>服务中</Option>
              <Option value={3}>已完成</Option>
              <Option value={4}>已取消</Option>
              <Option value={5}>退货中</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
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
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {currentOrder && (
          <div>
            <Descriptions title="订单信息" bordered column={2} size="small">
              <Descriptions.Item label="订单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                {getStatusTag(currentOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{currentOrder.total_amount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="收货人">{currentOrder.receiver_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.receiver_phone}</Descriptions.Item>
              <Descriptions.Item label="服务地址" span={2}>
                {currentOrder.receiver_address}
              </Descriptions.Item>
              {currentOrder.remark && (
                <Descriptions.Item label="备注" span={2}>
                  {currentOrder.remark}
                </Descriptions.Item>
              )}
            </Descriptions>

            <h4 style={{ marginTop: 20, marginBottom: 12 }}>订单商品</h4>
            <Table
              dataSource={currentOrder.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            >
              <Table.Column
                title="商品图片"
                dataIndex="product_image"
                key="product_image"
                width={80}
                render={(text, record) => (
                  <Image
                    width={50}
                    height={50}
                    src={text || 'https://picsum.photos/50/50'}
                    fallback="https://picsum.photos/50/50"
                  />
                )}
              />
              <Table.Column
                title="商品名称"
                dataIndex="product_name"
                key="product_name"
              />
              <Table.Column
                title="单价"
                dataIndex="price"
                key="price"
                render={(text) => `¥${text}`}
              />
              <Table.Column
                title="数量"
                dataIndex="quantity"
                key="quantity"
              />
              <Table.Column
                title="小计"
                key="subtotal"
                render={(_, record) => (
                  <span style={{ color: '#ff4d4f' }}>¥{record.price * record.quantity}</span>
                )}
              />
            </Table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManage;
