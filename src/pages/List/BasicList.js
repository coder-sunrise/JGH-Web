import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import moment from 'moment'
import { connect } from 'dva'
import {
  List,
  Card,
  Row,
  Col,
  Radio,
  Input,
  Progress,
  Button,
  Icon,
  Dropdown,
  Menu,
  Avatar,
  Modal,
  Form,
  DatePicker,
  Select,
} from 'antd'

import PageHeaderWrapper from '@/components/PageHeaderWrapper'
import Result from '@/components/Result'

import styles from './BasicList.less'

const FormItem = Form.Item
const RadioButton = Radio.Button
const RadioGroup = Radio.Group
const SelectOption = Select.Option
const { Search, TextArea } = Input

@connect(({ list, loading }) => ({
  list,
  loading: loading.models.list,
}))
@Form.create()
class BasicList extends PureComponent {
  state = { visible: false, done: false }

  formLayout = {
    labelCol: { span: 7 },
    wrapperCol: { span: 13 },
  }

  componentDidMount () {
    const { dispatch } = this.props
    dispatch({
      type: 'list/fetch',
      payload: {
        count: 5,
      },
    })
  }

  showModal = () => {
    this.setState({
      visible: true,
      current: undefined,
    })
  }

  showEditModal = (item) => {
    this.setState({
      visible: true,
      current: item,
    })
  }

  handleDone = () => {
    setTimeout(() => this.addBtn.blur(), 0)
    this.setState({
      done: false,
      visible: false,
    })
  }

  handleCancel = () => {
    setTimeout(() => this.addBtn.blur(), 0)
    this.setState({
      visible: false,
    })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { dispatch, form } = this.props
    const { current } = this.state
    const id = current ? current.id : ''

    setTimeout(() => this.addBtn.blur(), 0)
    form.validateFields((err, fieldsValue) => {
      if (err) return
      this.setState({
        done: true,
      })
      dispatch({
        type: 'list/submit',
        payload: { id, ...fieldsValue },
      })
    })
  }

  deleteItem = (id) => {
    const { dispatch } = this.props
    dispatch({
      type: 'list/submit',
      payload: { id },
    })
  }

