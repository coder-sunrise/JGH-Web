import React, { PureComponent } from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import Call from '@material-ui/icons/Call'
import Print from '@material-ui/icons/Print'
import FormatListNumberedOutlinedIcon from '@material-ui/icons/FormatListNumberedOutlined'
import { formatMessage } from 'umi'
import { connect } from 'dva'

import { withStyles } from '@material-ui/core'
import Authorized from '@/utils/Authorized'

import { GridContainer, GridItem, CardContainer, Button } from '@/components'

const menuData = [
  {
    title: 'Support',
    text: 'Contact Us',
    url: '/support/contactus',
    icon: <Call style={{ transform: 'rotate(-90deg)' }} />,
  },
  {
    title: 'Support',
    text: formatMessage({ id: 'menu.support.printingtool' }),
    url: '/support/printingtool',
    icon: <Print />,
  },
  {
    title: 'Support',
    text: 'Queue Processor',
    url: '/support/queueprocessor',
    icon: <FormatListNumberedOutlinedIcon />,
  },
]
const styles = () => ({
  bigviewBtn: {
    marginRight: 0,
    minHeight: 106,
  },
})

@connect(({ clinicSettings }) => ({
  clinicSettings: clinicSettings.settings,
}))
class Support extends PureComponent {
  constructor(props) {
    super(props)
    const accessRight = Authorized.check('support.queueprocessor')
    if (!accessRight || (accessRight && accessRight.rights !== 'enable')) {
      let index = menuData.findIndex(item => item.text === 'Queue Processor')
      if (index !== -1) {
        menuData.splice(index, 1)
      }
    }
    this.group = _.groupBy(menuData, 'title')
  }

  state = {}

  supportItems = () => {
    const { classes, theme } = this.props

    return Object.keys(this.group).map(o => {
      return (
        <GridContainer style={{ marginTop: theme.spacing(1) }} key={o}>
          {this.group[o]
            .filter(m => {
              return (
                m.text.toLocaleLowerCase().indexOf(this.state.searchText) >=
                  0 || !this.state.searchText
              )
            })
            .map((item, i) => {
              return (
                <GridItem
                  key={i}
                  xs={4}
                  md={2}
                  style={{ marginBottom: theme.spacing(2) }}
                >
                  <Button
                    fullWidth
                    bigview
                    color='primary'
                    className={classnames({
                      [classes.bigviewBtn]: true,
                    })}
                    variant='outlined'
                    onClick={() => {
                      this.props.history.push(item.url)
                    }}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </Button>
                </GridItem>
              )
            })}
        </GridContainer>
      )
    })
  }

  render() {
    return <CardContainer hideHeader>{this.supportItems()}</CardContainer>
  }
}

export default withStyles(styles, { withTheme: true })(Support)
