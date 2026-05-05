import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Space, Row, Col, Select, Tag, Descriptions, Divider } from 'antd';
import { EyeOutlined, DeleteOutlined, MessageOutlined, CheckCircleOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { commentAPI } from '../../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const CommentManage = () => {
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [currentComment, setCurrentComment] = useState(null);
  const [form] = Form.useForm();
  const [searchStatus, setSearchStatus] = useState(undefined);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    fetchComments();
  }, [currentPage, searchStatus, searchKeyword]);

  const fetchComments = async () => {
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
      const response = await commentAPI.getAdminList(params);
      if (response.data.code === 200) {
        setComments(response.data.data.list);
        setTotal(response.data.data.total);
      }
    } catch (error) {
      console.error('获取留言列表失败:', error);
      message.error('获取留言列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    if (status === 1) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>已回复</Tag>;
    }
    return <Tag color="orange" icon={<ClockCircleOutlined />}>待回复</Tag>;
  };

  const handleViewDetail = (record) => {
    setCurrentComment(record);
    setDetailModalVisible(true);
  };

  const handleReply = (record) => {
    setCurrentComment(record);
    form.resetFields();
    form.setFieldsValue({ reply: record.reply || '' });
    setReplyModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await commentAPI.delete(id);
      if (response.data.code === 200) {
        message.success('删除成功');
        fetchComments();
      } else {
        message.error(response.data.msg || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请稍后重试');
    }
  };

  const onReplyFinish = async (values) => {
    try {
      const response = await commentAPI.reply(currentComment.id, values);
      if (response.data.code === 200) {
        message.success('回复成功');
        setReplyModalVisible(false);
        fetchComments();
      } else {
        message.error(response.data.msg || '回复失败');
      }
    } catch (error) {
      message.error('回复失败，请稍后重试');
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
      title: '留言标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '留言内容',
      dataIndex: 'content',
      key: 'content',
      width: 250,
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'username',
      width: 100,
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '留言时间',
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
          {record.status !== 1 && (
            <Button
              type="link"
              icon={<MessageOutlined />}
              onClick={() => handleReply(record)}
            >
              回复
            </Button>
          )}
          <Popconfirm
            title="确定要删除该留言吗？"
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
        <h2 className="admin-page-title" style={{ margin: '0 0 16px 0' }}>留言管理</h2>
        
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Input
              placeholder="搜索留言标题/内容"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 220 }}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              placeholder="留言状态"
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 130 }}
              allowClear
            >
              <Option value={0}>待回复</Option>
              <Option value={1}>已回复</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={comments}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
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
        title="留言详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          currentComment?.status !== 1 && (
            <Button
              key="reply"
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleReply(currentComment);
              }}
            >
              回复
            </Button>
          ),
        ]}
        width={700}
      >
        {currentComment && (
          <div>
            <Descriptions title="留言信息" bordered column={2} size="small">
              <Descriptions.Item label="留言标题" span={2}>
                {currentComment.title}
              </Descriptions.Item>
              <Descriptions.Item label="留言用户">
                {currentComment.user?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(currentComment.status)}
              </Descriptions.Item>
              <Descriptions.Item label="留言时间">
                {dayjs(currentComment.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="回复时间">
                {currentComment.replied_at
                  ? dayjs(currentComment.replied_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <h4>留言内容</h4>
            <div
              style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 4,
                marginBottom: 16,
                whiteSpace: 'pre-wrap',
              }}
            >
              {currentComment.content}
            </div>

            {currentComment.reply && (
              <>
                <Divider />
                <h4>管理员回复</h4>
                <div
                  style={{
                    padding: 16,
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 4,
                  }}
                  dangerouslySetInnerHTML={{ __html: currentComment.reply }}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="回复留言"
        open={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onReplyFinish}
        >
          <Form.Item label="原留言">
            <div
              style={{
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                maxHeight: 120,
                overflow: 'auto',
              }}
            >
              {currentComment?.content}
            </div>
          </Form.Item>

          <Form.Item
            name="reply"
            label="回复内容（支持富文本）"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <ReactQuill
              theme="snow"
              style={{ height: 200, marginBottom: 50 }}
              placeholder="请输入回复内容"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setReplyModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              发送回复
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommentManage;