  render () {
    const { list: { list }, loading } = this.props
    const { form: { getFieldDecorator } } = this.props
    const { visible, done, current = {} } = this.state

    const editAndDelete = (key, currentItem) => {
      if (key === 'edit') this.showEditModal(currentItem)
      else if (key === 'delete') {
        Modal.confirm({
          title: '????????????',
          content: '???????????????????????????',
          okText: '??????',
          cancelText: '??????',
          onOk: () => this.deleteItem(currentItem.id),
        })
      }
    }

    const modalFooter = done
      ? { footer: null, onCancel: this.handleDone }
      : { okText: '??????', onOk: this.handleSubmit, onCancel: this.handleCancel }

    const Info = ({ title, value, bordered }) => (
      <div className={styles.headerInfo}>
        <span>{title}</span>
        <p>{value}</p>
        {bordered && <em />}
      </div>
    )

    const extraContent = (
      <div className={styles.extraContent}>
        <RadioGroup defaultValue='all'>
          <RadioButton value='all'>??????</RadioButton>
          <RadioButton value='progress'>?????????</RadioButton>
          <RadioButton value='waiting'>?????????</RadioButton>
        </RadioGroup>
        <Search
          className={styles.extraContentSearch}
          placeholder='?????????'
          onSearch={() => ({})}
        />
      </div>
    )

    const paginationProps = {
      showSizeChanger: true,
      showQuickJumper: true,
      pagesize: 5,
      total: 50,
    }

    const ListContent = ({ data: { owner, createdAt, percent, status } }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <span>Owner</span>
          <p>{owner}</p>
        </div>
        <div className={styles.listContentItem}>
          <span>????????????</span>
          <p>{moment(createdAt).format('YYYY-MM-DD HH:mm')}</p>
        </div>
        <div className={styles.listContentItem}>
          <Progress
            percent={percent}
            status={status}
            strokeWidth={6}
            style={{ width: 180 }}
          />
        </div>
      </div>
    )

    const MoreBtn = (props) => (
      <Dropdown
        overlay={
          <Menu onClick={({ key }) => editAndDelete(key, props.current)}>
            <Menu.Item key='edit'>??????</Menu.Item>
            <Menu.Item key='delete'>??????</Menu.Item>
          </Menu>
        }
      >
        <a>
          ?????? <Icon type='down' />
        </a>
      </Dropdown>
    )

    const getModalContent = () => {
      if (done) {
        return (
          <Result
            type='success'
            title='????????????'
            description='????????????????????????????????????????????????????????????'
            actions={
              <Button type='primary' onClick={this.handleDone}>
                ?????????
              </Button>
            }
            className={styles.formResult}
          />
        )
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem label='????????????' {...this.formLayout}>
            {getFieldDecorator('title', {
              rules: [
                { required: true, message: '?????????????????????' },
              ],
              initialValue: current.title,
            })(<Input placeholder='?????????' />)}
          </FormItem>
          <FormItem label='????????????' {...this.formLayout}>
            {getFieldDecorator('createdAt', {
              rules: [
                { required: true, message: '?????????????????????' },
              ],
              initialValue: current.createdAt
                ? moment(current.createdAt)
                : null,
            })(
              <DatePicker
                showTime
                placeholder='?????????'
                format='YYYY-MM-DD HH:mm:ss'
                style={{ width: '100%' }}
              />,
            )}
          </FormItem>
          <FormItem label='???????????????' {...this.formLayout}>
            {getFieldDecorator('owner', {
              rules: [
                { required: true, message: '????????????????????????' },
              ],
              initialValue: current.owner,
            })(
              <Select placeholder='?????????'>
                <SelectOption value='?????????'>?????????</SelectOption>
                <SelectOption value='?????????'>?????????</SelectOption>
              </Select>,
            )}
          </FormItem>
          <FormItem {...this.formLayout} label='????????????'>
            {getFieldDecorator('subDescription', {
              rules: [
                { message: '?????????????????????????????????????????????', min: 5 },
              ],
              initialValue: current.subDescription,
            })(<TextArea rows={4} placeholder='???????????????????????????' />)}
          </FormItem>
        </Form>
      )
    }
    return (
      <PageHeaderWrapper>
        <div className={styles.standardList}>
          <Card bordered={false}>
            <Row>
              <Col sm={8} xs={24}>
                <Info title='????????????' value='8?????????' bordered />
              </Col>
              <Col sm={8} xs={24}>
                <Info title='??????????????????????????????' value='32??????' bordered />
              </Col>
              <Col sm={8} xs={24}>
                <Info title='?????????????????????' value='24?????????' />
              </Col>
            </Row>
          </Card>

          <Card
            className={styles.listCard}
            bordered={false}
            title='????????????'
            style={{ marginTop: 24 }}
            bodyStyle={{ padding: '0 32px 40px 32px' }}
            extra={extraContent}
          >
            <Button
              type='dashed'
              style={{ width: '100%', marginBottom: 8 }}
              icon='plus'
              onClick={this.showModal}
              ref={(component) => {
                /* eslint-disable */
                this.addBtn = findDOMNode(component)
                /* eslint-enable */
              }}
            >
              ??????
            </Button>
            <List
              size='large'
              rowKey='id'
              loading={loading}
              pagination={paginationProps}
              dataSource={list}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a
                      onClick={(e) => {
                        e.preventDefault()
                        this.showEditModal(item)
                      }}
                    >
                      ??????
                    </a>,
                    <MoreBtn current={item} />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar src={item.logo} shape='square' size='large' />
                    }
                    title={<a href={item.href}>{item.title}</a>}
                    description={item.subDescription}
                  />
                  <ListContent data={item} />
                </List.Item>
              )}
            />
          </Card>
        </div>
        <Modal
          title={done ? null : `??????${current ? '??????' : '??????'}`}
          className={styles.standardListForm}
          width={640}
          bodyStyle={done ? { padding: '72px 0' } : { padding: '28px 0 0' }}
          destroyOnClose
          visible={visible}
          {...modalFooter}
        >
          {getModalContent()}
        </Modal>
      </PageHeaderWrapper>
    )
  }
}

export default BasicList
