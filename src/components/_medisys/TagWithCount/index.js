import { Button, Tag, Badge } from 'antd'
const TagWithCount = ({
  tagColor,
  label,
  tooltip,
  count,
  checked,
  onClick,
}) => {
  return (
    <span style={{ display: 'inline-block', paddingRight: 12 }}>
      <Badge
        size='small'
        style={{ paddingRight: 4, paddingLeft: 4 }}
        count={count}
      >
        {checked && (
          <Button
            style={{
              minWidth: 75,
              backgroundColor: tagColor,
              borderColor: tagColor,
              color: 'white',
            }}
            onClick={onClick}
          >
            {label}
          </Button>
        )}
        {!checked && (
          <Button
            style={{
              minWidth: 75,
              borderColor: tagColor,
              backgroundColor: 'white',
              color: tagColor,
            }}
            onClick={onClick}
          >
            {label}
          </Button>
        )}
      </Badge>
    </span>
  )
}
export default TagWithCount
