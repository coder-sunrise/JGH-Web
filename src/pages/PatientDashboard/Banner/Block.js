import {
  primaryColor,
  dangerColor,
  roseColor,
  grayColor,
  fontColor,
  infoColor,
} from 'mui-pro-jss'

export default ({ h3, header, body }) => {
  return (
    <div style={{ padding: '8px 0', overflow: 'hidden' }}>
      {h3 && <h5 style={{ fontWeight: 500, marginBottom: 0 }}>{h3}</h5>}
      {header && <h5>{header}</h5>}
      <div>{body}</div>
    </div>
  )
}
