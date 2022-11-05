import { Popconfirm } from 'antd'
import ErrorOutline from '@material-ui/icons/ErrorOutline'

const overlayStyle = {
  maxWidth: 300,
}
export default ({ ...props }) => {
  return (
    <Popconfirm
      // global effect?
      // getPopupContainer={node => node.parentNode || document.body}
      okText='Confirm'
      overlayStyle={overlayStyle}
      icon={
        <ErrorOutline
          style={{
            position: 'relative',
            display: 'inline',
            color: 'orange',
            top: 4,
            left: -4,
          }}
        />
      }
      title='Are you sure?'
      {...props}
    />
  )
}
